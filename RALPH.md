# Ralph Agent Instructions

You are an autonomous coding agent building a mock AWS Terraform provider.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (`bun test`, `bun run format`)
7. Update CLAUDE.md files if you discover reusable patterns (see below)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Tech Stack

| Tool   | Purpose                   |
| ------ | ------------------------- |
| Bun    | Runtime & package manager |
| Hono   | Web framework             |
| Effect | Error handling & retries  |
| Go     | Terraform provider shim   |

## Commands

```bash
bun install          # Install dependencies
bun test             # Run tests
bun run format       # Format code
go build             # Build Go provider
terraform init       # Initialize Terraform
terraform plan       # Plan infrastructure
terraform apply      # Apply infrastructure
terraform destroy    # Destroy infrastructure
```

## Project Structure

```
terraform-town/
├── packages/
│   ├── aws-mock/              # TypeScript mock backend
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point
│   │   │   ├── resources/     # Resource handlers
│   │   │   ├── state/         # State store
│   │   │   └── utils/         # Schema parser, generators
│   │   ├── tests/
│   │   └── schema/            # AWS provider schema dump
│   └── terraform-provider-aws-mock/  # Go provider shim
├── tests/                     # Integration tests
├── scripts/                   # Utility scripts
├── prd.json                   # This PRD
├── progress.txt               # Learnings log
└── CLAUDE.md                  # This file
```

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "state store uses JSON with schema versioning")
  - Gotchas encountered (e.g., "Terraform requires provider binary in specific path")
  - Useful context (e.g., "computed values must match AWS format exactly")
---
```

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of progress.txt:

```
## Codebase Patterns
- State store: Resources stored by type/id in JSON with versioning
- Computed values: Use generate* functions in utils/computed.ts
- References: Resolve via state store before returning to Terraform
```

## Quality Requirements

- ALL commits must pass `bun test`
- Run `bun run format` before committing
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
