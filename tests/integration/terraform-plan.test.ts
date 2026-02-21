import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { buildProvider, setupTerraformEnv, terraform, type TerraformEnv } from "./helpers";

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
  backend_url = "http://localhost:3000"
}

resource "aws_s3_bucket" "test" {
  bucket = "my-test-bucket"
}
`;

describe("US-015: terraform plan", () => {
  let env: TerraformEnv;

  beforeAll(async () => {
    await buildProvider();
    env = await setupTerraformEnv(TF_CONFIG);
    await terraform(env, ["init"]);
  }, 30000);

  afterAll(async () => {
    await env?.cleanup();
  });

  test("terraform plan succeeds", async () => {
    const result = await terraform(env, ["plan"]);
    expect(result.exitCode).toBe(0);
  });

  test("plan shows '1 to add'", async () => {
    const result = await terraform(env, ["plan"]);
    expect(result.stdout).toContain("1 to add");
  });

  test("plan shows computed values (arn, id)", async () => {
    const result = await terraform(env, ["plan"]);
    const output = result.stdout;
    expect(output).toContain("arn");
    expect(output).toContain("(known after apply)");
  });

  test("no errors in output", async () => {
    const result = await terraform(env, ["plan"]);
    expect(result.stderr).not.toContain("Error");
  });
});
