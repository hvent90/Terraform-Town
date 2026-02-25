# @terraform-town/cli

CLI tool for visualizing Terraform infrastructure in 3D.

## Structure

- `src/index.ts` — CLI entry, Commander setup, command routing
- `src/commands/start.ts` — Start viz server, open browser, watch state
- `src/commands/stream.ts` — Read piped stdin, parse terraform output, push events
- `src/server.ts` — Hono server (HTTP + WebSocket)
- `src/client/index.tsx` — Browser entry (mounts viz, connects WebSocket)
- `src/output-parser.ts` — Parse terraform stdout lines into structured events
- `src/events.ts` — Event type definitions
- `src/watcher.ts` — Watch .tfstate for changes
- `src/state-reader.ts` — Read and parse .tfstate files

## Commands

```bash
bun run dev          # Run CLI locally
bun test             # Run tests
```

## Key patterns

- Apps own their bundles — client/index.tsx is bundled by Bun for the browser
- Output parser is regex-based, parses terraform -no-color stdout
- WebSocket for server→browser, HTTP POST for stream→server
- Default port 4444, override with --port
