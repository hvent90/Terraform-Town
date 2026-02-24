import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import type { ResourceDefinition } from "../utils/schema-parser";
import { parseResourceDefinition } from "../utils/schema-parser";
import { generateResourceId } from "./id-patterns";
import { generateResourceArn } from "./arn-patterns";

const DEFAULT_REGION = "us-east-1";

// Internal schema cache so each type is parsed once
const schemaCache = new Map<string, ResourceDefinition>();

async function getSchema(resourceType: string): Promise<ResourceDefinition> {
  let schema = schemaCache.get(resourceType);
  if (!schema) {
    schema = await parseResourceDefinition(resourceType);
    schemaCache.set(resourceType, schema);
  }
  return schema;
}

function defaultForType(type: string): unknown {
  if (type === "bool") return false;
  if (type === "number") return 0;
  if (type === "string") return "";
  if (type.startsWith("map(")) return {};
  if (type.startsWith("list(")) return [];
  if (type.startsWith("set(")) return [];
  return null;
}

function buildAttributes(
  schema: ResourceDefinition,
  provided: Record<string, unknown>,
  id: string,
  resourceType: string,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = { ...provided, id };

  // Set defaults for optional attrs not provided
  for (const attr of schema.optionalArgs) {
    if (!(attr.name in attrs)) {
      attrs[attr.name] = defaultForType(attr.type);
    }
  }

  // Handle tags/tags_all
  if ("tags" in attrs) {
    attrs.tags_all = { ...((attrs.tags as Record<string, string>) ?? {}) };
  }

  // Generate ARN if the schema has a computed `arn` attribute
  const hasArn = schema.computedAttrs.some((a) => a.name === "arn");
  if (hasArn && !attrs.arn) {
    const arn = generateResourceArn(resourceType, id, DEFAULT_REGION);
    if (arn) {
      attrs.arn = arn;
    }
  }

  return attrs;
}

export async function createGenericHandler(
  resourceType: string,
  store: StateStore,
): Promise<ResourceHandler> {
  const schema = await getSchema(resourceType);

  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const id = generateResourceId(resourceType, ctx.attributes);
      const attributes = buildAttributes(schema, ctx.attributes, id, resourceType);

      await store.createResource(resourceType, id, attributes);
      return { id, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      return store.readResource(resourceType, ctx.id!);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const existing = await store.readResource(resourceType, id);
      if (!existing) {
        throw new Error(`Resource ${resourceType}/${id} not found`);
      }

      const merged = { ...existing.attributes, ...ctx.attributes, id };

      // Regenerate tags_all on update
      if ("tags" in ctx.attributes) {
        merged.tags_all = { ...((merged.tags as Record<string, string>) ?? {}) };
      }

      // Regenerate ARN if applicable
      const hasArn = schema.computedAttrs.some((a) => a.name === "arn");
      if (hasArn) {
        const arn = generateResourceArn(resourceType, id, DEFAULT_REGION);
        if (arn) {
          merged.arn = arn;
        }
      }

      await store.updateResource(resourceType, id, merged);
      return { id, attributes: merged };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      await store.deleteResource(resourceType, ctx.id!);
    },
  };
}
