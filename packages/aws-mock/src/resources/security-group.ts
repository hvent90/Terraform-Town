import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import {
  generateSecurityGroupId,
  generateSecurityGroupArn,
  generateAccountId,
} from "../utils/computed";

const DEFAULT_REGION = "us-east-1";

function buildComputedAttributes(sgId: string, region: string): Record<string, unknown> {
  return {
    id: sgId,
    arn: generateSecurityGroupArn(sgId, region),
    owner_id: generateAccountId(),
  };
}

export function createSecurityGroupHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const sgId = generateSecurityGroupId();
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(sgId, region),
        name: ctx.attributes.name ?? "",
        name_prefix: ctx.attributes.name_prefix ?? "",
        description: ctx.attributes.description ?? "Managed by Terraform",
        revoke_rules_on_delete: ctx.attributes.revoke_rules_on_delete ?? false,
        egress: ctx.attributes.egress ?? [],
        ingress: ctx.attributes.ingress ?? [],
        tags,
        tags_all: { ...tags },
      };

      await store.createResource("aws_security_group", sgId, attributes);

      return { id: sgId, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_security_group", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const existing = await store.readResource("aws_security_group", id);
      const region = DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...existing?.attributes,
        ...ctx.attributes,
        arn: generateSecurityGroupArn(id, region),
        id,
        owner_id: generateAccountId(),
        tags,
        tags_all: { ...tags },
      };

      await store.updateResource("aws_security_group", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_security_group", id);
    },
  };
}
