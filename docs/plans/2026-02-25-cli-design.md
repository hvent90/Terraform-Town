# CLI Design — tftown

## What

`tftown` — a CLI tool that visualizes any local terraform project in 3D in the browser, with live streaming during operations.

## Commands

| Command | What it does |
|---|---|
| `tftown start` | Read `.tfstate`, serve viz in browser, watch for changes |
| `tftown stream` | Read piped terraform stdin, parse output, push live events to server |
| `tftown plan [args]` | `terraform plan [args] 2>&1 \| tftown stream` |
| `tftown apply [args]` | `terraform apply [args] 2>&1 \| tftown stream` |
| `tftown destroy [args]` | `terraform destroy [args] 2>&1 \| tftown stream` |
| `tftown refresh [args]` | `terraform refresh [args] 2>&1 \| tftown stream` |
| `tftown import [args]` | `terraform import [args] 2>&1 \| tftown stream` |

Convenience wrappers are one-liners — shell out to `terraform <cmd> [args] 2>&1 | tftown stream`.

## `tftown start` Flow

1. Look for `.tfstate` in cwd (or `--state <path>`)
2. Parse via `StateSync` from visualization package
3. Bundle the client entry (`client/index.tsx` which imports viz components)
4. Start Hono server on port `4444` (or `--port N`)
5. Serve the bundled client + an HTML shell
6. Open browser to `http://localhost:4444`
7. Send initial `TerraformState` over WebSocket
8. Watch `.tfstate` with `fs.watch` — on change, re-parse and push full state over WebSocket
9. Print to terminal: `terraform apply 2>&1 | tftown stream`
10. Listen for POST `/events` from `tftown stream` — broadcast to browser over WebSocket

## `tftown stream` Flow

1. Read stdin line by line
2. Each line → `output-parser` → emits `line` events always, plus `resource` events when lifecycle patterns match
3. POST each event to `http://localhost:4444/events` (or `--port N`)
4. On stdin close → POST `done` event with exit code

## Output Parser

Regex-based line parser. Terraform output follows predictable patterns with `-no-color`:

```
aws_vpc.main: Creating...                    → { type: resource, action: creating }
aws_vpc.main: Creation complete after 2s     → { type: resource, action: created }
aws_vpc.main: Destroying...                  → { type: resource, action: destroying }
aws_vpc.main: Destruction complete after 1s  → { type: resource, action: destroyed }
aws_vpc.main: Modifying...                   → { type: resource, action: modifying }
aws_vpc.main: Modifications complete         → { type: resource, action: modified }
aws_vpc.main: Refreshing state...            → { type: resource, action: refreshing }
aws_vpc.main: Import prepared!               → { type: resource, action: imported }
Error: ...                                   → { type: resource, action: error }
Plan: X to add, Y to change, Z to destroy   → { type: plan_summary, adds, changes, destroys }
```

Every line also emits a `line` event with the raw text.

## WebSocket Protocol (server → browser)

```typescript
{ type: "state",    data: TerraformState }
{ type: "resource", data: { address: string, action: string } }
{ type: "line",     data: { text: string } }
{ type: "done",     data: { exitCode: number } }
```

## Client Bundle (`client/index.tsx`)

- Mounts `Visualization` in a full-viewport container
- Connects WebSocket to `ws://localhost:<port>/ws`
- On `state` message → `vis.update(state)`
- On `resource` message → update matching resource's state, call `vis.update()`
- On `done` → re-read full state (server re-parses `.tfstate` and sends fresh snapshot)

## Files

```
apps/cli/
├── src/
│   ├── index.ts              # Commander setup, command routing, convenience wrappers
│   ├── commands/
│   │   ├── start.ts          # Start server, bundle client, open browser, watch state
│   │   └── stream.ts         # Read stdin, parse, POST events
│   ├── server.ts             # Hono: serve client, /events POST, WebSocket upgrade
│   ├── client/
│   │   └── index.tsx         # Browser: mount viz, WebSocket client
│   ├── output-parser.ts      # Line-by-line terraform output → events
│   ├── events.ts             # Event type definitions
│   ├── watcher.ts            # fs.watch on .tfstate
│   └── state-reader.ts       # Read file, call StateSync
├── package.json              # deps: visualization, hono, commander
└── CLAUDE.md
```

## Dependencies

```
apps/cli ──→ packages/visualization  (types, StateSync, viz React components)
         ──→ hono                    (local server)
         ──→ commander               (CLI parsing)
```

## Design Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| tf-domain extraction | Deferred | CLI imports viz anyway. Extract when server app needs types without viz dependency. |
| Bundle ownership | CLI owns its bundle | Apps bundle for their target. Viz package stays source-only. |
| Server discovery | Default port 4444 + `--port` override | Simpler than lockfiles. Override covers conflicts. |
| Arg parsing | Commander.js | Mature, good subcommand support. |
| Convenience wrappers | Inline in command router | One-liners that exec `terraform <cmd> 2>&1 \| tftown stream`. No separate files. |
| Streaming transport | HTTP POST (stream→server) + WebSocket (server→browser) | Stream process is ephemeral. Server holds the WebSocket connections. |
