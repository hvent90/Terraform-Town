import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createS3BucketHandler } from "../src/resources/s3-bucket";
import { createS3BucketPolicyHandler } from "../src/resources/s3-bucket-policy";

describe("aws_s3_bucket_policy handler", () => {
  let tempDir: string;
  let store: StateStore;
  let bucketHandler: ReturnType<typeof createS3BucketHandler>;
  let handler: ReturnType<typeof createS3BucketPolicyHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "s3-bucket-policy-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    bucketHandler = createS3BucketHandler(store);
    handler = createS3BucketPolicyHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts bucket and policy arguments", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "my-bucket",
          policy: JSON.stringify({ Version: "2012-10-17", Statement: [] }),
        },
      });

      expect(result.id).toBe("my-bucket");
      expect(result.attributes.bucket).toBe("my-bucket");
      expect(result.attributes.policy).toBe(
        JSON.stringify({ Version: "2012-10-17", Statement: [] }),
      );
    });

    test("sets computed id to bucket name", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "policy-bucket",
          policy: "{}",
        },
      });

      expect(result.id).toBe("policy-bucket");
      expect(result.attributes.id).toBe("policy-bucket");
    });

    test("stores resource in state", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "stored-bucket",
          policy: "{}",
        },
      });

      const stored = await store.readResource("aws_s3_bucket_policy", "stored-bucket");
      expect(stored).not.toBeNull();
      expect(stored!.attributes.bucket).toBe("stored-bucket");
    });

    test("can reference aws_s3_bucket ARN in policy", async () => {
      // Create a bucket first
      const bucket = await bucketHandler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "ref-bucket" },
      });

      // Create policy referencing the bucket's ARN (as Terraform would resolve it)
      const policyDoc = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: bucket.attributes.arn,
          },
        ],
      });

      const result = await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "ref-bucket",
          policy: policyDoc,
        },
      });

      expect(result.attributes.policy).toBe(policyDoc);
      expect(result.attributes.policy).toContain("arn:aws:s3:::ref-bucket");
    });
  });

  describe("read", () => {
    test("returns stored policy", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "read-bucket",
          policy: '{"Version":"2012-10-17"}',
        },
      });

      const result = await handler.read({
        resourceType: "aws_s3_bucket_policy",
        attributes: {},
        id: "read-bucket",
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe("read-bucket");
      expect(result!.attributes.policy).toBe('{"Version":"2012-10-17"}');
    });

    test("returns null for non-existent policy", async () => {
      const result = await handler.read({
        resourceType: "aws_s3_bucket_policy",
        attributes: {},
        id: "no-such-bucket",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies policy", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "update-bucket",
          policy: '{"old":"policy"}',
        },
      });

      const result = await handler.update({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "update-bucket",
          policy: '{"new":"policy"}',
        },
        id: "update-bucket",
      });

      expect(result.attributes.policy).toBe('{"new":"policy"}');
      expect(result.attributes.bucket).toBe("update-bucket");
    });
  });

  describe("delete", () => {
    test("removes policy from state", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket_policy",
        attributes: {
          bucket: "delete-bucket",
          policy: "{}",
        },
      });

      await handler.delete({
        resourceType: "aws_s3_bucket_policy",
        attributes: {},
        id: "delete-bucket",
      });

      const result = await store.readResource("aws_s3_bucket_policy", "delete-bucket");
      expect(result).toBeNull();
    });
  });
});
