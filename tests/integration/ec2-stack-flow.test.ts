import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildProvider,
  setupTerraformEnv,
  terraform,
  startBackend,
  type TerraformEnv,
  type BackendServer,
} from "./helpers";

const TF_CONFIG = `
terraform {
  required_providers {
    aws = {
      source  = "terraform-town/aws-mock"
      version = "0.1.0"
    }
  }
}

provider "aws" {
  backend_url = "BACKEND_URL_PLACEHOLDER"
  region      = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_security_group" "main" {
  name   = "ec2-stack-test-sg"
  vpc_id = aws_vpc.main.id
}

resource "aws_instance" "main" {
  ami                         = "ami-0c55b159cbfafe1f0"
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.main.id
  vpc_security_group_ids      = [aws_security_group.main.id]
  associate_public_ip_address = true
}
`;

describe("US-031: full EC2 stack flow", () => {
  let env: TerraformEnv;
  let backend: BackendServer;

  beforeAll(async () => {
    await buildProvider();
    const backendStatePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-ec2-stack-state-${Date.now()}.json`,
    );
    backend = startBackend(backendStatePath);

    const tfConfig = TF_CONFIG.replace("BACKEND_URL_PLACEHOLDER", backend.url);
    env = await setupTerraformEnv(tfConfig);
    await terraform(env, ["init"]);
  }, 30000);

  afterAll(async () => {
    backend?.stop();
    await env?.cleanup();
  });

  test("terraform apply creates all 4 resources", async () => {
    const result = await terraform(env, ["apply", "-auto-approve"]);
    expect(result.exitCode).toBe(0);

    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    expect(resources).toHaveLength(4);

    const vpc = resources.find((r: any) => r.type === "aws_vpc");
    const subnet = resources.find((r: any) => r.type === "aws_subnet");
    const sg = resources.find((r: any) => r.type === "aws_security_group");
    const instance = resources.find((r: any) => r.type === "aws_instance");
    expect(vpc).toBeDefined();
    expect(subnet).toBeDefined();
    expect(sg).toBeDefined();
    expect(instance).toBeDefined();
  });

  test("state contains correct attributes for all resources", async () => {
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];

    const vpc = resources.find((r: any) => r.type === "aws_vpc");
    const subnet = resources.find((r: any) => r.type === "aws_subnet");
    const sg = resources.find((r: any) => r.type === "aws_security_group");
    const instance = resources.find((r: any) => r.type === "aws_instance");

    // VPC attributes
    const vpcAttrs = vpc.instances[0].attributes;
    expect(vpcAttrs.id).toMatch(/^vpc-/);
    expect(vpcAttrs.arn).toMatch(/^arn:aws:ec2:.*:vpc\/vpc-/);
    expect(vpcAttrs.cidr_block).toBe("10.0.0.0/16");

    // Subnet attributes — references VPC
    const subnetAttrs = subnet.instances[0].attributes;
    expect(subnetAttrs.id).toMatch(/^subnet-/);
    expect(subnetAttrs.vpc_id).toBe(vpcAttrs.id);
    expect(subnetAttrs.cidr_block).toBe("10.0.1.0/24");

    // Security group attributes — references VPC
    const sgAttrs = sg.instances[0].attributes;
    expect(sgAttrs.id).toMatch(/^sg-/);
    expect(sgAttrs.vpc_id).toBe(vpcAttrs.id);
    expect(sgAttrs.name).toBe("ec2-stack-test-sg");

    // Instance attributes — references subnet and security group
    const instanceAttrs = instance.instances[0].attributes;
    expect(instanceAttrs.id).toMatch(/^i-/);
    expect(instanceAttrs.arn).toMatch(/^arn:aws:ec2:.*:instance\/i-/);
    expect(instanceAttrs.instance_state).toBe("running");
    expect(instanceAttrs.subnet_id).toBe(subnetAttrs.id);
    expect(instanceAttrs.vpc_security_group_ids).toContain(sgAttrs.id);
    expect(instanceAttrs.private_ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(instanceAttrs.public_ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });

  test("second plan shows no changes", async () => {
    const result = await terraform(env, ["plan", "-detailed-exitcode"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No changes");
  });

  test("terraform destroy removes all resources", async () => {
    const result = await terraform(env, ["destroy", "-auto-approve"]);
    expect(result.exitCode).toBe(0);

    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    expect(resources).toHaveLength(0);
  });
});
