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

describe("US-016: terraform apply", () => {
  let env: TerraformEnv;
  let backend: BackendServer;

  beforeAll(async () => {
    await buildProvider();
    const statePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-apply-state-${Date.now()}.json`,
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
}

resource "aws_s3_bucket" "test" {
  bucket = "my-apply-test-bucket"
}
`;
    env = await setupTerraformEnv(tfConfig);
    await terraform(env, ["init"]);
  }, 30000);

  afterAll(async () => {
    backend?.stop();
    await env?.cleanup();
  });

  test("terraform apply succeeds", async () => {
    const result = await terraform(env, ["apply", "-auto-approve"]);
    expect(result.exitCode).toBe(0);
  });

  test("terraform.tfstate file exists", async () => {
    await terraform(env, ["apply", "-auto-approve"]);
    const statePath = join(env.workDir, "terraform.tfstate");
    const stateContent = await readFile(statePath, "utf-8");
    expect(stateContent.length).toBeGreaterThan(0);
  });

  test("state contains aws_s3_bucket resource", async () => {
    await terraform(env, ["apply", "-auto-approve"]);
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    const s3Bucket = resources.find((r: { type: string }) => r.type === "aws_s3_bucket");
    expect(s3Bucket).toBeDefined();
    expect(s3Bucket.name).toBe("test");
  });

  test("state contains computed values", async () => {
    await terraform(env, ["apply", "-auto-approve"]);
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    const s3Bucket = resources.find((r: { type: string }) => r.type === "aws_s3_bucket");
    const attrs = s3Bucket.instances[0].attributes;
    expect(attrs.id).toBe("my-apply-test-bucket");
    expect(attrs.arn).toBe("arn:aws:s3:::my-apply-test-bucket");
    expect(attrs.bucket_domain_name).toBe("my-apply-test-bucket.s3.amazonaws.com");
    expect(attrs.region).toBe("us-east-1");
  });
});
