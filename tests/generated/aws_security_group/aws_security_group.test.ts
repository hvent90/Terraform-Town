import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { join } from "path";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { startBackend, setupProviderMirror, terraformEnv } from "../../helpers";

const resourceType = "aws_security_group";

describe(`${resourceType} integration`, () => {
  let testDir: string;
  let env: Record<string, string>;
  let backend: ReturnType<typeof startBackend>;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "tf-test-"));
    const statePath = join(testDir, "state.json");
    backend = startBackend(statePath);
    const backendUrl = backend.url;

    await setupProviderMirror(testDir);
    env = terraformEnv(testDir);

    const tfConfig = `
terraform {
  required_providers {
    aws = {
      source  = "terraform-town/aws-mock"
      version = "0.1.0"
    }
  }
}

provider "aws" {
  backend_url = "${backendUrl}"
  region      = "us-east-1"
}

resource "aws_vpc" "test" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_security_group" "test" {
  name        = "test-sg"
  description = "Test security group"
  vpc_id      = aws_vpc.test.id
}
`;
    await Bun.write(join(testDir, "main.tf"), tfConfig);
  });

  afterAll(async () => {
    backend.stop();
    await rm(testDir, { recursive: true });
  });

  test("terraform init succeeds", async () => {
    const result = await $`terraform init -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);
  });

  test("terraform plan shows resources to create", async () => {
    const result = await $`terraform plan -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("2 to add");
  });

  test("terraform apply creates resource", async () => {
    const result = await $`terraform apply -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(2);
    const sg = state.resources.find((r: any) => r.type === resourceType);
    expect(sg).toBeDefined();
  });

  test("computed values match expected format", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const sg = state.resources.find((r: any) => r.type === resourceType);
    const attrs = sg.instances[0].attributes;

    expect(attrs["arn"]).toMatch(/^arn:aws:/);
    expect(attrs["owner_id"]).toMatch(/.+/);
  });

  test("references resolve correctly", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const vpc = state.resources.find((r: any) => r.type === "aws_vpc");
    const sg = state.resources.find((r: any) => r.type === resourceType);
    const vpcId = vpc.instances[0].attributes["id"];
    const sgVpcId = sg.instances[0].attributes["vpc_id"];

    expect(sgVpcId).toBe(vpcId);
  });

  test("terraform destroy removes resource", async () => {
    const result = await $`terraform destroy -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(0);
  });
});
