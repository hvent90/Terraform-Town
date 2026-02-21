import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createIamRoleHandler } from "../src/resources/iam-role";

const VALID_TRUST_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { Service: "ec2.amazonaws.com" },
      Action: "sts:AssumeRole",
    },
  ],
});

describe("aws_iam_role handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createIamRoleHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "iam-role-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createIamRoleHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts valid JSON assume_role_policy", async () => {
      const result = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "test-role",
          assume_role_policy: VALID_TRUST_POLICY,
        },
      });

      expect(result.id).toBeString();
      expect(result.attributes.name).toBe("test-role");
      expect(result.attributes.assume_role_policy).toBe(VALID_TRUST_POLICY);
    });

    test("rejects invalid JSON in assume_role_policy", async () => {
      await expect(
        handler.create({
          resourceType: "aws_iam_role",
          attributes: {
            name: "bad-role",
            assume_role_policy: "not valid json",
          },
        }),
      ).rejects.toThrow("JSON");
    });

    test("rejects empty string assume_role_policy", async () => {
      await expect(
        handler.create({
          resourceType: "aws_iam_role",
          attributes: {
            name: "empty-policy-role",
            assume_role_policy: "",
          },
        }),
      ).rejects.toThrow("JSON");
    });

    test("generates computed values", async () => {
      const result = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "compute-role",
          assume_role_policy: "{}",
        },
      });

      expect(result.attributes.arn).toMatch(/^arn:aws:iam::\d+:role\/compute-role$/);
      expect(result.attributes.unique_id).toBeString();
      expect(result.attributes.create_date).toBeString();
    });

    test("uses default path /", async () => {
      const result = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "path-role",
          assume_role_policy: "{}",
        },
      });

      expect(result.attributes.path).toBe("/");
    });

    test("accepts custom path", async () => {
      const result = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "custom-path-role",
          assume_role_policy: "{}",
          path: "/service-role/",
        },
      });

      expect(result.attributes.path).toBe("/service-role/");
    });
  });

  describe("read", () => {
    test("returns stored role", async () => {
      const created = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "read-role",
          assume_role_policy: VALID_TRUST_POLICY,
        },
      });

      const result = await handler.read({
        resourceType: "aws_iam_role",
        attributes: {},
        id: created.id,
      });

      expect(result).not.toBeNull();
      expect(result!.attributes.name).toBe("read-role");
      expect(result!.attributes.assume_role_policy).toBe(VALID_TRUST_POLICY);
    });

    test("returns null for non-existent role", async () => {
      const result = await handler.read({
        resourceType: "aws_iam_role",
        attributes: {},
        id: "no-such-role",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("validates JSON on update", async () => {
      const created = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "update-role",
          assume_role_policy: "{}",
        },
      });

      await expect(
        handler.update({
          resourceType: "aws_iam_role",
          attributes: {
            name: "update-role",
            assume_role_policy: "not json",
          },
          id: created.id,
        }),
      ).rejects.toThrow("JSON");
    });

    test("accepts valid JSON on update", async () => {
      const created = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "update-role",
          assume_role_policy: "{}",
        },
      });

      const result = await handler.update({
        resourceType: "aws_iam_role",
        attributes: {
          name: "update-role",
          assume_role_policy: VALID_TRUST_POLICY,
        },
        id: created.id,
      });

      expect(result.attributes.assume_role_policy).toBe(VALID_TRUST_POLICY);
    });
  });

  describe("delete", () => {
    test("removes role from state", async () => {
      const created = await handler.create({
        resourceType: "aws_iam_role",
        attributes: {
          name: "delete-role",
          assume_role_policy: "{}",
        },
      });

      await handler.delete({
        resourceType: "aws_iam_role",
        attributes: {},
        id: created.id,
      });

      const result = await store.readResource("aws_iam_role", created.id);
      expect(result).toBeNull();
    });
  });
});
