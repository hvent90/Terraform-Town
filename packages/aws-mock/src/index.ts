import { Hono } from "hono";
import { StateStore } from "./state/store";
import { createS3BucketHandler } from "./resources/s3-bucket";
import { createS3BucketPolicyHandler } from "./resources/s3-bucket-policy";
import { createVpcHandler } from "./resources/vpc";
import { createSubnetHandler } from "./resources/subnet";
import type { ResourceHandler } from "./resources/types";

export function createApp(statePath: string) {
  const app = new Hono();
  const store = new StateStore(statePath);

  const handlers: Record<string, ResourceHandler> = {
    aws_s3_bucket: createS3BucketHandler(store),
    aws_s3_bucket_policy: createS3BucketPolicyHandler(store),
    aws_vpc: createVpcHandler(store),
    aws_subnet: createSubnetHandler(store),
  };

  // Create
  app.post("/resource/:type", async (c) => {
    const type = c.req.param("type");
    const handler = handlers[type];
    if (!handler) {
      return c.json({ error: `Unknown resource type: ${type}` }, 404);
    }

    const body = await c.req.json();
    if (!body.attributes) {
      return c.json({ error: "Missing attributes" }, 400);
    }

    const result = await handler.create({
      resourceType: type,
      attributes: body.attributes,
    });

    return c.json(result, 201);
  });

  // Read
  app.get("/resource/:type/:id", async (c) => {
    const type = c.req.param("type");
    const id = c.req.param("id");
    const handler = handlers[type];
    if (!handler) {
      return c.json({ error: `Unknown resource type: ${type}` }, 404);
    }

    const result = await handler.read({
      resourceType: type,
      attributes: {},
      id,
    });

    if (!result) {
      return c.json({ error: `Resource ${type}/${id} not found` }, 404);
    }

    return c.json(result);
  });

  // Update
  app.put("/resource/:type/:id", async (c) => {
    const type = c.req.param("type");
    const id = c.req.param("id");
    const handler = handlers[type];
    if (!handler) {
      return c.json({ error: `Unknown resource type: ${type}` }, 404);
    }

    const body = await c.req.json();
    const result = await handler.update({
      resourceType: type,
      attributes: body.attributes,
      id,
    });

    return c.json(result);
  });

  // Delete
  app.delete("/resource/:type/:id", async (c) => {
    const type = c.req.param("type");
    const id = c.req.param("id");
    const handler = handlers[type];
    if (!handler) {
      return c.json({ error: `Unknown resource type: ${type}` }, 404);
    }

    await handler.delete({
      resourceType: type,
      attributes: {},
      id,
    });

    return c.body(null, 204);
  });

  return app;
}

// Start server when run directly
const app = createApp("./state.json");

export default {
  port: 3000,
  fetch: app.fetch,
};
