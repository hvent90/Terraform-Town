# Ralph Agent Instructions - Editor and Assistant

You are building the Monaco code editor and AI assistant for Terraform Town.

## Your Task

1. Read the PRD at `prd-editor.json`
2. Read the progress log at `progress.txt`
3. Check you're on branch `ralph/editor-and-assistant`
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks
7. If checks pass, commit: `feat: [Story ID] - [Story Title]`
8. Update the PRD: set `passes: true`
9. Append your progress to `progress.txt`

## Tech Stack

| Tool | Purpose |
|------|---------|
| Monaco Editor | Code editor |
| llm-gateway | AI assistant framework |
| React | UI components |
| Three.js | Visualization (already built) |
| Bun | Runtime |

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun test             # Run tests
```

## Project Structure

```
terraform-town/
├── packages/
│   ├── visualization/     # Already built (Three.js)
│   └── editor/            # NEW: Monaco editor
│       ├── src/
│       │   ├── Editor.tsx
│       │   ├── FileExplorer.tsx
│       │   ├── AssistantPanel.tsx
│       │   └── Toolbar.tsx
│       └── package.json
├── llm-gateway/           # Symlink or reference
├── prd-editor.json        # This PRD
└── progress.txt           # Learnings log
```

## LLM Gateway Usage

The llm-gateway package is at `~/repos/llm-gateway`. Use it for the AI assistant:

```typescript
import { createAgentHarness } from "llm-gateway/packages/ai/harness/agent";
import { createGeneratorHarness } from "llm-gateway/packages/ai/harness/providers/zen";

const agent = createAgentHarness({ harness: createGeneratorHarness() });

for await (const event of agent.invoke({
  model: "glm-4.7",
  messages: [{ role: "user", content: "..." }],
})) {
  if (event.type === "text") console.log(event.content);
}
```

## Monaco Setup

Use `@monaco-editor/react` with `vite-plugin-monaco-editor`:

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  defaultLanguage="hcl"
  theme="vs-dark"
  value={content}
  onChange={handleChange}
/>
```

## Stop Condition

If ALL stories have `passes: true`, reply with:
<promise>COMPLETE</promise>

Otherwise end normally (next iteration picks up).
