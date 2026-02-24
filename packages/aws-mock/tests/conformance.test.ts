import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { StateStore } from "../src/state/store";
import { buildHandlerRegistry } from "../src/resources/registry";
import { getAllResourceTypes, parseResourceDefinition } from "../src/utils/schema-parser";
import { synthesizeMinimalAttributes, synthesizeUpdateAttributes } from "../src/utils/value-synthesizer";
import type { ResourceHandler } from "../src/resources/types";
import { unlink } from "node:fs/promises";

const STATE_PATH = "/tmp/conformance-test-state.json";

let store: StateStore;
let handlers: Record<string, ResourceHandler>;
let allTypes: string[];

beforeAll(async () => {
  store = new StateStore(STATE_PATH);
  handlers = await buildHandlerRegistry(store);
  allTypes = await getAllResourceTypes();
});

afterAll(async () => {
  try {
    await unlink(STATE_PATH);
  } catch {}
});

describe("conformance", () => {
  // We test every resource type by iterating after setup
  test("all resource types have handlers", () => {
    expect(allTypes.length).toBeGreaterThan(1500);
    for (const type of allTypes) {
      expect(handlers[type]).toBeDefined();
    }
  });

  // Parametric CRUD lifecycle for each resource type
  // Use describe.each-like pattern via a loop
  test("CRUD lifecycle for all resource types", async () => {
    let passed = 0;
    const failures: string[] = [];

    for (const resourceType of allTypes) {
      try {
        const handler = handlers[resourceType];
        const schema = await parseResourceDefinition(resourceType);
        const attrs = synthesizeMinimalAttributes(schema, resourceType);

        // 1. Create
        const created = await handler.create({
          resourceType,
          attributes: attrs,
        });

        if (!created.id || typeof created.id !== "string" || created.id.length === 0) {
          failures.push(`${resourceType}: create returned empty id`);
          continue;
        }

        // 2. Read
        const read = await handler.read({
          resourceType,
          attributes: {},
          id: created.id,
        });

        if (!read) {
          failures.push(`${resourceType}: read returned null after create`);
          continue;
        }

        if (read.id !== created.id) {
          failures.push(`${resourceType}: read id mismatch`);
          continue;
        }

        // 3. Update
        const updateAttrs = synthesizeUpdateAttributes(schema, resourceType);
        const updated = await handler.update({
          resourceType,
          attributes: updateAttrs,
          id: created.id,
        });

        if (updated.id !== created.id) {
          failures.push(`${resourceType}: update id mismatch`);
          continue;
        }

        // Verify update was applied (only check attrs the handler actually stores)
        for (const [key, value] of Object.entries(updateAttrs)) {
          if (key in updated.attributes) {
            if (JSON.stringify(updated.attributes[key]) !== JSON.stringify(value)) {
              failures.push(`${resourceType}: update attr ${key} not applied`);
              continue;
            }
          }
        }

        // 4. Delete
        await handler.delete({
          resourceType,
          attributes: {},
          id: created.id,
        });

        const afterDelete = await handler.read({
          resourceType,
          attributes: {},
          id: created.id,
        });

        if (afterDelete !== null) {
          failures.push(`${resourceType}: read returned non-null after delete`);
          continue;
        }

        // 5. Computed fields check
        if (created.attributes.arn) {
          const arn = created.attributes.arn as string;
          if (!arn.startsWith("arn:aws:")) {
            failures.push(`${resourceType}: arn doesn't start with arn:aws:`);
            continue;
          }
        }

        passed++;
      } catch (e) {
        failures.push(`${resourceType}: ${(e as Error).message}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `${failures.length} resource types failed:\n${failures.join("\n")}`,
      );
    }

    expect(passed).toBe(allTypes.length);
  });
});
