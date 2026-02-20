/**
 * Generates Go terraform-plugin-sdk schema code from the AWS provider JSON schema.
 *
 * Usage: bun scripts/generate-go-schema.ts <resource_type>
 * Example: bun scripts/generate-go-schema.ts aws_s3_bucket
 */

import { join } from "path";

const SCHEMA_PATH = join(import.meta.dir, "../packages/aws-mock/schema/aws-provider-schema.json");
const PROVIDER_KEY = "registry.terraform.io/hashicorp/aws";

interface SchemaAttribute {
  type: string | [string, string] | [string, [string, string]];
  required?: boolean;
  optional?: boolean;
  computed?: boolean;
  description?: string;
}

interface SchemaBlockType {
  nesting_mode: string;
  block: {
    attributes?: Record<string, SchemaAttribute>;
    block_types?: Record<string, SchemaBlockType>;
  };
  min_items?: number;
  max_items?: number;
}

function goType(type: SchemaAttribute["type"]): string {
  if (typeof type === "string") {
    switch (type) {
      case "string":
        return "schema.TypeString";
      case "number":
        return "schema.TypeFloat";
      case "bool":
        return "schema.TypeBool";
      default:
        return "schema.TypeString";
    }
  }

  if (Array.isArray(type)) {
    const [kind] = type;
    switch (kind) {
      case "map":
        return "schema.TypeMap";
      case "list":
        return "schema.TypeList";
      case "set":
        return "schema.TypeSet";
      default:
        return "schema.TypeString";
    }
  }

  return "schema.TypeString";
}

function goElem(type: SchemaAttribute["type"]): string | null {
  if (typeof type === "string") return null;

  if (Array.isArray(type)) {
    const [kind, inner] = type;
    if (kind === "map" || kind === "list" || kind === "set") {
      const innerType = typeof inner === "string" ? inner : "string";
      const goInner =
        innerType === "string"
          ? "schema.TypeString"
          : innerType === "number"
            ? "schema.TypeFloat"
            : innerType === "bool"
              ? "schema.TypeBool"
              : "schema.TypeString";
      return `&schema.Schema{Type: ${goInner}}`;
    }
  }

  return null;
}

function indent(s: string, level: number): string {
  const prefix = "\t".repeat(level);
  return s
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : prefix + line))
    .join("\n");
}

function generateSchemaMap(
  attributes: Record<string, SchemaAttribute> | undefined,
  blockTypes: Record<string, SchemaBlockType> | undefined,
  level: number,
): string {
  const entries: string[] = [];

  // Attributes
  if (attributes) {
    const sorted = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, attr] of sorted) {
      const fields: string[] = [];
      fields.push(`Type: ${goType(attr.type)}`);

      if (attr.required) fields.push("Required: true");
      if (attr.optional) fields.push("Optional: true");
      if (attr.computed) fields.push("Computed: true");

      const elem = goElem(attr.type);
      if (elem) fields.push(`Elem: ${elem}`);

      entries.push(`"${name}": {\n${fields.map((f) => "\t" + f + ",").join("\n")}\n}`);
    }
  }

  // Block types (nested blocks)
  if (blockTypes) {
    const sorted = Object.entries(blockTypes).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, bt] of sorted) {
      const fields: string[] = [];

      // Determine Go type based on nesting mode
      if (bt.nesting_mode === "set") {
        fields.push("Type: schema.TypeSet");
      } else {
        fields.push("Type: schema.TypeList");
      }

      if (bt.nesting_mode === "single") {
        fields.push("MaxItems: 1");
      } else if (bt.max_items) {
        fields.push(`MaxItems: ${bt.max_items}`);
      }

      if (bt.min_items) {
        fields.push(`MinItems: ${bt.min_items}`);
      }

      fields.push("Optional: true");
      fields.push("Computed: true");

      // Generate inner schema
      const innerSchema = generateSchemaMap(bt.block.attributes, bt.block.block_types, level + 2);
      fields.push(
        `Elem: &schema.Resource{\n\tSchema: map[string]*schema.Schema{\n${indent(innerSchema, 2)}\n\t},\n}`,
      );

      entries.push(`"${name}": {\n${fields.map((f) => "\t" + f + ",").join("\n")}\n}`);
    }
  }

  return entries.map((e) => indent(e, level) + ",").join("\n");
}

function generateResourceFunc(resourceType: string, block: SchemaBlockType["block"]): string {
  const funcName = resourceType
    .replace(/^aws_/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const schemaMap = generateSchemaMap(block.attributes, block.block_types, 3);

  return `func resource${funcName}Schema() map[string]*schema.Schema {
\treturn map[string]*schema.Schema{
${schemaMap}
\t}
}`;
}

async function main() {
  const resourceType = process.argv[2];
  if (!resourceType) {
    console.error("Usage: bun scripts/generate-go-schema.ts <resource_type>");
    process.exit(1);
  }

  const schema = await Bun.file(SCHEMA_PATH).json();
  const resourceSchemas = schema.provider_schemas[PROVIDER_KEY].resource_schemas;
  const resource = resourceSchemas[resourceType];

  if (!resource) {
    console.error(`Unknown resource type: ${resourceType}`);
    process.exit(1);
  }

  const code = generateResourceFunc(resourceType, resource.block);

  console.log(`package main

import (
\t"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

${code}`);
}

main();
