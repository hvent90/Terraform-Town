import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import {
  buildProvider,
  setupTerraformEnv,
  terraform,
  startBackend,
  type TerraformEnv,
  type BackendServer,
} from "./helpers";

describe("US-015: terraform plan", () => {
  let env: TerraformEnv;
  let backend: BackendServer;

  beforeAll(async () => {
    await buildProvider();
    const statePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-plan-state-${Date.now()}.json`,
    );
    backend = startBackend(statePath);

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
  backend_url = "${backend.url}"
  region      = "us-east-1"
}

resource "aws_s3_bucket" "test" {
  bucket = "my-test-bucket"
}
`;
    env = await setupTerraformEnv(tfConfig);
    await terraform(env, ["init"]);
  }, 30000);

  afterAll(async () => {
    backend?.stop();
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
