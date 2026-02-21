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

resource "aws_s3_bucket" "b" {
  bucket = "my-reference-test-bucket"
}

resource "aws_s3_bucket_policy" "p" {
  bucket = aws_s3_bucket.b.bucket
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicRead"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = aws_s3_bucket.b.arn
    }]
  })
}
`;

describe("US-019: resource references", () => {
  let env: TerraformEnv;
  let backend: BackendServer;

  beforeAll(async () => {
    await buildProvider();
    const backendStatePath = join(
      await import("node:os").then((os) => os.tmpdir()),
      `tf-references-state-${Date.now()}.json`,
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

  test("aws_s3_bucket_policy can reference aws_s3_bucket.b.arn", async () => {
    const planResult = await terraform(env, ["plan", "-out=tfplan"]);
    expect(planResult.exitCode).toBe(0);
    const showResult = await terraform(env, ["show", "-json", "tfplan"]);
    expect(showResult.exitCode).toBe(0);
    const plan = JSON.parse(showResult.stdout);
    const policyChange = plan.resource_changes.find((r: any) => r.type === "aws_s3_bucket_policy");
    expect(policyChange).toBeDefined();
    // The policy's bucket attribute should reference the bucket name
    expect(policyChange.change.after.bucket).toBe("my-reference-test-bucket");
  });

  test("terraform plan shows dependency graph", async () => {
    const result = await terraform(env, ["plan"]);
    expect(result.exitCode).toBe(0);
    // Plan should show both resources
    expect(result.stdout).toContain("aws_s3_bucket.b");
    expect(result.stdout).toContain("aws_s3_bucket_policy.p");
    expect(result.stdout).toContain("2 to add");
  });

  test("terraform apply creates in correct order", async () => {
    const result = await terraform(env, ["apply", "-auto-approve"]);
    expect(result.exitCode).toBe(0);

    // Read state to verify both resources exist
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    const bucket = resources.find((r: any) => r.type === "aws_s3_bucket");
    const policy = resources.find((r: any) => r.type === "aws_s3_bucket_policy");
    expect(bucket).toBeDefined();
    expect(policy).toBeDefined();

    // Policy should contain a reference to the bucket's ARN
    const policyAttrs = policy.instances[0].attributes;
    expect(policyAttrs.bucket).toBe("my-reference-test-bucket");
    expect(policyAttrs.policy).toContain("arn:aws:s3:::my-reference-test-bucket");
  });

  test("terraform destroy removes in correct order", async () => {
    // Ensure resources exist first
    await terraform(env, ["apply", "-auto-approve"]);

    const result = await terraform(env, ["destroy", "-auto-approve"]);
    expect(result.exitCode).toBe(0);

    // State should be empty
    const statePath = join(env.workDir, "terraform.tfstate");
    const state = JSON.parse(await readFile(statePath, "utf-8"));
    const resources = state.resources ?? [];
    expect(resources).toHaveLength(0);
  });
});
