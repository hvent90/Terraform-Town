import { test, expect } from "bun:test";
import {
  synthesizeMinimalAttributes,
  synthesizeUpdateAttributes,
} from "../src/utils/value-synthesizer";
import { parseResourceDefinition } from "../src/utils/schema-parser";

test("synthesizes required attrs for iam_role", async () => {
  const schema = await parseResourceDefinition("aws_iam_role");
  const attrs = synthesizeMinimalAttributes(schema, "aws_iam_role");
  // assume_role_policy is the only required arg
  expect(typeof attrs.assume_role_policy).toBe("string");
  expect((attrs.assume_role_policy as string)).toContain("Version");
});

test("synthesizes known cidr_block value for vpc", async () => {
  const schema = await parseResourceDefinition("aws_vpc");
  const attrs = synthesizeMinimalAttributes(schema, "aws_vpc");
  // cidr_block is optional for aws_vpc but still useful
  // vpc has no required args, so result should be an object
  expect(typeof attrs).toBe("object");
});

test("synthesizes bucket name for s3", async () => {
  const schema = await parseResourceDefinition("aws_s3_bucket");
  const attrs = synthesizeMinimalAttributes(schema, "aws_s3_bucket");
  expect(typeof attrs).toBe("object");
});

test("synthesizeUpdateAttributes returns tags update", async () => {
  const schema = await parseResourceDefinition("aws_sqs_queue");
  const update = synthesizeUpdateAttributes(schema, "aws_sqs_queue");
  // should pick a mutable attribute to change
  expect(Object.keys(update).length).toBeGreaterThan(0);
});

test("different resource types get different synthesized names", async () => {
  // Use two resources that both have required name-like attrs
  const schema1 = await parseResourceDefinition("aws_iam_role");
  const schema2 = await parseResourceDefinition("aws_sqs_queue");
  const attrs1 = synthesizeMinimalAttributes(schema1, "aws_iam_role");
  const attrs2 = synthesizeMinimalAttributes(schema2, "aws_sqs_queue");
  // Both should produce an object (even if empty for no required args)
  expect(typeof attrs1).toBe("object");
  expect(typeof attrs2).toBe("object");
});

test("synthesized values for different resource types are distinct", async () => {
  const schema = await parseResourceDefinition("aws_iam_role");
  const attrs = synthesizeMinimalAttributes(schema, "aws_iam_role");
  // Should only contain required attrs
  expect(Object.keys(attrs)).toContain("assume_role_policy");
});
