import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createSubnetHandler } from "../src/resources/subnet";

describe("aws_subnet handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createSubnetHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "subnet-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createSubnetHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts cidr_block, vpc_id, availability_zone and returns computed values", async () => {
      const result = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
          availability_zone: "us-east-1a",
        },
      });

      expect(result.id).toMatch(/^subnet-/);
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
      expect(result.attributes.cidr_block).toBe("10.0.1.0/24");
      expect(result.attributes.vpc_id).toBe("vpc-abc123");
      expect(result.attributes.availability_zone).toBe("us-east-1a");
    });

    test("generates all computed attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      expect(result.attributes.ipv6_cidr_block_association_id).toMatch(/^subnet-cidr-assoc-/);
      expect(result.attributes.owner_id).toBe("123456789012");
    });

    test("stores resource in state", async () => {
      const result = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      const stored = await store.readResource("aws_subnet", result.id);
      expect(stored).not.toBeNull();
      expect(stored!.attributes.cidr_block).toBe("10.0.1.0/24");
      expect(stored!.attributes.vpc_id).toBe("vpc-abc123");
    });

    test("sets default values for optional attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      expect(result.attributes.assign_ipv6_address_on_creation).toBe(false);
      expect(result.attributes.map_public_ip_on_launch).toBe(false);
      expect(result.attributes.enable_dns64).toBe(false);
      expect(result.attributes.ipv6_native).toBe(false);
    });
  });

  describe("read", () => {
    test("returns stored subnet attributes", async () => {
      const created = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      const result = await handler.read({
        resourceType: "aws_subnet",
        attributes: {},
        id: created.id,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.attributes.cidr_block).toBe("10.0.1.0/24");
    });

    test("returns null for non-existent subnet", async () => {
      const result = await handler.read({
        resourceType: "aws_subnet",
        attributes: {},
        id: "subnet-nonexistent",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies subnet configuration", async () => {
      const created = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      const result = await handler.update({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
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
    test("removes subnet from state", async () => {
      const created = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-abc123",
        },
      });

      await handler.delete({
        resourceType: "aws_subnet",
        attributes: {},
        id: created.id,
      });

      const result = await store.readResource("aws_subnet", created.id);
      expect(result).toBeNull();
    });
  });

  describe("vpc_id reference", () => {
    test("vpc_id can store a resolved reference value", async () => {
      const result = await handler.create({
        resourceType: "aws_subnet",
        attributes: {
          cidr_block: "10.0.1.0/24",
          vpc_id: "vpc-0abc123def456789a",
          availability_zone: "us-east-1a",
        },
      });

      expect(result.attributes.vpc_id).toBe("vpc-0abc123def456789a");
    });
  });
});
