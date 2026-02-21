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

describe("US-018: terraform destroy", () => {
  let env: TerraformEnv;
  let backend: BackendServer;
  let backendStatePath: string;

  beforeAll(async () => {
    await buildProvider();
    backendStatePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-destroy-state-${Date.now()}.json`,
    );
    backend = startBackend(backendStatePath);

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
}

resource "aws_s3_bucket" "test" {
  bucket = "my-destroy-test-bucket"
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

  test("terraform destroy succeeds", async () => {
    const result = await terraform(env, ["destroy", "-auto-approve"]);
    expect(result.exitCode).toBe(0);
  });

  test("state file is empty after destroy", async () => {
    await terraform(env, ["destroy", "-auto-approve"]);
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    expect(resources).toHaveLength(0);
  });

  test("mock backend confirms resource deleted", async () => {
    await terraform(env, ["destroy", "-auto-approve"]);
    // After destroy, reading the resource from the backend should return 404
    const response = await fetch(`${backend.url}/resource/aws_s3_bucket/my-destroy-test-bucket`);
    expect(response.status).toBe(404);
  });
});
