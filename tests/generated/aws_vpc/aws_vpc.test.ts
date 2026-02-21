import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { join } from "path";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { startBackend, stopBackend, setupProviderMirror, terraformEnv } from "../../helpers";

const resourceType = "aws_vpc";

describe(`${resourceType} integration`, () => {
  let testDir: string;
  let env: Record<string, string>;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "tf-test-"));
    const statePath = join(testDir, "state.json");
    const backendUrl = startBackend(statePath);

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
}

resource "aws_vpc" "test" {
  cidr_block = "10.0.0.0/16"
}
`;
    await Bun.write(join(testDir, "main.tf"), tfConfig);
  });

  afterAll(async () => {
    stopBackend();
    await rm(testDir, { recursive: true });
  });

  test("terraform init succeeds", async () => {
    const result = await $`terraform init -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);
  });

  test("terraform plan shows resource to create", async () => {
    const result = await $`terraform plan -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("1 to add");
  });

  test("terraform apply creates resource", async () => {
    const result = await $`terraform apply -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(1);
    expect(state.resources[0].type).toBe(resourceType);
  });

  test("computed values match expected format", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const attrs = state.resources[0].instances[0].attributes;

    expect(attrs["arn"]).toMatch(/^arn:aws:/);
    expect(attrs["default_network_acl_id"]).toMatch(/.+/);
    expect(attrs["default_route_table_id"]).toMatch(/.+/);
    expect(attrs["default_security_group_id"]).toMatch(/.+/);
    expect(attrs["dhcp_options_id"]).toMatch(/.+/);
    expect(attrs["ipv6_association_id"]).toMatch(/.+/);
    expect(attrs["main_route_table_id"]).toMatch(/.+/);
    expect(attrs["owner_id"]).toMatch(/.+/);
  });

  test("terraform destroy removes resource", async () => {
    const result = await $`terraform destroy -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(0);
  });
});
