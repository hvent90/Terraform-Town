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

describe("US-017: no drift on second plan", () => {
  let env: TerraformEnv;
  let backend: BackendServer;

  beforeAll(async () => {
    await buildProvider();
    const statePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-nodrift-state-${Date.now()}.json`,
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
  bucket = "my-nodrift-test-bucket"
}
`;
    env = await setupTerraformEnv(tfConfig);
    await terraform(env, ["init"]);
    const applyResult = await terraform(env, ["apply", "-auto-approve"]);
    if (applyResult.exitCode !== 0) {
      throw new Error(`apply failed: ${applyResult.stderr}\n${applyResult.stdout}`);
    }
  }, 30000);

  afterAll(async () => {
    backend?.stop();
    await env?.cleanup();
  });

  test("terraform plan after apply shows no changes", async () => {
    const result = await terraform(env, ["plan"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No changes");
  });

  test("state is consistent", async () => {
    const result = await terraform(env, ["plan", "-detailed-exitcode"]);
    // -detailed-exitcode: 0 = no changes, 1 = error, 2 = changes present
    expect(result.exitCode).toBe(0);
  });

  test("computed values match after read", async () => {
    const showResult = await terraform(env, ["show", "-json", "terraform.tfstate"]);
    expect(showResult.exitCode).toBe(0);
    const state = JSON.parse(showResult.stdout);
    const rootModule = state.values?.root_module;
    const s3Resource = rootModule?.resources?.find(
      (r: { type: string }) => r.type === "aws_s3_bucket",
    );
    expect(s3Resource).toBeDefined();
    expect(s3Resource.values.id).toBe("my-nodrift-test-bucket");
    expect(s3Resource.values.arn).toBe("arn:aws:s3:::my-nodrift-test-bucket");
    expect(s3Resource.values.region).toBe("us-east-1");
  });
});
