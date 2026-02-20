import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../src/index";

describe("mock backend server", () => {
  let tempDir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "server-test-"));
    app = createApp(join(tempDir, "state.json"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("POST /resource/aws_s3_bucket", () => {
    test("creates bucket and returns result", async () => {
      const res = await app.request("/resource/aws_s3_bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { bucket: "my-bucket" } }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe("my-bucket");
      expect(body.attributes.arn).toBe("arn:aws:s3:::my-bucket");
      expect(body.attributes.bucket).toBe("my-bucket");
    });
  });

  describe("GET /resource/aws_s3_bucket/:id", () => {
    test("reads stored bucket", async () => {
      await app.request("/resource/aws_s3_bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { bucket: "read-bucket" } }),
      });

      const res = await app.request("/resource/aws_s3_bucket/read-bucket");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("read-bucket");
      expect(body.attributes.arn).toBe("arn:aws:s3:::read-bucket");
    });

    test("returns 404 for non-existent bucket", async () => {
      const res = await app.request("/resource/aws_s3_bucket/no-such-bucket");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /resource/aws_s3_bucket/:id", () => {
    test("updates bucket configuration", async () => {
      await app.request("/resource/aws_s3_bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { bucket: "update-bucket" } }),
      });

      const res = await app.request("/resource/aws_s3_bucket/update-bucket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: { bucket: "update-bucket", tags: { env: "prod" } },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes.tags).toEqual({ env: "prod" });
      expect(body.attributes.arn).toBe("arn:aws:s3:::update-bucket");
    });
  });

  describe("DELETE /resource/aws_s3_bucket/:id", () => {
    test("deletes bucket from state", async () => {
      await app.request("/resource/aws_s3_bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { bucket: "delete-bucket" } }),
      });

      const res = await app.request("/resource/aws_s3_bucket/delete-bucket", { method: "DELETE" });

      expect(res.status).toBe(204);

      const readRes = await app.request("/resource/aws_s3_bucket/delete-bucket");
      expect(readRes.status).toBe(404);
    });
  });

  describe("aws_s3_bucket_policy routes", () => {
    test("CRUD operations work for bucket policy", async () => {
      // Create
      const createRes = await app.request("/resource/aws_s3_bucket_policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: {
            bucket: "policy-bucket",
            policy: '{"Version":"2012-10-17"}',
          },
        }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      expect(created.id).toBe("policy-bucket");

      // Read
      const readRes = await app.request("/resource/aws_s3_bucket_policy/policy-bucket");
      expect(readRes.status).toBe(200);

      // Update
      const updateRes = await app.request("/resource/aws_s3_bucket_policy/policy-bucket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: {
            bucket: "policy-bucket",
            policy: '{"Version":"2012-10-17","Statement":[]}',
          },
        }),
      });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await app.request("/resource/aws_s3_bucket_policy/policy-bucket", {
        method: "DELETE",
      });
      expect(deleteRes.status).toBe(204);
    });
  });

  describe("error handling", () => {
    test("returns 400 for missing attributes on POST", async () => {
      const res = await app.request("/resource/aws_s3_bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    test("returns 404 for unknown resource type", async () => {
      const res = await app.request("/resource/aws_unknown_thing/some-id");

      expect(res.status).toBe(404);
    });
  });
});
