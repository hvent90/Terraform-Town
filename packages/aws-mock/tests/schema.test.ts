import { test, expect } from "bun:test";
import { existsSync, statSync } from "fs";
import { join } from "path";

const schemaPath = join(import.meta.dir, "../schema/aws-provider-schema.json");

test("schema file exists", () => {
  expect(existsSync(schemaPath)).toBe(true);
});

test("schema is valid JSON", async () => {
  const file = Bun.file(schemaPath);
  const data = await file.json();
  expect(data).toBeDefined();
});

test("schema contains resource_schemas for aws_s3_bucket", async () => {
  const file = Bun.file(schemaPath);
  const data = await file.json();
  const providerSchemas = data.provider_schemas;
  const providerKey = Object.keys(providerSchemas).find((k) => k.includes("aws"));
  expect(providerKey).toBeDefined();
  const resourceSchemas = providerSchemas[providerKey!].resource_schemas;
  expect(resourceSchemas.aws_s3_bucket).toBeDefined();
});

test("schema size is > 10MB", () => {
  const stats = statSync(schemaPath);
  expect(stats.size).toBeGreaterThan(10 * 1024 * 1024);
});
