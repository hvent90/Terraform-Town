package main

import (
	"encoding/json"
	"testing"

	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func TestDynamicResourceCount(t *testing.T) {
	resources := buildAllDynamicResources()
	if len(resources) != 1526 {
		t.Errorf("expected 1526 dynamic resources, got %d", len(resources))
	}
}

func TestDynamicResourceHasCRUD(t *testing.T) {
	resources := buildAllDynamicResources()

	spotChecks := []string{"aws_sqs_queue", "aws_lambda_function", "aws_dynamodb_table", "aws_sns_topic"}
	for _, name := range spotChecks {
		res, ok := resources[name]
		if !ok {
			t.Errorf("missing dynamic resource: %s", name)
			continue
		}
		if res.CreateContext == nil {
			t.Errorf("%s missing CreateContext", name)
		}
		if res.ReadContext == nil {
			t.Errorf("%s missing ReadContext", name)
		}
		if res.UpdateContext == nil {
			t.Errorf("%s missing UpdateContext", name)
		}
		if res.DeleteContext == nil {
			t.Errorf("%s missing DeleteContext", name)
		}
	}
}

func TestConvertPrimitiveTypes(t *testing.T) {
	tests := []struct {
		input    string
		expected schema.ValueType
	}{
		{`"string"`, schema.TypeString},
		{`"number"`, schema.TypeInt},
		{`"bool"`, schema.TypeBool},
	}

	for _, tt := range tests {
		typ, elem := convertType(json.RawMessage(tt.input))
		if typ != tt.expected {
			t.Errorf("convertType(%s) = %v, want %v", tt.input, typ, tt.expected)
		}
		if elem != nil {
			t.Errorf("convertType(%s) elem should be nil, got %v", tt.input, elem)
		}
	}
}

func TestConvertCollectionTypes(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected schema.ValueType
		elemType schema.ValueType
	}{
		{"list of string", `["list", "string"]`, schema.TypeList, schema.TypeString},
		{"set of string", `["set", "string"]`, schema.TypeSet, schema.TypeString},
		{"map of string", `["map", "string"]`, schema.TypeMap, schema.TypeString},
		{"list of number", `["list", "number"]`, schema.TypeList, schema.TypeInt},
		{"set of bool", `["set", "bool"]`, schema.TypeSet, schema.TypeBool},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			typ, elem := convertType(json.RawMessage(tt.input))
			if typ != tt.expected {
				t.Errorf("type = %v, want %v", typ, tt.expected)
			}
			s, ok := elem.(*schema.Schema)
			if !ok {
				t.Fatalf("elem should be *schema.Schema, got %T", elem)
			}
			if s.Type != tt.elemType {
				t.Errorf("elem type = %v, want %v", s.Type, tt.elemType)
			}
		})
	}
}

func TestConvertObjectInCollection(t *testing.T) {
	input := `["set", ["object", {"name": "string", "count": "number"}]]`

	typ, elem := convertType(json.RawMessage(input))
	if typ != schema.TypeSet {
		t.Fatalf("type = %v, want TypeSet", typ)
	}

	res, ok := elem.(*schema.Resource)
	if !ok {
		t.Fatalf("elem should be *schema.Resource, got %T", elem)
	}

	nameField, ok := res.Schema["name"]
	if !ok {
		t.Fatal("missing 'name' field in object schema")
	}
	if nameField.Type != schema.TypeString {
		t.Errorf("name type = %v, want TypeString", nameField.Type)
	}

	countField, ok := res.Schema["count"]
	if !ok {
		t.Fatal("missing 'count' field in object schema")
	}
	if countField.Type != schema.TypeInt {
		t.Errorf("count type = %v, want TypeInt", countField.Type)
	}
}

func TestHandWrittenOverridesDynamic(t *testing.T) {
	p := Provider()

	s3 := p.ResourcesMap["aws_s3_bucket"]
	if s3 == nil {
		t.Fatal("aws_s3_bucket missing from provider")
	}

	fd, ok := s3.Schema["force_destroy"]
	if !ok {
		t.Fatal("aws_s3_bucket missing force_destroy")
	}

	if !fd.Optional {
		t.Error("force_destroy should be Optional (hand-written)")
	}
	if fd.Computed {
		t.Error("force_destroy should NOT be Computed (hand-written override)")
	}
}

func TestTimeoutsSkipped(t *testing.T) {
	resources := buildAllDynamicResources()

	for name, res := range resources {
		if _, ok := res.Schema["timeouts"]; ok {
			t.Errorf("%s schema should not contain 'timeouts' key", name)
		}
	}
}

func TestIdSkipped(t *testing.T) {
	resources := buildAllDynamicResources()

	for name, res := range resources {
		if _, ok := res.Schema["id"]; ok {
			t.Errorf("%s schema should not contain 'id' key", name)
		}
	}
}
