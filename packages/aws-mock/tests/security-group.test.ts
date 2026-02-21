import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createSecurityGroupHandler } from "../src/resources/security-group";

describe("aws_security_group handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createSecurityGroupHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "sg-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createSecurityGroupHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts name, description, vpc_id and returns computed values", async () => {
      const result = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          description: "Test security group",
          vpc_id: "vpc-abc123",
        },
      });

      expect(result.id).toMatch(/^sg-/);
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
      expect(result.attributes.name).toBe("test-sg");
      expect(result.attributes.description).toBe("Test security group");
      expect(result.attributes.vpc_id).toBe("vpc-abc123");
    });

    test("generates all computed attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
        },
      });

      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:.*:security-group\/sg-/);
      expect(result.attributes.owner_id).toBe("123456789012");
    });

    test("stores resource in state", async () => {
      const result = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
        },
      });

      const stored = await store.readResource("aws_security_group", result.id);
      expect(stored).not.toBeNull();
      expect(stored!.attributes.name).toBe("test-sg");
      expect(stored!.attributes.vpc_id).toBe("vpc-abc123");
    });

    test("sets default values for optional attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_security_group",
        attributes: {},
      });

      expect(result.attributes.description).toBe("Managed by Terraform");
      expect(result.attributes.revoke_rules_on_delete).toBe(false);
      expect(result.attributes.egress).toEqual([]);
      expect(result.attributes.ingress).toEqual([]);
      expect(result.attributes.name).toBe("");
    });
  });

  describe("read", () => {
    test("returns stored security group attributes", async () => {
      const created = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
        },
      });

      const result = await handler.read({
        resourceType: "aws_security_group",
        attributes: {},
        id: created.id,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.attributes.name).toBe("test-sg");
    });

    test("returns null for non-existent security group", async () => {
      const result = await handler.read({
        resourceType: "aws_security_group",
        attributes: {},
        id: "sg-nonexistent",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies security group configuration", async () => {
      const created = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
        },
      });

      const result = await handler.update({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
          tags: { env: "prod" },
        },
        id: created.id,
      });

      expect(result.attributes.tags).toEqual({ env: "prod" });
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
    });
  });

  describe("delete", () => {
    test("removes security group from state", async () => {
      const created = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-abc123",
        },
      });

      await handler.delete({
        resourceType: "aws_security_group",
        attributes: {},
        id: created.id,
      });

      const result = await store.readResource("aws_security_group", created.id);
      expect(result).toBeNull();
    });
  });

  describe("vpc_id reference", () => {
    test("vpc_id can store a resolved reference value", async () => {
      const result = await handler.create({
        resourceType: "aws_security_group",
        attributes: {
          name: "test-sg",
          vpc_id: "vpc-0abc123def456789a",
        },
      });

      expect(result.attributes.vpc_id).toBe("vpc-0abc123def456789a");
    });
  });
});
