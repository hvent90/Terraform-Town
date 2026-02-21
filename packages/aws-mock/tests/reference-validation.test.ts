import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateStore } from "../src/state/store";
import { validateReferenceExists } from "../src/utils/validation";

describe("validateReferenceExists", () => {
  let tempDir: string;
  let store: StateStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ref-validation-test-"));
    store = new StateStore(join(tempDir, "state.json"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  test("returns null when resource exists", async () => {
    await store.createResource("aws_subnet", "subnet-abc123", { cidr_block: "10.0.1.0/24" });

    const result = await validateReferenceExists(store, "aws_subnet", "subnet-abc123", "subnet_id");

    expect(result).toBeNull();
  });

  test("returns error when resource does not exist", async () => {
    const result = await validateReferenceExists(
      store,
      "aws_subnet",
      "subnet-nonexistent",
      "subnet_id",
    );

    expect(result).not.toBeNull();
    expect(result).toContain("subnet");
    expect(result).toContain("subnet-nonexistent");
    expect(result).toContain("not found");
  });

  test("returns error for wrong resource type", async () => {
    await store.createResource("aws_vpc", "vpc-abc123", { cidr_block: "10.0.0.0/16" });

    const result = await validateReferenceExists(store, "aws_subnet", "vpc-abc123", "subnet_id");

    expect(result).not.toBeNull();
    expect(result).toContain("not found");
  });

  test("includes friendly resource type name in error", async () => {
    const result = await validateReferenceExists(
      store,
      "aws_security_group",
      "sg-missing",
      "vpc_security_group_ids",
    );

    expect(result).toContain("security group");
  });
});
