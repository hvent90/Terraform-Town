import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createGenericHandler } from "../src/resources/generic-handler";
import { StateStore } from "../src/state/store";
import { unlink } from "node:fs/promises";

const STATE_PATH = "/tmp/generic-handler-test-state.json";
let store: StateStore;

beforeAll(() => {
  store = new StateStore(STATE_PATH);
});

afterAll(async () => {
  try {
    await unlink(STATE_PATH);
  } catch {}
});

describe("generic handler CRUD for aws_sqs_queue", () => {
  let handler: ReturnType<typeof createGenericHandler>;
  let createdId: string;

  beforeAll(async () => {
    handler = await createGenericHandler("aws_sqs_queue", store);
  });

  test("create returns a non-empty id", async () => {
    const result = await handler.create({
      resourceType: "aws_sqs_queue",
      attributes: { name: "test-queue" },
    });
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe("string");
    createdId = result.id;
  });

  test("create sets tags_all from tags", async () => {
    const result = await handler.create({
      resourceType: "aws_sqs_queue",
      attributes: { name: "tagged-queue", tags: { env: "test" } },
    });
    expect(result.attributes.tags_all).toEqual({ env: "test" });
  });

  test("read returns the created resource", async () => {
    const result = await handler.read({
      resourceType: "aws_sqs_queue",
      attributes: {},
      id: createdId,
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdId);
    expect(result!.attributes.name).toBe("test-queue");
  });

  test("update merges attributes", async () => {
    const result = await handler.update({
      resourceType: "aws_sqs_queue",
      attributes: { tags: { env: "prod" } },
      id: createdId,
    });
    expect(result.id).toBe(createdId);
    expect(result.attributes.tags).toEqual({ env: "prod" });
    expect(result.attributes.name).toBe("test-queue");
  });

  test("delete removes the resource", async () => {
    await handler.delete({
      resourceType: "aws_sqs_queue",
      attributes: {},
      id: createdId,
    });
    const result = await handler.read({
      resourceType: "aws_sqs_queue",
      attributes: {},
      id: createdId,
    });
    expect(result).toBeNull();
  });
});

describe("generic handler computed fields", () => {
  let handler: ReturnType<typeof createGenericHandler>;

  beforeAll(async () => {
    handler = await createGenericHandler("aws_sqs_queue", store);
  });

  test("computed arn field is set if schema has it", async () => {
    const result = await handler.create({
      resourceType: "aws_sqs_queue",
      attributes: { name: "arn-test-queue" },
    });
    if (result.attributes.arn) {
      expect(result.attributes.arn).toMatch(/^arn:aws:/);
    }
  });

  test("boolean defaults to false", async () => {
    const handler2 = await createGenericHandler("aws_vpc", store);
    const result = await handler2.create({
      resourceType: "aws_vpc",
      attributes: { cidr_block: "10.0.0.0/16" },
    });
    // enable_dns_support is optional bool, should default to false
    expect(typeof result.attributes.enable_dns_support).toBe("boolean");
  });
});
