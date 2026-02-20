import type { ResourceHandler, ResourceContext, ResourceResult } from "./types";
import type { StateStore } from "../state/store";
import { generateS3Arn, generateS3Id, generateS3Domain } from "../utils/computed";

const DEFAULT_REGION = "us-east-1";
const S3_HOSTED_ZONE_ID = "Z3AQBSTGFYJSTF"; // us-east-1

function buildComputedAttributes(bucket: string, region: string): Record<string, unknown> {
  return {
    id: generateS3Id(bucket),
    arn: generateS3Arn(bucket),
    bucket_domain_name: generateS3Domain(bucket, "us-east-1"),
    bucket_regional_domain_name: `${bucket}.s3.${region}.amazonaws.com`,
    hosted_zone_id: S3_HOSTED_ZONE_ID,
    region,
  };
}

export function createS3BucketHandler(store: StateStore): ResourceHandler {
  return {
    async create(ctx: ResourceContext): Promise<ResourceResult> {
      const bucket = ctx.attributes.bucket as string;
      const region = (ctx.attributes.region as string) ?? DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(bucket, region),
        bucket,
        force_destroy: ctx.attributes.force_destroy ?? false,
        tags,
        tags_all: { ...tags },
      };

      await store.createResource("aws_s3_bucket", bucket, attributes);

      return { id: bucket, attributes };
    },

    async read(ctx: ResourceContext): Promise<ResourceResult | null> {
      const id = ctx.id!;
      return store.readResource("aws_s3_bucket", id);
    },

    async update(ctx: ResourceContext): Promise<ResourceResult> {
      const id = ctx.id!;
      const bucket = (ctx.attributes.bucket as string) ?? id;
      const region = (ctx.attributes.region as string) ?? DEFAULT_REGION;
      const tags = (ctx.attributes.tags as Record<string, string>) ?? {};

      const attributes: Record<string, unknown> = {
        ...ctx.attributes,
        ...buildComputedAttributes(bucket, region),
        bucket,
        force_destroy: ctx.attributes.force_destroy ?? false,
        tags,
        tags_all: { ...tags },
      };

      await store.updateResource("aws_s3_bucket", id, attributes);

      return { id, attributes };
    },

    async delete(ctx: ResourceContext): Promise<void> {
      const id = ctx.id!;
      await store.deleteResource("aws_s3_bucket", id);
    },
  };
}
