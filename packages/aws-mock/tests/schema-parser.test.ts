import { test, expect } from "bun:test";
import { parseResourceDefinition } from "../src/utils/schema-parser";

const s3Bucket = await parseResourceDefinition("aws_s3_bucket");

test("returns required args (aws_s3_bucket has none)", () => {
  expect(s3Bucket.requiredArgs).toEqual([]);
});

test("returns optional args", () => {
  expect(s3Bucket.optionalArgs).toContainEqual(
    expect.objectContaining({ name: "bucket", type: "string" }),
  );
  expect(s3Bucket.optionalArgs).toContainEqual(expect.objectContaining({ name: "tags" }));
  expect(s3Bucket.optionalArgs).toContainEqual(
    expect.objectContaining({ name: "force_destroy", type: "bool" }),
  );
});

test("returns computed attributes", () => {
  const computedNames = s3Bucket.computedAttrs.map((a) => a.name);
  expect(computedNames).toContain("arn");
  expect(computedNames).toContain("bucket_domain_name");
  expect(computedNames).toContain("bucket_regional_domain_name");
  expect(computedNames).toContain("hosted_zone_id");
  expect(computedNames).toContain("region");
});

test("computed attributes have types", () => {
  const arn = s3Bucket.computedAttrs.find((a) => a.name === "arn");
  expect(arn).toBeDefined();
  expect(arn!.type).toBe("string");
});

test("returns nested blocks", () => {
  const blockNames = s3Bucket.nestedBlocks.map((b) => b.name);
  expect(blockNames).toContain("timeouts");
  expect(blockNames).toContain("versioning");
  expect(blockNames).toContain("cors_rule");
});

test("nested blocks have nesting mode", () => {
  const timeouts = s3Bucket.nestedBlocks.find((b) => b.name === "timeouts");
  expect(timeouts).toBeDefined();
  expect(timeouts!.nestingMode).toBe("single");

  const corsRule = s3Bucket.nestedBlocks.find((b) => b.name === "cors_rule");
  expect(corsRule).toBeDefined();
  expect(corsRule!.nestingMode).toBe("list");
});

test("nested blocks have their own attributes", () => {
  const versioning = s3Bucket.nestedBlocks.find((b) => b.name === "versioning");
  expect(versioning).toBeDefined();
  expect(versioning!.attributes.length).toBeGreaterThan(0);
});

test("throws for unknown resource type", () => {
  expect(parseResourceDefinition("aws_nonexistent_foo")).rejects.toThrow();
});
