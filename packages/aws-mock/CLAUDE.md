# @terraform-town/aws-mock

Mock AWS API server. Receives HTTP requests from the Go Terraform provider and
persists resource state to disk as JSON.

## Structure

- `src/index.ts` — Hono app factory (`createApp(statePath)`)
- `src/resources/types.ts` — `ResourceHandler` interface definition
- `src/resources/registry.ts` — Builds handler map (custom handlers override generic)
- `src/resources/generic-handler.ts` — Schema-driven handler for all 1,500+ AWS resource types
- `src/resources/arn-patterns.ts` — ARN generation utilities
- `src/resources/id-patterns.ts` — ID generation utilities
- `src/state/store.ts` — JSON file-backed state store
- `src/utils/` — Schema parsing, validation, computed properties, value synthesis

## Adding a resource

1. Create `src/resources/<type>.ts` implementing `ResourceHandler`
2. The registry auto-discovers it; falls back to `generic-handler` for unregistered types

## Commands

```bash
bun run dev   # Watch mode
bun test      # Unit tests
```

## Key patterns

- Custom handlers (vpc, subnet, etc.) exist for resources needing special ID/ARN generation
- Generic handler reads schema from `packages/terraform-provider-aws-mock/schema/`
- State store is a single JSON file per `createApp()` call

## Gotchas

- Generic handler reads schema JSON from `packages/terraform-provider-aws-mock/schema/` — cross-package dependency
- Custom handlers override generic ones by matching on resource type name, not explicit registration
