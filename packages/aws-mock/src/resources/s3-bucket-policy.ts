import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";

export function createS3BucketPolicyHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const bucket = ctx.attributes.bucket as string;
      const policy = ctx.attributes.policy as string;

      const attributes: Record<string, unknown> = {
        id: bucket,
        bucket,
        policy,
      };

      await store.createResource("aws_s3_bucket_policy", bucket, attributes);

      return { id: bucket, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_s3_bucket_policy", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const bucket = (ctx.attributes.bucket as string) ?? id;
      const policy = ctx.attributes.policy as string;

      const attributes: Record<string, unknown> = {
        id: bucket,
        bucket,
        policy,
      };

      await store.updateResource("aws_s3_bucket_policy", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_s3_bucket_policy", id);
    },
  };
}
