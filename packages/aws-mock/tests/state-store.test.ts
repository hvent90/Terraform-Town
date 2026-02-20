import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";

describe("StateStore", () => {
  let tempDir: string;
  let store: StateStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "state-store-test-"));
    store = new StateStore(join(tempDir, "state.json"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("createResource", () => {
    test("writes resource to state file", async () => {
      await store.createResource("aws_s3_bucket", "my-bucket", {
        bucket: "my-bucket",
        arn: "arn:aws:s3:::my-bucket",
      });

      const raw = await readFile(join(tempDir, "state.json"), "utf-8");
      const state = JSON.parse(raw);
      expect(state.resources.aws_s3_bucket["my-bucket"]).toEqual({
        id: "my-bucket",
        attributes: {
          bucket: "my-bucket",
          arn: "arn:aws:s3:::my-bucket",
        },
      });
    });

    test("state file is valid JSON after create", async () => {
      await store.createResource("aws_s3_bucket", "b1", { bucket: "b1" });

      const raw = await readFile(join(tempDir, "state.json"), "utf-8");
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    test("supports multiple resource types", async () => {
      await store.createResource("aws_s3_bucket", "b1", { bucket: "b1" });
      await store.createResource("aws_s3_bucket_policy", "p1", {
        bucket: "b1",
        policy: "{}",
      });

      const b = await store.readResource("aws_s3_bucket", "b1");
      const p = await store.readResource("aws_s3_bucket_policy", "p1");
      expect(b).not.toBeNull();
      expect(p).not.toBeNull();
    });
  });

  describe("readResource", () => {
    test("returns stored resource", async () => {
      await store.createResource("aws_s3_bucket", "my-bucket", {
        bucket: "my-bucket",
        arn: "arn:aws:s3:::my-bucket",
      });

      const result = await store.readResource("aws_s3_bucket", "my-bucket");
      expect(result).toEqual({
        id: "my-bucket",
        attributes: {
          bucket: "my-bucket",
          arn: "arn:aws:s3:::my-bucket",
        },
      });
    });

    test("returns null for non-existent resource", async () => {
      const result = await store.readResource("aws_s3_bucket", "no-such");
      expect(result).toBeNull();
    });

    test("returns null for non-existent resource type", async () => {
      const result = await store.readResource("aws_nonexistent", "id1");
      expect(result).toBeNull();
    });
  });

  describe("updateResource", () => {
    test("modifies existing resource", async () => {
      await store.createResource("aws_s3_bucket", "my-bucket", {
        bucket: "my-bucket",
        tags: {},
      });

      await store.updateResource("aws_s3_bucket", "my-bucket", {
        bucket: "my-bucket",
        tags: { env: "prod" },
      });

      const result = await store.readResource("aws_s3_bucket", "my-bucket");
      expect(result!.attributes.tags).toEqual({ env: "prod" });
    });

    test("state file is valid JSON after update", async () => {
      await store.createResource("aws_s3_bucket", "b1", { bucket: "b1" });
      await store.updateResource("aws_s3_bucket", "b1", {
        bucket: "b1",
        tags: { a: "1" },
      });

      const raw = await readFile(join(tempDir, "state.json"), "utf-8");
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    test("throws when updating non-existent resource", async () => {
      expect(store.updateResource("aws_s3_bucket", "ghost", { bucket: "ghost" })).rejects.toThrow();
    });
  });

  describe("deleteResource", () => {
    test("removes resource from state", async () => {
      await store.createResource("aws_s3_bucket", "my-bucket", {
        bucket: "my-bucket",
      });

      await store.deleteResource("aws_s3_bucket", "my-bucket");

      const result = await store.readResource("aws_s3_bucket", "my-bucket");
      expect(result).toBeNull();
    });

    test("state file is valid JSON after delete", async () => {
      await store.createResource("aws_s3_bucket", "b1", { bucket: "b1" });
      await store.deleteResource("aws_s3_bucket", "b1");

      const raw = await readFile(join(tempDir, "state.json"), "utf-8");
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    test("throws when deleting non-existent resource", async () => {
      expect(store.deleteResource("aws_s3_bucket", "ghost")).rejects.toThrow();
    });
  });
});
