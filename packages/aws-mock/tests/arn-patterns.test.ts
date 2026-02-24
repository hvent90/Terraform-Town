import { test, expect } from "bun:test";
import { generateResourceArn } from "../src/resources/arn-patterns";

test("ec2 vpc arn", () => {
  const arn = generateResourceArn("aws_vpc", "vpc-abc123", "us-east-1");
  expect(arn).toBe("arn:aws:ec2:us-east-1:123456789012:vpc/vpc-abc123");
});

test("ec2 subnet arn", () => {
  const arn = generateResourceArn("aws_subnet", "subnet-abc123", "us-west-2");
  expect(arn).toBe("arn:aws:ec2:us-west-2:123456789012:subnet/subnet-abc123");
});

test("ec2 security group arn", () => {
  const arn = generateResourceArn("aws_security_group", "sg-abc123", "us-east-1");
  expect(arn).toBe("arn:aws:ec2:us-east-1:123456789012:security-group/sg-abc123");
});

test("ec2 instance arn", () => {
  const arn = generateResourceArn("aws_instance", "i-abc123", "us-east-1");
  expect(arn).toBe("arn:aws:ec2:us-east-1:123456789012:instance/i-abc123");
});

test("s3 bucket arn (no region)", () => {
  const arn = generateResourceArn("aws_s3_bucket", "my-bucket", "us-east-1");
  expect(arn).toBe("arn:aws:s3:::my-bucket");
});

test("iam role arn (no region)", () => {
  const arn = generateResourceArn("aws_iam_role", "my-role", "us-east-1");
  expect(arn).toBe("arn:aws:iam::123456789012:role/my-role");
});

test("lambda function arn", () => {
  const arn = generateResourceArn("aws_lambda_function", "my-fn", "us-east-1");
  expect(arn).toBe("arn:aws:lambda:us-east-1:123456789012:function:my-fn");
});

test("sqs queue arn", () => {
  const arn = generateResourceArn("aws_sqs_queue", "my-queue", "us-east-1");
  expect(arn).toBe("arn:aws:sqs:us-east-1:123456789012:my-queue");
});

test("sns topic arn", () => {
  const arn = generateResourceArn("aws_sns_topic", "my-topic", "us-east-1");
  expect(arn).toBe("arn:aws:sns:us-east-1:123456789012:my-topic");
});

test("dynamodb table arn", () => {
  const arn = generateResourceArn("aws_dynamodb_table", "my-table", "us-east-1");
  expect(arn).toBe("arn:aws:dynamodb:us-east-1:123456789012:table/my-table");
});

test("unknown resource returns null", () => {
  const arn = generateResourceArn("aws_some_weird_thing", "abc", "us-east-1");
  expect(arn).toBeNull();
});
