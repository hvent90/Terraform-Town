# @terraform-town/editor

HCL code editor UI. Players write Terraform configurations here.

## Structure

- `src/index.tsx` — Entry point
- `src/App.tsx` — Root component
- `src/Editor.tsx` — Monaco editor wrapper
- `src/FileExplorer.tsx` — File tree sidebar
- `src/AssistantPanel.tsx` — LLM assistant panel (uses llm-gateway)
- `src/assistant.ts` — Assistant integration logic
- `src/SplitLayout.tsx` — Split pane layout between editor and panels
- `src/Toolbar.tsx` — Toolbar with action buttons
- `src/parseHcl.ts` — HCL parsing utilities
- `src/applySync.ts` — Terraform apply synchronization

## Commands

```bash
bun run dev        # Vite dev server
bun run build      # Production build
bun run test       # vitest run
bun run test:watch # vitest watch mode
```

## Key patterns

- Uses React 19
- Monaco Editor for HCL editing

## Gotchas

- `llm-gateway` is a file-linked dep (`file:../../../llm-gateway`) — will fail if that repo isn't cloned as a sibling directory
