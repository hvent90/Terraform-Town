import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createS3BucketHandler } from "../src/resources/s3-bucket";

describe("aws_s3_bucket handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createS3BucketHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "s3-bucket-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createS3BucketHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts bucket argument and returns computed ARN and ID", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "my-test-bucket" },
      });

      expect(result.id).toBe("my-test-bucket");
      expect(result.attributes.arn).toBe("arn:aws:s3:::my-test-bucket");
      expect(result.attributes.id).toBe("my-test-bucket");
      expect(result.attributes.bucket).toBe("my-test-bucket");
    });

    test("generates computed attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "my-test-bucket" },
      });

      expect(result.attributes.bucket_domain_name).toBe("my-test-bucket.s3.amazonaws.com");
      expect(result.attributes.bucket_regional_domain_name).toBe(
        "my-test-bucket.s3.us-east-1.amazonaws.com",
      );
      expect(result.attributes.region).toBe("us-east-1");
      expect(result.attributes.hosted_zone_id).toBeString();
    });

    test("stores resource in state", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "stored-bucket" },
      });

      const stored = await store.readResource("aws_s3_bucket", "stored-bucket");
      expect(stored).not.toBeNull();
      expect(stored!.attributes.bucket).toBe("stored-bucket");
    });
  });

  describe("read", () => {
    test("returns stored bucket attributes", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "read-bucket" },
      });

      const result = await handler.read({
        resourceType: "aws_s3_bucket",
        attributes: {},
        id: "read-bucket",
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe("read-bucket");
      expect(result!.attributes.arn).toBe("arn:aws:s3:::read-bucket");
    });

    test("returns null for non-existent bucket", async () => {
      const result = await handler.read({
        resourceType: "aws_s3_bucket",
        attributes: {},
        id: "no-such-bucket",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies bucket configuration", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "update-bucket" },
      });

      const result = await handler.update({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "update-bucket", tags: { env: "prod" } },
        id: "update-bucket",
      });

      expect(result.attributes.tags).toEqual({ env: "prod" });
      expect(result.attributes.arn).toBe("arn:aws:s3:::update-bucket");
    });
  });

  describe("delete", () => {
    test("removes bucket from state", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "delete-bucket" },
      });

      await handler.delete({
        resourceType: "aws_s3_bucket",
        attributes: {},
        id: "delete-bucket",
      });

      const result = await store.readResource("aws_s3_bucket", "delete-bucket");
      expect(result).toBeNull();
    });
  });

  describe("validation", () => {
    test("rejects invalid bucket names on create", async () => {
      await expect(
        handler.create({
          resourceType: "aws_s3_bucket",
          attributes: { bucket: "AB" },
        }),
      ).rejects.toThrow();
    });

    test("rejects invalid bucket names on update", async () => {
      await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "valid-bucket" },
      });

      await expect(
        handler.update({
          resourceType: "aws_s3_bucket",
          attributes: { bucket: "AB" },
          id: "valid-bucket",
        }),
      ).rejects.toThrow();
    });
  });

  describe("optional arguments", () => {
    test("handles tags", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: {
          bucket: "tagged-bucket",
          tags: { Name: "My Bucket", env: "dev" },
        },
      });

      expect(result.attributes.tags).toEqual({
        Name: "My Bucket",
        env: "dev",
      });
      expect(result.attributes.tags_all).toEqual({
        Name: "My Bucket",
        env: "dev",
      });
    });

    test("handles force_destroy", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: {
          bucket: "force-bucket",
          force_destroy: true,
        },
      });

      expect(result.attributes.force_destroy).toBe(true);
    });

    test("sets default values for optional attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_s3_bucket",
        attributes: { bucket: "default-bucket" },
      });

      expect(result.attributes.force_destroy).toBe(false);
      expect(result.attributes.tags).toEqual({});
      expect(result.attributes.tags_all).toEqual({});
    });
  });
});
