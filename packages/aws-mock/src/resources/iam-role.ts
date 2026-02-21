import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import { generateIamRoleArn, generateIamUniqueId } from "../utils/computed";
import { validatePolicyJson } from "../utils/validation";

export function createIamRoleHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const name = ctx.attributes.name as string;
      const assumeRolePolicy = ctx.attributes.assume_role_policy as string;

      const policyError = validatePolicyJson(assumeRolePolicy);
      if (policyError) {
        throw new Error(policyError);
      }

      const path = (ctx.attributes.path as string) ?? "/";
      const uniqueId = generateIamUniqueId();

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        id: name,
        arn: generateIamRoleArn(name),
        name,
        path,
        assume_role_policy: assumeRolePolicy,
        unique_id: uniqueId,
        create_date: new Date().toISOString(),
        force_detach_policies: ctx.attributes.force_detach_policies ?? false,
        max_session_duration: ctx.attributes.max_session_duration ?? 3600,
        tags: ctx.attributes.tags ?? {},
        tags_all: { ...((ctx.attributes.tags as Record<string, string>) ?? {}) },
      };

      await store.createResource("aws_iam_role", name, attributes);

      return { id: name, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_iam_role", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const assumeRolePolicy = ctx.attributes.assume_role_policy as string;

      if (assumeRolePolicy) {
        const policyError = validatePolicyJson(assumeRolePolicy);
        if (policyError) {
          throw new Error(policyError);
        }
      }

      const name = (ctx.attributes.name as string) ?? id;
      const path = (ctx.attributes.path as string) ?? "/";

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        id,
        arn: generateIamRoleArn(name),
        name,
        path,
        assume_role_policy: assumeRolePolicy,
        tags: ctx.attributes.tags ?? {},
        tags_all: { ...((ctx.attributes.tags as Record<string, string>) ?? {}) },
      };

      await store.updateResource("aws_iam_role", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_iam_role", id);
    },
  };
}
