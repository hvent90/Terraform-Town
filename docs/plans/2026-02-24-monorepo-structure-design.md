# Monorepo Structure Design

## Context

Terraform Town is an interactive game that teaches Terraform, guided by an AI agent. It also serves as a standalone visualization tool for anyone using Terraform. The monorepo needs to support:

1. **Hosted web app** — learning game with editor, 3D viz, AI copilot, missions, user accounts, server-managed terraform execution
2. **CLI tool** — `tftown start` opens a browser-based 3D visualization of any local terraform repo, with live streaming support

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Web Client                        │
│  (editor, viz, chat, missions, auth UI)              │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket / SSE + REST
┌──────────────────────▼──────────────────────────────┐
│                   API Server                         │
│  (Hono — auth, sessions, progress, routing)          │
├────────────┬─────────────────┬──────────────────────┤
│            │                 │                        │
│   ┌────────▼───────┐ ┌──────▼────────┐              │
│   │   AI Agent     │ │  TF Engine    │              │
│   │  (LLM Gateway, │ │ (workspaces,  │              │
│   │   tools,       │─│  streaming,   │              │
│   │   prompts)     │ │  parsing)     │              │
│   └────────────────┘ └──────┬────────┘              │
│                             │                        │
│                      ┌──────▼────────┐              │
│                      │ Mock Provider  │              │
│                      │ (Go bin + TS   │              │
│                      │  mock server)  │              │
│                      └───────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
terraform-town/
├── apps/
│   ├── web/                          # Hosted SPA — the learning game
│   │   ├── src/
│   │   │   ├── App.tsx               # Composes viz shell with editor + chat + missions
│   │   │   ├── editor/               # Monaco wrapper, file explorer
│   │   │   ├── chat/                 # Chat UI (uses viz themed components)
│   │   │   ├── missions/             # Mission UI, progress (uses viz themed components)
│   │   │   ├── state/                # App-level state management
│   │   │   └── index.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── server/                       # Hosted API server
│   │   ├── src/
│   │   │   ├── index.ts              # Hono app entry
│   │   │   ├── routes/               # Auth, missions, terraform, agent endpoints
│   │   │   ├── auth/                 # User accounts, sessions
│   │   │   └── ws/                   # WebSocket handlers for streaming
│   │   └── package.json
│   │
│   └── cli/                          # CLI tool — tftown
│       ├── src/
│       │   ├── index.ts              # CLI entry, command routing
│       │   ├── commands/
│       │   │   ├── start.ts          # Start viz server, open browser, watch state
│       │   │   ├── stream.ts         # Read piped terraform output, push to viz
│       │   │   ├── plan.ts           # terraform plan [args] 2>&1 | tftown stream
│       │   │   ├── apply.ts          # terraform apply [args] 2>&1 | tftown stream
│       │   │   ├── destroy.ts        # terraform destroy [args] 2>&1 | tftown stream
│       │   │   ├── refresh.ts        # terraform refresh [args] 2>&1 | tftown stream
│       │   │   └── import.ts         # terraform import [args] 2>&1 | tftown stream
│       │   ├── watcher.ts            # Watch .tfstate for changes
│       │   └── serve.ts              # Local Hono server, serves viz with state
│       └── package.json
│
├── packages/
│   ├── visualization/                # The platform — 3D viz + themed UI shell
│   │   └── src/
│   │       ├── theme/                # Theme system
│   │       │   ├── types.ts          # Theme type (3D meshes/effects + 2D UI components)
│   │       │   ├── ThemeProvider.tsx  # React context
│   │       │   └── tron/             # Tron theme implementation
│   │       │       ├── index.ts      # Theme definition
│   │       │       ├── colors.ts     # Color/UI tokens
│   │       │       ├── meshes/       # CubeMesh, ReflectiveGround
│   │       │       ├── shaders/      # TSL shaders
│   │       │       ├── effects/      # HoverDetector, OrbitRing, TraceParticles, etc.
│   │       │       ├── ui/           # Panel, Badge, Slider, ToggleSwitch, etc.
│   │       │       ├── SceneLights.tsx
│   │       │       └── PostProcessing.tsx
│   │       ├── actors/               # ResourceActor, GroundActor, ConnectionActor
│   │       ├── layout/               # Grid, hierarchy, graph, type-cluster layouts
│   │       ├── routing/              # Manhattan routing for connections
│   │       ├── ui/                   # Built-in feature panels
│   │       │   ├── features/         # EffectsPanel, ResourceInspector, LayoutPanel, etc.
│   │       │   └── components/       # Component prop types
│   │       ├── shared/               # Context, geometry
│   │       ├── App.tsx               # Viz app shell with pluggable slots
│   │       └── index.ts              # Public exports
│   │
│   ├── agent/                        # AI copilot (server-side)
│   │   └── src/
│   │       ├── agent.ts              # LLM Gateway agent definition
│   │       ├── tools/                # run-plan, run-apply, review-hcl, explain-plan
│   │       └── prompts/              # System prompts, mission-aware templates
│   │
│   ├── terraform-engine/             # Terraform orchestration
│   │   └── src/
│   │       ├── engine.ts             # Spawn terraform, stream output
│   │       ├── workspace.ts          # Per-user workspace management (hosted mode)
│   │       ├── state-reader.ts       # Read/parse .tfstate files (CLI mode)
│   │       ├── output-parser.ts      # Parse terraform stdout into structured events
│   │       ├── plan-parser.ts        # Parse plan JSON (terraform show -json)
│   │       └── types.ts              # PlanResult, ApplyResult, ResourceChange
│   │
│   ├── aws-mock/                     # Mock AWS CRUD server (existing Hono app)
│   │   └── src/
│   │
│   ├── missions/                     # Curriculum & progression
│   │   └── src/
│   │       ├── definitions/          # Mission specs (objectives, hints, validation)
│   │       ├── validator.ts          # Check terraform state against mission objectives
│   │       └── progression.ts        # Unlock logic, difficulty adaptation
│   │
│   └── shared/                       # Cross-package domain
│       └── src/
│           ├── types.ts              # TerraformState, Resource, Connection, ResourceType
│           ├── hcl-parser.ts         # Consolidated HCL text parser
│           └── state-sync.ts         # Parse raw .tfstate JSON → TerraformState
│
├── providers/
│   └── terraform-provider-aws-mock/  # Go binary (own build system)
│
├── docs/
│   ├── plans/
│   └── vision.md
│
├── scripts/
├── package.json                      # Bun workspace root
└── CLAUDE.md
```

## Package Responsibilities

### apps/web — Hosted Learning Game

The SPA users interact with. Composes the visualization shell with learning-game-specific panels (editor, chat, missions). Consumes themed UI components from visualization to keep everything visually consistent.

### apps/server — API Server

Hono on Bun. Handles auth, sessions, mission progress. Orchestrates the AI agent and terraform engine server-side. Streams events to the web client over WebSocket/SSE.

### apps/cli — CLI Tool

Two core commands:

- `tftown start` — starts a local Hono server serving the visualization, opens browser, watches `.tfstate` for post-operation updates. The viz UI shows the pipe command for users to copy.
- `tftown stream` — reads piped terraform stdout/stderr from stdin, parses output into structured events, pushes live updates to the running viz server over local WebSocket.

Convenience wrappers that pass all arguments through to terraform and pipe output to stream:

- `tftown plan [args]` — `terraform plan [args] 2>&1 | tftown stream`
- `tftown apply [args]` — `terraform apply [args] 2>&1 | tftown stream`
- `tftown destroy [args]` — `terraform destroy [args] 2>&1 | tftown stream`
- `tftown refresh [args]` — `terraform refresh [args] 2>&1 | tftown stream`
- `tftown import [args]` — `terraform import [args] 2>&1 | tftown stream`

### packages/visualization — Platform

The core visual platform. Provides:

- 3D scene (R3F canvas, actors, shaders, effects, layouts, connections)
- Theme system that bundles both 3D styling and 2D UI components
- App shell with pluggable slots for consumer-provided panels
- Built-in panels (effects, resource inspector, layout mode, connections)
- Themed UI component library (Panel, Badge, Slider, ToggleSwitch, etc.) exported for consumers

Consumed by both `apps/web` (with editor + chat + mission slots) and `apps/cli` (no extra slots).

### packages/agent — AI Copilot

Server-side only. LLM Gateway agent with tools for:

- Running terraform plan/apply via the terraform engine
- Reviewing HCL code
- Explaining plan output in plain English
- Teaching terraform concepts
- Adapting to user skill level

### packages/terraform-engine — Terraform Orchestration

Two modes:

- **Hosted mode** — manages per-user terraform workspaces, spawns terraform processes, streams output. Used by `apps/server`.
- **CLI mode** — reads `.tfstate` files, parses terraform output from stdin. Used by `apps/cli`.

Core capability: an **output parser** that takes raw terraform stdout/stderr lines and emits structured events (resource creating, resource created, error, plan summary, etc.). This parser is shared across both modes and is what powers live streaming in the viz.

### packages/aws-mock — Mock AWS Server

Existing Hono server with mock CRUD for AWS resources. Used by the hosted learning game only.

### packages/missions — Curriculum

Mission definitions, objective validation, progression logic. Campaign-style progression where each mission teaches one terraform concept. Used by `apps/server` (validation) and `apps/web` (mission UI types).

### packages/shared — Domain Types

Cross-package types and utilities:

- `TerraformState`, `Resource`, `Connection`, `ResourceType` — the domain model shared by viz, engine, and apps
- HCL text parser — consolidated from the two existing parsers (viz version is more capable, kept)
- State sync — parses raw `.tfstate` JSON into `TerraformState`

## Dependency Graph

```
apps/web ──→ packages/visualization
         ──→ packages/shared
         ──→ packages/missions (types)

