import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { join } from "path";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { startBackend, stopBackend, setupProviderMirror, terraformEnv } from "../../helpers";

const resourceType = "aws_instance";

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
  region      = "us-east-1"
}

resource "aws_vpc" "test" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "test" {
  vpc_id     = aws_vpc.test.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_security_group" "test" {
  name   = "test-sg"
  vpc_id = aws_vpc.test.id
}

resource "aws_instance" "test" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.test.id
  vpc_security_group_ids = [aws_security_group.test.id]
  associate_public_ip_address = true
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

  test("terraform plan shows resources to create", async () => {
    const result = await $`terraform plan -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("4 to add");
  });

  test("terraform apply creates resources", async () => {
    const result = await $`terraform apply -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(4);

    const instance = state.resources.find((r: any) => r.type === resourceType);
    expect(instance).toBeDefined();
  });

  test("computed values match expected format", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const instance = state.resources.find((r: any) => r.type === resourceType);
    const attrs = instance.instances[0].attributes;

    expect(attrs["arn"]).toMatch(/^arn:aws:ec2:.*:instance\/i-/);
    expect(attrs["instance_state"]).toBe("running");
    expect(attrs["primary_network_interface_id"]).toMatch(/^eni-/);
    expect(attrs["private_ip"]).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(attrs["private_dns"]).toMatch(/ip-.*\.ec2\.internal/);
    expect(attrs["public_ip"]).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(attrs["public_dns"]).toMatch(/ec2-.*\.compute-1\.amazonaws\.com/);
  });

  test("references resolve correctly", async () => {
    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    const instance = state.resources.find((r: any) => r.type === resourceType);
    const subnet = state.resources.find((r: any) => r.type === "aws_subnet");
    const sg = state.resources.find((r: any) => r.type === "aws_security_group");
    const attrs = instance.instances[0].attributes;

    expect(attrs["subnet_id"]).toBe(subnet.instances[0].attributes["id"]);
    expect(attrs["vpc_security_group_ids"]).toContain(sg.instances[0].attributes["id"]);
  });

  test("terraform destroy removes resources", async () => {
    const result = await $`terraform destroy -auto-approve -no-color`.cwd(testDir).env(env).quiet();
    expect(result.exitCode).toBe(0);

    const state = JSON.parse(await readFile(join(testDir, "terraform.tfstate"), "utf-8"));
    expect(state.resources).toHaveLength(0);
  });
});
