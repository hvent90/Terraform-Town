import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { createInstanceHandler } from "../src/resources/instance";
import { createSubnetHandler } from "../src/resources/subnet";
import { createSecurityGroupHandler } from "../src/resources/security-group";
import { createVpcHandler } from "../src/resources/vpc";

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
      const vpcHandler = createVpcHandler(store);
      const subnetHandler = createSubnetHandler(store);
      const sgHandler = createSecurityGroupHandler(store);
      const vpc = await vpcHandler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });
      const subnet = await subnetHandler.create({
        resourceType: "aws_subnet",
        attributes: { vpc_id: vpc.id, cidr_block: "10.0.1.0/24" },
      });
      const sg = await sgHandler.create({
        resourceType: "aws_security_group",
        attributes: { name: "test-sg", vpc_id: vpc.id },
      });

      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          subnet_id: subnet.id,
          vpc_security_group_ids: [sg.id],
        },
      });

      expect(result.id).toMatch(/^i-/);
      expect(result.attributes.ami).toBe("ami-0c55b159cbfafe1f0");
      expect(result.attributes.instance_type).toBe("t2.micro");
      expect(result.attributes.subnet_id).toBe(subnet.id);
      expect(result.attributes.vpc_security_group_ids).toEqual([sg.id]);
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

  describe("reference validation", () => {
    test("rejects subnet_id that does not exist in state", async () => {
      expect(
        handler.create({
          resourceType: "aws_instance",
          attributes: {
            ami: "ami-0c55b159cbfafe1f0",
            instance_type: "t2.micro",
            subnet_id: "subnet-nonexistent",
          },
        }),
      ).rejects.toThrow(/subnet.*subnet-nonexistent.*not found/i);
    });

    test("rejects vpc_security_group_ids that do not exist in state", async () => {
      expect(
        handler.create({
          resourceType: "aws_instance",
          attributes: {
            ami: "ami-0c55b159cbfafe1f0",
            instance_type: "t2.micro",
            vpc_security_group_ids: ["sg-nonexistent"],
          },
        }),
      ).rejects.toThrow(/security group.*sg-nonexistent.*not found/i);
    });

    test("rejects when one of multiple security groups does not exist", async () => {
      const sgHandler = createSecurityGroupHandler(store);
      const vpcHandler = createVpcHandler(store);
      const vpc = await vpcHandler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });
      const sg = await sgHandler.create({
        resourceType: "aws_security_group",
        attributes: { name: "test-sg", vpc_id: vpc.id },
      });

      expect(
        handler.create({
          resourceType: "aws_instance",
          attributes: {
            ami: "ami-0c55b159cbfafe1f0",
            instance_type: "t2.micro",
            vpc_security_group_ids: [sg.id, "sg-nonexistent"],
          },
        }),
      ).rejects.toThrow(/security group.*sg-nonexistent.*not found/i);
    });

    test("accepts valid subnet_id reference", async () => {
      const vpcHandler = createVpcHandler(store);
      const subnetHandler = createSubnetHandler(store);
      const vpc = await vpcHandler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });
      const subnet = await subnetHandler.create({
        resourceType: "aws_subnet",
        attributes: { vpc_id: vpc.id, cidr_block: "10.0.1.0/24" },
      });

      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          subnet_id: subnet.id,
        },
      });

      expect(result.attributes.subnet_id).toBe(subnet.id);
    });

    test("accepts valid vpc_security_group_ids references", async () => {
      const vpcHandler = createVpcHandler(store);
      const sgHandler = createSecurityGroupHandler(store);
      const vpc = await vpcHandler.create({
        resourceType: "aws_vpc",
        attributes: { cidr_block: "10.0.0.0/16" },
      });
      const sg1 = await sgHandler.create({
        resourceType: "aws_security_group",
        attributes: { name: "sg-1", vpc_id: vpc.id },
      });
      const sg2 = await sgHandler.create({
        resourceType: "aws_security_group",
        attributes: { name: "sg-2", vpc_id: vpc.id },
      });

      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
          vpc_security_group_ids: [sg1.id, sg2.id],
        },
      });

      expect(result.attributes.vpc_security_group_ids).toEqual([sg1.id, sg2.id]);
    });

    test("allows instance without subnet_id or vpc_security_group_ids", async () => {
      const result = await handler.create({
        resourceType: "aws_instance",
        attributes: {
          ami: "ami-0c55b159cbfafe1f0",
          instance_type: "t2.micro",
        },
      });

      expect(result.id).toMatch(/^i-/);
    });
  });
});
