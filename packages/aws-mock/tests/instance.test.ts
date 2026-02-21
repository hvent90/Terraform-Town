import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createInstanceHandler } from "../src/resources/instance";

describe("aws_instance handler", () => {
  let tempDir: string;
  let store: StateStore;
  let handler: ReturnType<typeof createInstanceHandler>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "instance-test-"));
    store = new StateStore(join(tempDir, "state.json"));
    handler = createInstanceHandler(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  describe("create", () => {
    test("accepts ami, instance_type, subnet_id, vpc_security_group_ids", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          subnet_id: "subnet-abc123",
          vpc_security_group_ids: ["sg-abc123"],
        },
      });

      expect(result.id).toMatch(/^i-/);
      expect(result.attributes.ami).toBe("ami-0c55b159cbfafe1f0");
      expect(result.attributes.instance_type).toBe("t2.micro");
      expect(result.attributes.subnet_id).toBe("subnet-abc123");
      expect(result.attributes.vpc_security_group_ids).toEqual(["sg-abc123"]);
    });

    test("generates all computed attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:.*:instance\/i-/);
      expect(result.attributes.instance_state).toBe("running");
      expect(result.attributes.private_ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(result.attributes.private_dns).toMatch(/ip-.*\.ec2\.internal/);
      expect(result.attributes.public_ip).toBe("");
      expect(result.attributes.public_dns).toBe("");
      expect(result.attributes.primary_network_interface_id).toMatch(/^eni-/);
      expect(result.attributes.instance_lifecycle).toBe("");
      expect(result.attributes.outpost_arn).toBe("");
      expect(result.attributes.password_data).toBe("");
      expect(result.attributes.spot_instance_request_id).toBe("");
    });

    test("generates public_ip when associate_public_ip_address is true", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          associate_public_ip_address: true,
        },
      });

      expect(result.attributes.public_ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(result.attributes.public_dns).toMatch(/ec2-.*\.compute-1\.amazonaws\.com/);
    });

    test("stores resource in state", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      const stored = await store.readResource("aws_instance", result.id);
      expect(stored).not.toBeNull();
      expect(stored!.attributes.ami).toBe("ami-0c55b159cbfafe1f0");
    });

    test("sets default values for optional attributes", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
        },
      });

      expect(result.attributes.associate_public_ip_address).toBe(false);
      expect(result.attributes.ebs_optimized).toBe(false);
      expect(result.attributes.monitoring).toBe(false);
      expect(result.attributes.source_dest_check).toBe(true);
      expect(result.attributes.tags).toEqual({});
      expect(result.attributes.tags_all).toEqual({});
    });
  });

  describe("read", () => {
    test("returns stored instance attributes", async () => {
      const created = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      const result = await handler.read({
        resourceType: "aws_instance",
        attributes: {},
        id: created.id,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.attributes.ami).toBe("ami-0c55b159cbfafe1f0");
    });

    test("returns null for non-existent instance", async () => {
      const result = await handler.read({
        resourceType: "aws_instance",
        attributes: {},
        id: "i-nonexistent",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("modifies instance configuration", async () => {
      const created = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      const result = await handler.update({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.small",
          tags: { env: "prod" },
        },
        id: created.id,
      });

      expect(result.attributes.instance_type).toBe("t2.small");
      expect(result.attributes.tags).toEqual({ env: "prod" });
      expect(result.attributes.arn).toMatch(/^arn:aws:ec2:/);
    });
  });

  describe("delete", () => {
    test("removes instance from state", async () => {
      const created = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      await handler.delete({
        resourceType: "aws_instance",
        attributes: {},
        id: created.id,
      });

      const result = await store.readResource("aws_instance", created.id);
      expect(result).toBeNull();
    });
  });

  describe("references", () => {
    test("subnet_id can store a resolved reference value", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          subnet_id: "subnet-0abc123def456789a",
        },
      });

      expect(result.attributes.subnet_id).toBe("subnet-0abc123def456789a");
    });

    test("vpc_security_group_ids can store resolved reference values", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          vpc_security_group_ids: ["sg-0abc123def456789a", "sg-0def456789abc123b"],
        },
      });

      expect(result.attributes.vpc_security_group_ids).toEqual([
        "sg-0abc123def456789a",
        "sg-0def456789abc123b",
      ]);
    });
  });
});