apps/server ──→ packages/agent
            ──→ packages/terraform-engine
            ──→ packages/aws-mock
            ──→ packages/missions
            ──→ packages/shared

apps/cli ──→ packages/visualization
         ──→ packages/terraform-engine (state-reader, output-parser)
         ──→ packages/shared

packages/visualization ──→ packages/shared
packages/agent ──→ packages/terraform-engine
               ──→ packages/shared
packages/terraform-engine ──→ packages/shared
packages/missions ──→ packages/shared
```

## Migration — What Moves Where

| Current location | Destination |
|---|---|
| `packages/visualization/` | stays as `packages/visualization/` (remove `TerraformInput`) |
| `packages/editor/src/Editor.tsx`, `FileExplorer.tsx` | `apps/web/src/editor/` |
| `packages/editor/src/App.tsx`, `SplitLayout.tsx`, `Toolbar.tsx` | `apps/web/src/` |
| `packages/editor/src/AssistantPanel.tsx` | `apps/web/src/chat/` |
| `packages/editor/src/assistant.ts` | `packages/agent/` |
| `packages/editor/src/parseHcl.ts` | deleted (use `shared/hcl-parser.ts`) |
| `packages/editor/src/applySync.ts` | `apps/web/src/state/` |
| `packages/visualization/src/state/parseHcl.ts` | `packages/shared/src/hcl-parser.ts` |
| `packages/visualization/src/state/StateSync.ts` | `packages/shared/src/state-sync.ts` |
| `packages/visualization/src/types.ts` (domain types) | `packages/shared/src/types.ts` |
| `packages/aws-mock/` | stays |
| `packages/terraform-provider-aws-mock/` | `providers/terraform-provider-aws-mock/` |
| Root PRD files, RALPH logs, `progress.txt` | `docs/archive/` or delete |
| `packages/editor/` | deleted after migration |

## Open Questions

- Visualization shell slot API — how do consumers pass panels into the shell? Props, children, context? To be designed during implementation.
- CLI auto-discovery — how does `tftown stream` find the running `tftown start` server? Lockfile with port number, or fixed default port?
- Remote state backends — `tftown start` watches `.tfstate` on disk, but many teams use S3/Terraform Cloud backends. May need `terraform show -json` polling as a fallback.
- Theme extensibility — currently only tron theme exists. Should the theme type support third-party themes? Not needed now, but the architecture allows it.
