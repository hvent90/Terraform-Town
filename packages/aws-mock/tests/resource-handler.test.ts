import { describe, expect, test } from "bun:test";
import type { ResourceHandler, ResourceContext, ResourceResult } from "../src/resources/types";

describe("Resource interface types", () => {
  test("ResourceContext has resourceType and attributes", () => {
    const ctx: ResourceContext = {
      resourceType: "aws_s3_bucket",
      attributes: { bucket: "my-bucket" },
    };
    expect(ctx.resourceType).toBe("aws_s3_bucket");
    expect(ctx.attributes).toEqual({ bucket: "my-bucket" });
  });

  test("ResourceContext supports optional id for read/update/delete", () => {
    const ctx: ResourceContext = {
      resourceType: "aws_s3_bucket",
      attributes: {},
      id: "my-bucket-id",
    };
    expect(ctx.id).toBe("my-bucket-id");
  });

  test("ResourceResult contains id and attributes", () => {
    const result: ResourceResult = {
      id: "my-bucket",
      attributes: {
        bucket: "my-bucket",
        arn: "arn:aws:s3:::my-bucket",
      },
    };
    expect(result.id).toBe("my-bucket");
    expect(result.attributes.arn).toBe("arn:aws:s3:::my-bucket");
  });

  test("ResourceResult can be null for delete/not-found", () => {
    const result: ResourceResult | null = null;
    expect(result).toBeNull();
  });

  test("ResourceHandler interface has CRUD methods", () => {
    const handler: ResourceHandler = {
      create: async (ctx: ResourceContext): Promise<ResourceResult> => ({
        id: "test-id",
        attributes: { bucket: "test" },
      }),
      read: async (ctx: ResourceContext): Promise<ResourceResult | null> => ({
        id: "test-id",
        attributes: { bucket: "test" },
      }),
      update: async (ctx: ResourceContext): Promise<ResourceResult> => ({
        id: "test-id",
        attributes: { bucket: "test-updated" },
      }),
      delete: async (ctx: ResourceContext): Promise<void> => {},
    };

    expect(handler.create).toBeFunction();
    expect(handler.read).toBeFunction();
    expect(handler.update).toBeFunction();
    expect(handler.delete).toBeFunction();
  });

  test("ResourceHandler methods accept ResourceContext and return expected types", async () => {
    const handler: ResourceHandler = {
      create: async (ctx) => ({
        id: ctx.attributes.bucket as string,
        attributes: {
          bucket: ctx.attributes.bucket,
          arn: `arn:aws:s3:::${ctx.attributes.bucket}`,
        },
      }),
      read: async (ctx) => {
        if (!ctx.id) return null;
        return {
          id: ctx.id,
          attributes: { bucket: ctx.id },
        };
      },
      update: async (ctx) => ({
        id: ctx.id!,
        attributes: { ...ctx.attributes },
      }),
      delete: async (_ctx) => {},
    };

    const createResult = await handler.create({
      resourceType: "aws_s3_bucket",
      attributes: { bucket: "test-bucket" },
    });
    expect(createResult.id).toBe("test-bucket");
    expect(createResult.attributes.arn).toBe("arn:aws:s3:::test-bucket");

    const readResult = await handler.read({
      resourceType: "aws_s3_bucket",
      attributes: {},
      id: "test-bucket",
    });
    expect(readResult).not.toBeNull();
    expect(readResult!.id).toBe("test-bucket");

    const readNull = await handler.read({
      resourceType: "aws_s3_bucket",
      attributes: {},
    });
    expect(readNull).toBeNull();

    const updateResult = await handler.update({
      resourceType: "aws_s3_bucket",
      attributes: { tags: { env: "prod" } },
      id: "test-bucket",
    });
    expect(updateResult.id).toBe("test-bucket");

    const deleteResult = await handler.delete({
      resourceType: "aws_s3_bucket",
      attributes: {},
      id: "test-bucket",
    });
    expect(deleteResult).toBeUndefined();
  });
});
