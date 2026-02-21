import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createVpcHandler } from "../src/resources/vpc";

describe("aws_vpc handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createVpcHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "vpc-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createVpcHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts cidr_block and returns computed values", async () => {
      const result = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      expect(result.id).toMatch(/^vpc-/);
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
      expect(result.attributes.cidr_block).toBe("10.0.0.0/16");
    });

    test("generates all computed attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      expect(result.attributes.default_network_acl_id).toMatch(/^acl-/);
      expect(result.attributes.default_route_table_id).toMatch(/^rtb-/);
      expect(result.attributes.default_security_group_id).toMatch(/^sg-/);
      expect(result.attributes.dhcp_options_id).toMatch(/^dopt-/);
      expect(result.attributes.ipv6_association_id).toMatch(/^vpc-cidr-assoc-/);
      expect(result.attributes.main_route_table_id).toMatch(/^rtb-/);
      expect(result.attributes.owner_id).toBe("123456789012");
    });

    test("stores resource in state", async () => {
      const result = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      const stored = await store.readResource("aws_vpc", result.id);
      expect(stored).not.toBeNull();
      expect(stored!.attributes.cidr_block).toBe("10.0.0.0/16");
    });

    test("sets default values for optional attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      expect(result.attributes.enable_dns_support).toBe(true);
      expect(result.attributes.enable_dns_hostnames).toBe(false);
      expect(result.attributes.instance_tenancy).toBe("default");
    });
  });

  describe("read", () => {
    test("returns stored VPC attributes", async () => {
      const created = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      const result = await handler.read({
        resourceType: "aws_vpc",
        attributes: {},
        id: created.id,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.attributes.cidr_block).toBe("10.0.0.0/16");
    });

    test("returns null for non-existent VPC", async () => {
      const result = await handler.read({
        resourceType: "aws_vpc",
        attributes: {},
        id: "vpc-nonexistent",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies VPC configuration", async () => {
      const created = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      const result = await handler.update({
        resourceType: "aws_vpc",
        attributes: {
          cidr_block: "10.0.0.0/16",
          tags: { env: "prod" },
        },
        id: created.id,
      });

      expect(result.attributes.tags).toEqual({ env: "prod" });
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
    });
  });

  describe("delete", () => {
    test("removes VPC from state", async () => {
      const created = await handler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });

      await handler.delete({
        resourceType: "aws_vpc",
        attributes: {},
        id: created.id,
      });

      const result = await store.readResource("aws_vpc", created.id);
      expect(result).toBeNull();
    });
  });

  describe("optional arguments", () => {
    test("handles tags", async () => {
      const result = await handler.create({
        resourceType: "aws_vpc",
        attributes: {
          cidr_block: "10.0.0.0/16",
          tags: { Name: "My VPC", env: "dev" },
        },
      });

      expect(result.attributes.tags).toEqual({ Name: "My VPC", env: "dev" });
      expect(result.attributes.tags_all).toEqual({ Name: "My VPC", env: "dev" });
    });
  });
});
