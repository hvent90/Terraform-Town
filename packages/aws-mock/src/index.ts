import { Hono } from "hono";
import { StateStore } from "./state/store";
import { buildHandlerRegistry } from "./resources/registry";
import type { ResourceHandler } from "./resources/types";
import { validateRegion } from "./utils/validation";

export async function createApp(statePath: string) {
  const app = new Hono();
  const store = new StateStore(statePath);

  const handlers: Record<string, ResourceHandler> =
    await buildHandlerRegistry(store);

  // Provider configuration
  app.post("/provider/configure", async (c) => {
    const body = await c.req.json();
    const region = body.region;
    const error = validateRegion(region);
    if (error) {
      return c.json({ error }, 400);
    }
    return c.json({ region }, 200);
  });

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

    try {
      const result = await handler.create({
        resourceType: type,
        attributes: body.attributes,
      });

      return c.json(result, 201);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
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
    try {
      const result = await handler.update({
        resourceType: type,
        attributes: body.attributes,
        id,
      });

      return c.json(result);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
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
const app = await createApp("./state.json");

export default {
  port: 3000,
  fetch: app.fetch,
};
