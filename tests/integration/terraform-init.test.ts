import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
`;

describe("US-014: terraform init", () => {
  let env: TerraformEnv;

  beforeAll(async () => {
    await buildProvider();
    env = await setupTerraformEnv(TF_CONFIG);
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  test("terraform init succeeds", async () => {
    const result = await terraform(env, ["init"]);
    expect(result.exitCode).toBe(0);
  });

  test("no error messages in output", async () => {
    const result = await terraform(env, ["init"]);
    const combined = result.stdout + result.stderr;
    expect(combined.toLowerCase()).not.toContain("error");
  });

  test("provider appears in .terraform/providers/", async () => {
    await terraform(env, ["init"]);
    const providerDir = join(
      env.workDir,
      ".terraform",
      "providers",
      "registry.terraform.io",
      "terraform-town",
      "aws-mock",
    );
    expect(existsSync(providerDir)).toBe(true);
  });
});
