export interface ResourceContext {
  resourceType: string;
  attributes: Record<string, unknown>;
  id?: string;
}

export interface ResourceResult {
  id: string;
  attributes: Record<string, unknown>;
}

export interface ResourceHandler {
  create(ctx: ResourceContext): Promise<ResourceResult>;
  read(ctx: ResourceContext): Promise<ResourceResult | null>;
  update(ctx: ResourceContext): Promise<ResourceResult>;
  delete(ctx: ResourceContext): Promise<void>;
}
