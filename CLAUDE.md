# Terraform Town

A browser-based Terraform learning game. Players write real HCL, run real
`terraform` commands against a mock AWS backend, and see their infrastructure
rendered in 3D.

## Architecture (Bun monorepo)

| Package | Path | Stack | Purpose |
| --- | --- | --- | --- |
| aws-mock | `packages/aws-mock` | Hono + Effect | Mock AWS API server (HTTP) |
| editor | `packages/editor` | Vite + React 19 + Monaco | HCL code editor UI |
| visualization | `packages/visualization` | React Three Fiber | 3D infrastructure viewer |
| terraform-provider | `packages/terraform-provider-aws-mock` | Go | Terraform provider binary (bridges `terraform` CLI to aws-mock) |

Each package has its own CLAUDE.md with deeper context.

## Tech Stack

| Tool   | Purpose                   |
| ------ | ------------------------- |
| Bun    | Runtime & package manager |
| Hono   | Web framework             |
| Effect | Error handling & retries  |
| oxfmt  | Formatting                |

## Development Principles

- TDD with failure loops - write failing test first, then implement
- Tests must only output on failure (quiet success, loud failure)
- No mocks - use real integrations in tests
- Refactor freely, no backwards compatibility shims
- No re-export shims - when code moves, update all import sites to point to the new location instead of leaving behind proxy re-exports
- Ask questions early - liberally use AskUserQuestion when requirements are unclear or ambiguous

## Testing

- Unit tests live next to source (`*.test.ts`)
- Integration tests: `tests/integration/` — spin up a real Hono server + Terraform CLI
- `tests/helpers.ts` bootstraps the mock server and provider mirror for integration tests

## Commands

```bash
bun install
bun test                                    # Unit tests
bun test tests/integration/                 # Integration (requires Terraform CLI + built Go provider)
bun run format
```

## Gotchas

- `llm-gateway` is a file-linked dep (`file:../../../llm-gateway`) — requires the llm-gateway repo cloned as a sibling directory

## Docs

- `docs/vision.md` — Product vision and game concept
- `docs/visualization-requirements.md` — 3D visualization feature requirements
- `docs/code-editor-proposal.md` — Editor UI design proposal
- `docs/visualization-bugs-and-ideas.md` — Known issues and feature ideas
- `docs/writing-a-good-claude-md.md` — Guidelines for writing CLAUDE.md files
- `docs/plans/` — Design and implementation plans (dated)
