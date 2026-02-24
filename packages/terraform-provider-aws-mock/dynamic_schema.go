package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

//go:embed schema/aws-provider-schema.json
var rawProviderSchema []byte

// --- JSON schema types ---

type providerSchemaFile struct {
	ProviderSchemas map[string]providerEntry `json:"provider_schemas"`
}

type providerEntry struct {
	ResourceSchemas map[string]resourceSchema `json:"resource_schemas"`
}

type resourceSchema struct {
	Block blockSchema `json:"block"`
}

type blockSchema struct {
	Attributes map[string]attributeSchema `json:"attributes"`
	BlockTypes map[string]blockTypeSchema `json:"block_types"`
}

type attributeSchema struct {
	Type        json.RawMessage `json:"type"`
	Optional    bool            `json:"optional"`
	Required    bool            `json:"required"`
	Computed    bool            `json:"computed"`
	Sensitive   bool            `json:"sensitive"`
}

type blockTypeSchema struct {
	NestingMode string      `json:"nesting_mode"`
	Block       blockSchema `json:"block"`
	MinItems    int         `json:"min_items"`
	MaxItems    int         `json:"max_items"`
}

// --- Parse ---

func parseProviderSchema() map[string]resourceSchema {
	var file providerSchemaFile
	if err := json.Unmarshal(rawProviderSchema, &file); err != nil {
		panic(fmt.Sprintf("failed to parse embedded provider schema: %v", err))
	}
	entry, ok := file.ProviderSchemas["registry.terraform.io/hashicorp/aws"]
	if !ok {
		panic("missing registry.terraform.io/hashicorp/aws in provider schema")
	}
	return entry.ResourceSchemas
}

// --- Type conversion ---

func convertType(raw json.RawMessage) (schema.ValueType, interface{}) {
	// Try string first (primitive)
	var str string
	if json.Unmarshal(raw, &str) == nil {
		switch str {
		case "string":
			return schema.TypeString, nil
		case "number":
			return schema.TypeInt, nil
		case "bool":
			return schema.TypeBool, nil
		default:
			return schema.TypeString, nil
		}
	}

	// Array form: ["list", "string"], ["set", ["object", {...}]], etc.
	var arr []json.RawMessage
	if json.Unmarshal(raw, &arr) != nil || len(arr) < 2 {
		return schema.TypeString, nil
	}

	var kind string
	if json.Unmarshal(arr[0], &kind) != nil {
		return schema.TypeString, nil
	}

	switch kind {
	case "object":
		// Bare ["object", {...}] — map to TypeList + MaxItems:1 with nested Resource
		return schema.TypeList, convertObjectFields(arr[1])

	case "list", "set", "map":
		sdkType := schema.TypeList
		if kind == "set" {
			sdkType = schema.TypeSet
		} else if kind == "map" {
			sdkType = schema.TypeMap
		}
		elem := convertElem(arr[1])
		return sdkType, elem

	default:
		return schema.TypeString, nil
	}
}

// convertElem returns the Elem value for a collection's inner type.
func convertElem(raw json.RawMessage) interface{} {
	// Primitive inner type?
	var inner string
	if json.Unmarshal(raw, &inner) == nil {
		switch inner {
		case "string":
			return &schema.Schema{Type: schema.TypeString}
		case "number":
			return &schema.Schema{Type: schema.TypeInt}
		case "bool":
			return &schema.Schema{Type: schema.TypeBool}
		default:
			return &schema.Schema{Type: schema.TypeString}
		}
	}

	// Array inner type: ["object", {...}] or nested collection
	var arr []json.RawMessage
	if json.Unmarshal(raw, &arr) != nil || len(arr) < 2 {
		return &schema.Schema{Type: schema.TypeString}
	}

	var kind string
	if json.Unmarshal(arr[0], &kind) != nil {
		return &schema.Schema{Type: schema.TypeString}
	}

	if kind == "object" {
		return convertObjectFields(arr[1])
	}

	// Nested collection (e.g. ["list", "string"]) — flatten to TypeString
	return &schema.Schema{Type: schema.TypeString}
}

