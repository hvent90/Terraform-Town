import { join } from "path";

const SCHEMA_PATH = join(import.meta.dir, "../../schema/aws-provider-schema.json");
const PROVIDER_KEY = "registry.terraform.io/hashicorp/aws";

interface SchemaAttribute {
  type: string | [string, string] | [string, [string, string]];
  required?: boolean;
  optional?: boolean;
  computed?: boolean;
  description?: string;
  deprecated?: boolean;
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

export interface AttributeInfo {
  name: string;
  type: string;
  computed: boolean;
  optional: boolean;
  required: boolean;
}

export interface NestedBlockInfo {
  name: string;
  nestingMode: string;
  attributes: AttributeInfo[];
  minItems?: number;
  maxItems?: number;
}

export interface ResourceDefinition {
  requiredArgs: AttributeInfo[];
  optionalArgs: AttributeInfo[];
  computedAttrs: AttributeInfo[];
  nestedBlocks: NestedBlockInfo[];
}

function normalizeType(type: string | [string, string] | [string, [string, string]]): string {
  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    const [kind, inner] = type;
    if (typeof inner === "string") return `${kind}(${inner})`;
    if (Array.isArray(inner)) return `${kind}(${inner.join(", ")})`;
  }
  return String(type);
}

function parseAttributes(attrs: Record<string, SchemaAttribute>): AttributeInfo[] {
  return Object.entries(attrs).map(([name, attr]) => ({
    name,
    type: normalizeType(attr.type),
    computed: !!attr.computed,
    optional: !!attr.optional,
    required: !!attr.required,
  }));
}

export async function parseResourceDefinition(resourceType: string): Promise<ResourceDefinition> {
  const file = Bun.file(SCHEMA_PATH);
  const schema = await file.json();

  const resourceSchemas = schema.provider_schemas[PROVIDER_KEY].resource_schemas;
  const resource = resourceSchemas[resourceType];

  if (!resource) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const block = resource.block;
  const allAttrs = block.attributes ? parseAttributes(block.attributes) : [];

  const requiredArgs = allAttrs.filter((a) => a.required);
  const optionalArgs = allAttrs.filter((a) => a.optional);
  const computedAttrs = allAttrs.filter((a) => a.computed && !a.optional);

  const nestedBlocks: NestedBlockInfo[] = block.block_types
    ? Object.entries(block.block_types).map(([name, bt]: [string, unknown]) => {
        const blockType = bt as SchemaBlockType;
        return {
          name,
          nestingMode: blockType.nesting_mode,
          attributes: blockType.block.attributes ? parseAttributes(blockType.block.attributes) : [],
          minItems: blockType.min_items,
          maxItems: blockType.max_items,
        };
      })
    : [];

  return { requiredArgs, optionalArgs, computedAttrs, nestedBlocks };
}
