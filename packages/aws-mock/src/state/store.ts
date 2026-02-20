import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

interface StoredResource {
  id: string;
  attributes: Record<string, unknown>;
}

interface StateData {
  version: 1;
  resources: Record<string, Record<string, StoredResource>>;
}

export class StateStore {
  constructor(private filePath: string) {}

  private async load(): Promise<StateData> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return { version: 1, resources: {} };
    }
  }

  private async save(state: StateData): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2));
  }

  async createResource(
    type: string,
    id: string,
    attributes: Record<string, unknown>,
  ): Promise<StoredResource> {
    const state = await this.load();
    if (!state.resources[type]) {
      state.resources[type] = {};
    }
    const resource: StoredResource = { id, attributes };
    state.resources[type][id] = resource;
    await this.save(state);
    return resource;
  }

  async readResource(type: string, id: string): Promise<StoredResource | null> {
    const state = await this.load();
    return state.resources[type]?.[id] ?? null;
  }

  async updateResource(
    type: string,
    id: string,
    attributes: Record<string, unknown>,
  ): Promise<StoredResource> {
    const state = await this.load();
    const existing = state.resources[type]?.[id];
    if (!existing) {
      throw new Error(`Resource ${type}/${id} not found`);
    }
    existing.attributes = attributes;
    await this.save(state);
    return existing;
  }

  async deleteResource(type: string, id: string): Promise<void> {
    const state = await this.load();
    const existing = state.resources[type]?.[id];
    if (!existing) {
      throw new Error(`Resource ${type}/${id} not found`);
    }
    delete state.resources[type][id];
    await this.save(state);
  }
}