// convertObjectFields turns a JSON object map into a *schema.Resource.
func convertObjectFields(raw json.RawMessage) *schema.Resource {
	var fields map[string]json.RawMessage
	if json.Unmarshal(raw, &fields) != nil {
		return &schema.Resource{Schema: map[string]*schema.Schema{}}
	}

	s := make(map[string]*schema.Schema, len(fields))
	for name, fieldType := range fields {
		ft, elem := convertType(fieldType)
		field := &schema.Schema{
			Type:     ft,
			Optional: true,
			Computed: true,
		}
		if elem != nil {
			field.Elem = elem
			if ft == schema.TypeList {
				// Check if this is a bare object (not a collection) — use MaxItems:1
				if _, isResource := elem.(*schema.Resource); isResource {
					field.MaxItems = 1
				}
			}
		}
		s[name] = field
	}
	return &schema.Resource{Schema: s}
}

// --- Block conversion ---

func convertBlock(block blockSchema) map[string]*schema.Schema {
	result := make(map[string]*schema.Schema)

	// Attributes
	for name, attr := range block.Attributes {
		if name == "id" {
			continue
		}

		sdkType, elem := convertType(attr.Type)

		s := &schema.Schema{
			Type:      sdkType,
			Optional:  attr.Optional,
			Required:  attr.Required,
			Computed:  attr.Computed,
			Sensitive: attr.Sensitive,
		}

		if elem != nil {
			s.Elem = elem
			// Bare ["object", {...}] at attribute level
			if sdkType == schema.TypeList {
				if _, isResource := elem.(*schema.Resource); isResource {
					s.MaxItems = 1
				}
			}
		}

		result[name] = s
	}

	// Block types
	for name, bt := range block.BlockTypes {
		if name == "timeouts" {
			continue
		}

		innerSchema := convertBlock(bt.Block)

		s := &schema.Schema{
			Elem: &schema.Resource{Schema: innerSchema},
		}

		switch bt.NestingMode {
		case "set":
			s.Type = schema.TypeSet
		case "single":
			s.Type = schema.TypeList
			s.MaxItems = 1
		default: // "list"
			s.Type = schema.TypeList
		}

		if bt.MaxItems > 0 {
			s.MaxItems = bt.MaxItems
		}
		if bt.MinItems > 0 {
			s.MinItems = bt.MinItems
		}

		if bt.MinItems >= 1 {
			s.Required = true
		} else {
			s.Optional = true
			s.Computed = true
		}

		result[name] = s
	}

	return result
}

// --- Generic CRUD factory ---

func buildDynamicResource(resourceType string, schemaMap map[string]*schema.Schema) *schema.Resource {
	return &schema.Resource{
		CreateContext: func(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
			client := meta.(*MockClient)
			attrs := extractAttributes(d, schemaMap)
			result, err := client.CreateResource(resourceType, attrs)
			if err != nil {
				return diag.FromErr(err)
			}
			d.SetId(result.ID)
			return setAttributes(d, result.Attributes, schemaMap)
		},
		ReadContext: func(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
			client := meta.(*MockClient)
			result, err := client.ReadResource(resourceType, d.Id())
			if err != nil {
				return diag.FromErr(err)
			}
			if result == nil {
				d.SetId("")
				return nil
			}
			return setAttributes(d, result.Attributes, schemaMap)
		},
		UpdateContext: func(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
			client := meta.(*MockClient)
			attrs := extractAttributes(d, schemaMap)
			result, err := client.UpdateResource(resourceType, d.Id(), attrs)
			if err != nil {
				return diag.FromErr(err)
			}
			return setAttributes(d, result.Attributes, schemaMap)
		},
		DeleteContext: func(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
			client := meta.(*MockClient)
			if err := client.DeleteResource(resourceType, d.Id()); err != nil {
				return diag.FromErr(err)
			}
			d.SetId("")
			return nil
		},
		Schema: schemaMap,
	}
}

// --- Entry point ---

func buildAllDynamicResources() map[string]*schema.Resource {
	schemas := parseProviderSchema()
	resources := make(map[string]*schema.Resource, len(schemas))

	for resourceType, rs := range schemas {
		schemaMap := convertBlock(rs.Block)
		resources[resourceType] = buildDynamicResource(resourceType, schemaMap)
	}

	return resources
}
