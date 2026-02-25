# terraform-provider-aws-mock

Go-based Terraform provider that bridges `terraform` CLI to the aws-mock HTTP server.

## Structure

- `main.go` — Provider entry point
- `client.go` — HTTP client to aws-mock server
- `dynamic_schema.go` — Loads schema JSON for dynamic resource registration
- `schema/` — JSON schema files for AWS resource types
- `resource_*.go` — Per-resource Terraform resource implementations
- `schema_*.go` — Per-resource Terraform schema definitions

## Commands

```bash
go build -o terraform-provider-aws-mock   # Build binary
go test ./...                             # Run tests
```

## Key patterns

- Provider binary must be built before running integration tests
- The binary is referenced by `tests/helpers.ts` via a filesystem mirror
- `dynamic_schema.go` auto-registers resources from `schema/*.json`
- Custom resource implementations (`resource_*.go`) override dynamic ones

## Gotchas

- Provider binary must be rebuilt after Go changes before integration tests will reflect them
- `tests/helpers.ts` in the root references this binary via a filesystem mirror — path must match build output
