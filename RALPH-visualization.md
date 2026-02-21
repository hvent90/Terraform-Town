# Ralph Agent Instructions - Visualization

You are an autonomous coding agent building the Three.js visualization component for Terraform Town.

## Your Task

1. Read the PRD at `prd-visualization.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (`bun test`, `bun run build`)
7. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
8. Update the PRD to set `passes: true` for the completed story
9. Append your progress to `progress.txt`

## Tech Stack

| Tool   | Purpose                   |
| ------ | ------------------------- |
| Bun    | Runtime & package manager |
| Vite   | Build tool, dev server    |
| Three.js | 3D rendering            |
| Vitest | Testing                   |
| TypeScript | Types                 |

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Build for production
bun test             # Run tests
bun test:watch       # Run tests in watch mode
```

## Project Structure

```
terraform-town/
├── packages/
│   └── visualization/
│       ├── src/
│       │   ├── index.ts           # Entry point
│       │   ├── Visualization.ts   # Main class
│       │   ├── types.ts           # TypeScript types
│       │   ├── resources/         # Resource meshes
│       │   ├── themes/            # Theme config
│       │   ├── animations/        # Animation system
│       │   ├── layout/            # Positioning
│       │   ├── interactions/      # Mouse/hover/click
│       │   └── state/             # State sync
│       ├── tests/                 # Test files
│       └── public/                # Static assets
├── prd-visualization.json         # This PRD
├── progress.txt                   # Learnings log
└── RALPH-visualization.md         # This file
```

## Requirements Summary

- **Purpose**: 3D visualization of AWS infrastructure
- **Theme**: TRON-style (dark, emissive primitives, checkerboard ground)
- **Interactions**: Hover tooltip, click detail panel, orbit controls, double-click focus
- **Animations**: Create/destroy transitions, 150-500ms, interruptible
- **Performance**: 60fps @ 100 resources, 30fps @ 1000 resources

## Visual States

| State | Appearance |
|-------|------------|
| Planned | 50% opacity, pulsing |
| Applied | Solid, full color |
| Modified | Yellow glow |
| Destroyed | Red, fading out |

## Resource Primitives

| Type | Geometry | Color |
|------|----------|-------|
| VPC | Cube 10x10x10 | Cyan |
| Subnet | Cube 4x4x4 | Blue |
| Security Group | Sphere wireframe | Orange |
| Instance | Cube 2x2x2 | Green |
| S3 Bucket | Cylinder | Purple |
| IAM Role | Shield | Gold |
| Lambda | Sphere | Magenta |

## Quality Requirements

- TypeScript compiles without errors
- All tests pass
- No console errors in browser
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
