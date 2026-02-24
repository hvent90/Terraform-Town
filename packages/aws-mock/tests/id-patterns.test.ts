import { test, expect } from "bun:test";
import { generateResourceId } from "../src/resources/id-patterns";

test("vpc gets vpc- prefix", () => {
  const id = generateResourceId("aws_vpc", {});
  expect(id).toMatch(/^vpc-[0-9a-f]+$/);
});

test("subnet gets subnet- prefix", () => {
  const id = generateResourceId("aws_subnet", {});
  expect(id).toMatch(/^subnet-[0-9a-f]+$/);
});

test("security group gets sg- prefix", () => {
  const id = generateResourceId("aws_security_group", {});
  expect(id).toMatch(/^sg-[0-9a-f]+$/);
});

test("instance gets i- prefix", () => {
  const id = generateResourceId("aws_instance", {});
  expect(id).toMatch(/^i-[0-9a-f]+$/);
});

test("internet gateway gets igw- prefix", () => {
  const id = generateResourceId("aws_internet_gateway", {});
  expect(id).toMatch(/^igw-[0-9a-f]+$/);
});

test("route table gets rtb- prefix", () => {
  const id = generateResourceId("aws_route_table", {});
  expect(id).toMatch(/^rtb-[0-9a-f]+$/);
});

test("s3 bucket uses bucket name as id", () => {
  const id = generateResourceId("aws_s3_bucket", { bucket: "my-bucket" });
  expect(id).toBe("my-bucket");
});

test("iam role uses name as id", () => {
  const id = generateResourceId("aws_iam_role", { name: "my-role" });
  expect(id).toBe("my-role");
});

test("lambda function uses function_name as id", () => {
  const id = generateResourceId("aws_lambda_function", { function_name: "my-fn" });
  expect(id).toBe("my-fn");
});

test("unknown resource gets a hex id", () => {
  const id = generateResourceId("aws_some_unknown_thing", {});
  expect(id).toMatch(/^[0-9a-f]+$/);
  expect(id.length).toBeGreaterThanOrEqual(16);
});

test("each call generates a unique id", () => {
  const ids = new Set(Array.from({ length: 10 }, () => generateResourceId("aws_vpc", {})));
  expect(ids.size).toBe(10);
});
