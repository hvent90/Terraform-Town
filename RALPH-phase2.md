# Ralph Agent Instructions - Phase 2

You are an autonomous coding agent adding EC2 stack resources to the terraform-town mock AWS provider.

## Your Task

1. Read the PRD at `prd-phase2.json` (in the same directory as this file)
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

## Generated Test Suites

Test suites are auto-generated from AWS schema in `tests/generated/`:
- `aws_vpc/` - VPC tests
- `aws_subnet/` - Subnet tests  
- `aws_security_group/` - Security group tests
- `aws_instance/` - EC2 instance tests

Each generated test suite includes:
- `minimal.tf` - Minimal valid HCL config
- `with_references.tf` - Config with resource dependencies
- `expected_outputs.json` - Expected computed values
- `*.test.ts` - Integration test file

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
│   │   └── schema/            # AWS provider schema
│   └── terraform-provider-aws-mock/  # Go provider shim
├── tests/
│   ├── integration/           # Integration tests
│   ├── generated/             # Auto-generated tests
│   └── helpers.ts             # Test helpers
├── scripts/
│   ├── ralph.sh               # Ralph loop script
│   ├── run-tests.sh           # Test runner
│   └── generate-tests.ts      # Test generator
├── prd-phase2.json            # This PRD
├── progress.txt               # Learnings log
└── RALPH-phase2.md            # This file
```

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
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
