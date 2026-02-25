# tftown CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `tftown` CLI that serves a 3D visualization of any local terraform project with live streaming during operations.

**Architecture:** Hono server serves a bundled client (viz components + WebSocket client). `tftown start` reads state and watches for changes. `tftown stream` reads piped terraform output, parses it, and POSTs events to the server which broadcasts via WebSocket. Convenience wrappers shell out to terraform and pipe to stream.

**Tech Stack:** Bun, Hono, Commander.js, WebSocket, React (client bundle), @terraform-town/visualization

---

### Task 1: Scaffold `apps/cli` package

**Files:**
- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/cli/src/index.ts`
- Create: `apps/cli/CLAUDE.md`
- Modify: `package.json` (root — add `"apps/*"` to workspaces)

**Step 1: Create apps/cli directory and package.json**

```json
{
  "name": "@terraform-town/cli",
  "version": "0.0.1",
  "type": "module",
  "bin": {
    "tftown": "./src/index.ts"
  },
  "scripts": {
    "dev": "bun src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@terraform-town/visualization": "workspace:*",
    "commander": "^13.0.0",
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "bun-types": "^1.3.9",
    "typescript": "^5.5.3"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

**Step 3: Create minimal src/index.ts**

```typescript
#!/usr/bin/env bun
import { program } from 'commander';

program
  .name('tftown')
  .description('3D visualization for Terraform')
  .version('0.0.1');

program.parse();
```

**Step 4: Update root package.json workspaces**

Change `"workspaces": ["packages/*"]` to `"workspaces": ["packages/*", "apps/*"]`.

**Step 5: Create CLAUDE.md**

```markdown
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

\`\`\`bash
bun run dev          # Run CLI locally
bun test             # Run tests
\`\`\`

## Key patterns

- Apps own their bundles — client/index.tsx is bundled by Bun for the browser
- Output parser is regex-based, parses terraform -no-color stdout
- WebSocket for server→browser, HTTP POST for stream→server
- Default port 4444, override with --port
```

**Step 6: Install dependencies**

Run: `bun install`

**Step 7: Verify CLI runs**

Run: `bun apps/cli/src/index.ts --help`
Expected: Shows help text with "3D visualization for Terraform"

**Step 8: Commit**

```bash
git add apps/ package.json
git commit -m "feat(cli): scaffold tftown CLI package"
```

---

### Task 2: Event types and output parser

**Files:**
- Create: `apps/cli/src/events.ts`
- Create: `apps/cli/src/output-parser.ts`
- Create: `apps/cli/src/output-parser.test.ts`

**Step 1: Create event type definitions**

`apps/cli/src/events.ts`:

```typescript
export type ResourceAction =
  | 'creating'
  | 'created'
  | 'destroying'
  | 'destroyed'
  | 'modifying'
  | 'modified'
  | 'refreshing'
  | 'refreshed'
  | 'importing'
  | 'imported'
  | 'reading'
  | 'read'
  | 'error';

export interface LineEvent {
  type: 'line';
  text: string;
}

export interface ResourceEvent {
  type: 'resource';
  address: string;
  action: ResourceAction;
}

export interface PlanSummaryEvent {
  type: 'plan_summary';
  adds: number;
  changes: number;
  destroys: number;
}

export interface DoneEvent {
  type: 'done';
  exitCode: number;
}

export type StreamEvent = LineEvent | ResourceEvent | PlanSummaryEvent | DoneEvent;
```

**Step 2: Write failing tests for output parser**

`apps/cli/src/output-parser.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import { parseLine } from './output-parser';

describe('output-parser', () => {
  describe('resource lifecycle events', () => {
    test('creating', () => {
      const events = parseLine('aws_vpc.main: Creating...');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'creating',
      });
    });

    test('creation complete', () => {
      const events = parseLine('aws_vpc.main: Creation complete after 2s [id=vpc-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'created',
      });
    });

    test('destroying', () => {
      const events = parseLine('aws_instance.web: Destroying... [id=i-abc123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'destroying',
      });
    });

    test('destruction complete', () => {
      const events = parseLine('aws_instance.web: Destruction complete after 1s');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'destroyed',
      });
    });

    test('modifying', () => {
      const events = parseLine('aws_security_group.sg: Modifying... [id=sg-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_security_group.sg',
        action: 'modifying',
      });
    });

    test('modifications complete', () => {
      const events = parseLine('aws_security_group.sg: Modifications complete after 3s [id=sg-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_security_group.sg',
        action: 'modified',
      });
    });

    test('refreshing state', () => {
      const events = parseLine('aws_vpc.main: Refreshing state... [id=vpc-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'refreshing',
      });
    });

    test('import prepared', () => {
      const events = parseLine('aws_s3_bucket.data: Import prepared!');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_s3_bucket.data',
        action: 'imported',
      });
    });

    test('reading', () => {
      const events = parseLine('data.aws_ami.latest: Reading...');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'data.aws_ami.latest',
        action: 'reading',
      });
    });

    test('read complete', () => {
      const events = parseLine('data.aws_ami.latest: Read complete after 1s [id=ami-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'data.aws_ami.latest',
        action: 'read',
      });
    });
  });

  describe('plan summary', () => {
    test('parses plan summary line', () => {
      const events = parseLine('Plan: 3 to add, 1 to change, 2 to destroy.');
      expect(events).toContainEqual({
        type: 'plan_summary',
        adds: 3,
        changes: 1,
        destroys: 2,
      });
    });

    test('parses apply summary', () => {
      const events = parseLine('Apply complete! Resources: 3 added, 1 changed, 2 destroyed.');
      expect(events).toContainEqual({
        type: 'plan_summary',
        adds: 3,
        changes: 1,
        destroys: 2,
      });
    });
  });

  describe('every line emits a line event', () => {
    test('plain text', () => {
      const events = parseLine('Terraform will perform the following actions:');
      expect(events).toContainEqual({
        type: 'line',
        text: 'Terraform will perform the following actions:',
      });
    });

    test('resource line also emits line event', () => {
      const events = parseLine('aws_vpc.main: Creating...');
      expect(events).toContainEqual({ type: 'line', text: 'aws_vpc.main: Creating...' });
      expect(events).toContainEqual({ type: 'resource', address: 'aws_vpc.main', action: 'creating' });
      expect(events).toHaveLength(2);
    });
  });

  describe('error lines', () => {
    test('error with resource address', () => {
      const events = parseLine('Error: creating EC2 Instance (aws_instance.web): something failed');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'error',
      });
    });
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `bun test apps/cli/src/output-parser.test.ts`
Expected: FAIL — `parseLine` not found

**Step 4: Implement the output parser**

`apps/cli/src/output-parser.ts`:

```typescript
import type { StreamEvent, ResourceAction } from './events';

const LIFECYCLE_PATTERNS: Array<{ pattern: RegExp; action: ResourceAction }> = [
  { pattern: /^(.+?):\s+Creating\.\.\./,           action: 'creating' },
  { pattern: /^(.+?):\s+Creation complete/,         action: 'created' },
  { pattern: /^(.+?):\s+Destroying\.\.\./,          action: 'destroying' },
  { pattern: /^(.+?):\s+Destruction complete/,       action: 'destroyed' },
  { pattern: /^(.+?):\s+Modifying\.\.\./,           action: 'modifying' },
  { pattern: /^(.+?):\s+Modifications complete/,    action: 'modified' },
  { pattern: /^(.+?):\s+Refreshing state\.\.\./,    action: 'refreshing' },
  { pattern: /^(.+?):\s+Refresh complete/,           action: 'refreshed' },
  { pattern: /^(.+?):\s+Import prepared!/,           action: 'imported' },
  { pattern: /^(.+?):\s+Importing\.\.\./,           action: 'importing' },
  { pattern: /^(.+?):\s+Reading\.\.\./,             action: 'reading' },
  { pattern: /^(.+?):\s+Read complete/,              action: 'read' },
];

const PLAN_SUMMARY = /^Plan:\s+(\d+)\s+to add,\s+(\d+)\s+to change,\s+(\d+)\s+to destroy/;
const APPLY_SUMMARY = /^Apply complete!\s+Resources:\s+(\d+)\s+added,\s+(\d+)\s+changed,\s+(\d+)\s+destroyed/;
const ERROR_WITH_ADDRESS = /\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*)\)/;

export function parseLine(line: string): StreamEvent[] {
  const events: StreamEvent[] = [{ type: 'line', text: line }];

  for (const { pattern, action } of LIFECYCLE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      events.push({ type: 'resource', address: match[1], action });
      return events;
    }
  }

  const planMatch = line.match(PLAN_SUMMARY);
  if (planMatch) {
    events.push({
      type: 'plan_summary',
      adds: parseInt(planMatch[1]),
      changes: parseInt(planMatch[2]),
      destroys: parseInt(planMatch[3]),
    });
    return events;
  }

  const applyMatch = line.match(APPLY_SUMMARY);
  if (applyMatch) {
    events.push({
      type: 'plan_summary',
      adds: parseInt(applyMatch[1]),
      changes: parseInt(applyMatch[2]),
      destroys: parseInt(applyMatch[3]),
    });
    return events;
  }

  if (line.startsWith('Error:')) {
    const addrMatch = line.match(ERROR_WITH_ADDRESS);
    if (addrMatch) {
      events.push({ type: 'resource', address: addrMatch[1], action: 'error' });
    }
  }

  return events;
}
```

**Step 5: Run tests to verify they pass**

Run: `bun test apps/cli/src/output-parser.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add apps/cli/src/events.ts apps/cli/src/output-parser.ts apps/cli/src/output-parser.test.ts
git commit -m "feat(cli): terraform output parser with event types"
```

---

### Task 3: State reader and file watcher

**Files:**
- Create: `apps/cli/src/state-reader.ts`
- Create: `apps/cli/src/state-reader.test.ts`
- Create: `apps/cli/src/watcher.ts`

**Step 1: Write failing test for state reader**

`apps/cli/src/state-reader.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import { readStateFile } from './state-reader';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('state-reader', () => {
  test('reads and parses a terraform state file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tftown-'));
    const statePath = join(dir, 'terraform.tfstate');
    writeFileSync(statePath, JSON.stringify({
      version: 4,
      resources: [{
        mode: 'managed',
        type: 'aws_vpc',
        name: 'main',
        provider: 'provider["registry.terraform.io/hashicorp/aws"]',
        instances: [{
          attributes: {
            id: 'vpc-123',
            cidr_block: '10.0.0.0/16',
          },
        }],
      }],
    }));

    const state = readStateFile(statePath);
    expect(state.resources).toHaveLength(1);
    expect(state.resources[0].id).toBe('aws_vpc.main');
    expect(state.resources[0].type).toBe('vpc');
    expect(state.resources[0].state).toBe('applied');

    rmSync(dir, { recursive: true });
  });

  test('returns empty state for missing file', () => {
    const state = readStateFile('/nonexistent/terraform.tfstate');
    expect(state.resources).toHaveLength(0);
    expect(state.connections).toHaveLength(0);
  });

  test('returns empty state for empty state file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tftown-'));
    const statePath = join(dir, 'terraform.tfstate');
    writeFileSync(statePath, JSON.stringify({ version: 4, resources: [] }));

    const state = readStateFile(statePath);
    expect(state.resources).toHaveLength(0);

    rmSync(dir, { recursive: true });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test apps/cli/src/state-reader.test.ts`
Expected: FAIL — `readStateFile` not found

**Step 3: Implement state reader**

`apps/cli/src/state-reader.ts`:

```typescript
import { existsSync, readFileSync } from 'fs';
import { StateSync, type TerraformState } from '@terraform-town/visualization';

const EMPTY_STATE: TerraformState = { resources: [], connections: [] };

export function readStateFile(path: string): TerraformState {
  if (!existsSync(path)) {
    return EMPTY_STATE;
  }

  const raw = readFileSync(path, 'utf-8');
  const json = JSON.parse(raw);

  if (!json.resources || json.resources.length === 0) {
    return EMPTY_STATE;
  }

  const sync = new StateSync();
  return sync.parseState(json);
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test apps/cli/src/state-reader.test.ts`
Expected: All tests PASS

**Step 5: Implement file watcher**

`apps/cli/src/watcher.ts`:

```typescript
import { watch, type FSWatcher } from 'fs';
import { readStateFile } from './state-reader';
import type { TerraformState } from '@terraform-town/visualization';

export function watchStateFile(
  path: string,
  onChange: (state: TerraformState) => void,
): FSWatcher {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const watcher = watch(path, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const state = readStateFile(path);
      onChange(state);
    }, 100);
  });

  return watcher;
}
```

**Step 6: Commit**

```bash
git add apps/cli/src/state-reader.ts apps/cli/src/state-reader.test.ts apps/cli/src/watcher.ts
git commit -m "feat(cli): state file reader and watcher"
```

---

### Task 4: Hono server with WebSocket

**Files:**
- Create: `apps/cli/src/server.ts`
- Create: `apps/cli/src/server.test.ts`

**Step 1: Write failing test for server**

`apps/cli/src/server.test.ts`:

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer } from './server';
import type { TerraformState } from '@terraform-town/visualization';

describe('server', () => {
  const emptyState: TerraformState = { resources: [], connections: [] };
  let server: ReturnType<typeof Bun.serve>;
  let port: number;

  beforeAll(() => {
    const app = createServer({ getState: () => emptyState });
    server = Bun.serve({ port: 0, fetch: app.fetch });
    port = server.port;
  });

  afterAll(() => {
    server.stop();
  });

  test('serves HTML at root', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('<div id="root"');
  });

  test('accepts POST /events', async () => {
    const res = await fetch(`http://localhost:${port}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'line', text: 'hello' }),
    });
    expect(res.status).toBe(200);
  });

  test('serves client bundle JS', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    const html = await res.text();
    const scriptMatch = html.match(/src="\.\/([^"]+\.js)"/);
    expect(scriptMatch).toBeTruthy();

    const jsRes = await fetch(`http://localhost:${port}/${scriptMatch![1]}`);
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers.get('content-type')).toContain('javascript');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test apps/cli/src/server.test.ts`
Expected: FAIL — `createServer` not found

**Step 3: Implement server**

`apps/cli/src/server.ts`:

```typescript
import { Hono } from 'hono';
import type { TerraformState } from '@terraform-town/visualization';
import type { StreamEvent } from './events';

export interface ServerOptions {
  getState: () => TerraformState;
  clientHtml?: string;
  clientJs?: string;
}

export function createServer(options: ServerOptions) {
  const app = new Hono();
  const wsClients = new Set<WebSocket>();

  // Serve HTML shell
  app.get('/', (c) => {
    if (options.clientHtml) {
      return c.html(options.clientHtml);
    }
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>tftown</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
</style>
</head>
<body>
<div id="root" style="width: 100vw; height: 100vh;"></div>
${options.clientJs ? `<script type="module" src="./${options.clientJs}"></script>` : ''}
</body>
</html>`);
  });

  // Receive events from tftown stream
  app.post('/events', async (c) => {
    const event = await c.req.json<StreamEvent>();
    broadcast(event);

    // On done, re-read state and send fresh snapshot
    if (event.type === 'done') {
      const state = options.getState();
      broadcast({ type: 'state', data: state });
    }

    return c.json({ ok: true });
  });

  // Get current state (for client initial load)
  app.get('/state', (c) => {
    return c.json(options.getState());
  });

  function broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  function addClient(ws: WebSocket) {
    wsClients.add(ws);
    ws.addEventListener('close', () => wsClients.delete(ws));
  }

  return Object.assign(app, { broadcast, addClient, wsClients });
}
```

Note: WebSocket upgrade handling depends on the Bun server layer, not Hono middleware. The `addClient` method is called from the `start` command when setting up `Bun.serve` with the `websocket` option. This will be wired in Task 6.

**Step 4: Run tests to verify they pass**

Run: `bun test apps/cli/src/server.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/cli/src/server.ts apps/cli/src/server.test.ts
git commit -m "feat(cli): Hono server with event posting and state endpoint"
```

---

### Task 5: Client bundle (browser entry)

**Files:**
- Create: `apps/cli/src/client/index.tsx`

This is the browser-side code that gets bundled and served to the user's browser.

**Step 1: Implement client entry**

`apps/cli/src/client/index.tsx`:

```tsx
import { Visualization } from '@terraform-town/visualization';
import type { TerraformState, Resource } from '@terraform-town/visualization';

const root = document.getElementById('root')!;
const vis = new Visualization(root);

// Fetch initial state
const stateRes = await fetch('/state');
let currentState: TerraformState = await stateRes.json();
vis.update(currentState);

// Connect WebSocket
const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}//${location.host}/ws`);

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'state':
      currentState = msg.data;
      vis.update(currentState);
      break;

    case 'resource': {
      const { address, action } = msg;
      const resourceState = actionToResourceState(action);
      if (resourceState) {
        currentState = updateResourceState(currentState, address, resourceState);
        vis.update(currentState);
      }
      break;
    }

    case 'done':
      // Server will send a fresh state snapshot after done
      break;
  }
});

ws.addEventListener('close', () => {
  console.log('[tftown] WebSocket closed, server may have stopped');
});

function actionToResourceState(action: string): Resource['state'] | null {
  switch (action) {
    case 'creating':
    case 'modifying':
    case 'refreshing':
    case 'importing':
    case 'reading':
      return 'planned';
    case 'created':
    case 'modified':
    case 'refreshed':
    case 'imported':
    case 'read':
      return 'applied';
    case 'destroying':
      return 'modified';
    case 'destroyed':
      return 'destroyed';
    case 'error':
      return 'error';
    default:
      return null;
  }
}

function updateResourceState(
  state: TerraformState,
  address: string,
  newState: Resource['state'],
): TerraformState {
  return {
    ...state,
    resources: state.resources.map((r) =>
      r.id === address ? { ...r, state: newState } : r,
    ),
  };
}
```

**Step 2: No unit test for this file** — it's browser-only, integration tested via the full CLI flow. The output parser (where the logic lives) is already tested.

**Step 3: Commit**

```bash
git add apps/cli/src/client/index.tsx
git commit -m "feat(cli): browser client with viz mount and WebSocket"
```

---

### Task 6: `tftown start` command

**Files:**
- Create: `apps/cli/src/commands/start.ts`
- Modify: `apps/cli/src/index.ts`

**Step 1: Implement start command**

`apps/cli/src/commands/start.ts`:

```typescript
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from '../server';
import { readStateFile } from '../state-reader';
import { watchStateFile } from '../watcher';
import type { TerraformState } from '@terraform-town/visualization';

const DEFAULT_PORT = 4444;

export async function startCommand(options: { port?: string; state?: string }) {
  const port = options.port ? parseInt(options.port) : DEFAULT_PORT;

  // Find state file
  const statePath = options.state
    ? resolve(options.state)
    : findStateFile(process.cwd());

  let currentState: TerraformState;
  if (statePath) {
    console.log(`Reading state from ${statePath}`);
    currentState = readStateFile(statePath);
    console.log(`Found ${currentState.resources.length} resources`);
  } else {
    console.log('No .tfstate file found — starting with empty state');
    currentState = { resources: [], connections: [] };
  }

  // Bundle client
  console.log('Bundling visualization...');
  const { clientJs } = await bundleClient();

  // Create server
  const app = createServer({
    getState: () => currentState,
    clientJs: clientJs.name,
  });

  // Start Bun server with WebSocket support
  const server = Bun.serve({
    port,
    fetch(req, server) {
      // Upgrade WebSocket requests
      const url = new URL(req.url);
      if (url.pathname === '/ws') {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined;
        return new Response('WebSocket upgrade failed', { status: 400 });
      }

      // Serve bundled JS
      if (url.pathname === `/${clientJs.name}`) {
        return new Response(clientJs.content, {
          headers: { 'content-type': 'application/javascript' },
        });
      }

      return app.fetch(req);
    },
    websocket: {
      open(ws) {
        app.addClient(ws as unknown as WebSocket);
        // Send initial state
        ws.send(JSON.stringify({ type: 'state', data: currentState }));
      },
      message() {},
      close() {},
    },
  });

  console.log(`\n  tftown running at http://localhost:${port}\n`);

  // Watch state file for changes
  if (statePath && existsSync(statePath)) {
    watchStateFile(statePath, (newState) => {
      currentState = newState;
      app.broadcast({ type: 'state', data: currentState });
      console.log(`State updated: ${currentState.resources.length} resources`);
    });
    console.log(`  Watching ${statePath} for changes`);
  }

  console.log(`  Pipe terraform output: terraform apply 2>&1 | tftown stream`);
  console.log(`  Or use: tftown apply\n`);

  // Open browser
  const opener = process.platform === 'darwin' ? 'open' :
                 process.platform === 'win32' ? 'start' : 'xdg-open';
  Bun.spawn([opener, `http://localhost:${port}`]);

  return server;
}

function findStateFile(dir: string): string | null {
  const candidates = [
    join(dir, 'terraform.tfstate'),
    join(dir, '.terraform', 'terraform.tfstate'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function bundleClient(): Promise<{ name: string; content: Uint8Array }> {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, '..', 'client', 'index.tsx')],
    minify: true,
    naming: 'client.[hash].js',
  });

  if (!result.success) {
    console.error('Client bundle failed:', result.logs);
    process.exit(1);
  }

  const output = result.outputs[0];
  const content = await output.arrayBuffer();
  const name = output.path.split('/').pop()!;

  return { name, content: new Uint8Array(content) };
}
```

**Step 2: Wire start command into CLI entry**

`apps/cli/src/index.ts`:

```typescript
#!/usr/bin/env bun
import { program } from 'commander';
import { startCommand } from './commands/start';

program
  .name('tftown')
  .description('3D visualization for Terraform')
  .version('0.0.1');

program
  .command('start')
  .description('Start the visualization server')
  .option('-p, --port <port>', 'Server port', '4444')
  .option('-s, --state <path>', 'Path to terraform.tfstate')
  .action(startCommand);

program.parse();
```

**Step 3: Manual smoke test**

Run: `bun apps/cli/src/index.ts start --help`
Expected: Shows start command options (--port, --state)

Run (from a directory with a .tfstate): `bun apps/cli/src/index.ts start`
Expected: Server starts, browser opens, viz renders

**Step 4: Commit**

```bash
git add apps/cli/src/commands/start.ts apps/cli/src/index.ts
git commit -m "feat(cli): tftown start command with viz server and state watching"
```

---

### Task 7: `tftown stream` command

**Files:**
- Create: `apps/cli/src/commands/stream.ts`
- Modify: `apps/cli/src/index.ts`

**Step 1: Implement stream command**

`apps/cli/src/commands/stream.ts`:

```typescript
import { parseLine } from '../output-parser';

const DEFAULT_PORT = 4444;

export async function streamCommand(options: { port?: string }) {
  const port = options.port ? parseInt(options.port) : DEFAULT_PORT;
  const baseUrl = `http://localhost:${port}`;

  const decoder = new TextDecoder();
  const stdin = Bun.stdin.stream();
  const reader = stdin.getReader();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!; // keep incomplete last line in buffer

      for (const line of lines) {
        if (line.length === 0) continue;

        // Echo to stdout so the user still sees terraform output
        process.stdout.write(line + '\n');

        const events = parseLine(line);
        for (const event of events) {
          if (event.type === 'line') continue; // don't send raw lines to reduce noise
          await postEvent(baseUrl, event);
        }

        // Always send line event too
        await postEvent(baseUrl, { type: 'line', text: line });
      }
    }

    // Flush remaining buffer
    if (buffer.length > 0) {
      process.stdout.write(buffer + '\n');
      const events = parseLine(buffer);
      for (const event of events) {
        await postEvent(baseUrl, event);
      }
    }
  } finally {
    // Send done event
    await postEvent(baseUrl, { type: 'done', exitCode: 0 });
  }
}

async function postEvent(baseUrl: string, event: any) {
  try {
    await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    // Server might not be running — silently ignore
  }
}
```

**Step 2: Wire stream command and convenience wrappers into CLI entry**

Update `apps/cli/src/index.ts`:

```typescript
#!/usr/bin/env bun
import { program } from 'commander';
import { startCommand } from './commands/start';
import { streamCommand } from './commands/stream';

program
  .name('tftown')
  .description('3D visualization for Terraform')
  .version('0.0.1');

program
  .command('start')
  .description('Start the visualization server')
  .option('-p, --port <port>', 'Server port', '4444')
  .option('-s, --state <path>', 'Path to terraform.tfstate')
  .action(startCommand);

program
  .command('stream')
  .description('Read piped terraform output and push events to the viz server')
  .option('-p, --port <port>', 'Server port', '4444')
  .action(streamCommand);

// Convenience wrappers — shell out to terraform and pipe to stream
for (const cmd of ['plan', 'apply', 'destroy', 'refresh', 'import'] as const) {
  program
    .command(`${cmd} [args...]`)
    .description(`Run terraform ${cmd} with live visualization`)
    .option('-p, --port <port>', 'Server port', '4444')
    .allowUnknownOption()
    .action(async (args: string[], options: { port?: string }) => {
      const port = options.port ?? '4444';
      const tfArgs = args.join(' ');
      const shellCmd = `terraform ${cmd} ${tfArgs} 2>&1 | bun ${import.meta.dir}/index.ts stream --port ${port}`;
      const proc = Bun.spawn(['sh', '-c', shellCmd], {
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
      });
      const exitCode = await proc.exited;
      process.exit(exitCode);
    });
}

program.parse();
```

**Step 3: Manual smoke test**

Run: `echo "aws_vpc.main: Creating..." | bun apps/cli/src/index.ts stream`
Expected: Echoes the line to stdout, attempts to POST to localhost:4444 (may fail silently if no server)

**Step 4: Commit**

```bash
git add apps/cli/src/commands/stream.ts apps/cli/src/index.ts
git commit -m "feat(cli): tftown stream command and convenience wrappers"
```

---

### Task 8: End-to-end integration test

**Files:**
- Create: `apps/cli/src/integration.test.ts`

This test verifies the full flow: start server → connect WebSocket → POST events → browser receives updates.

**Step 1: Write integration test**

`apps/cli/src/integration.test.ts`:

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer } from './server';
import type { TerraformState } from '@terraform-town/visualization';

describe('CLI integration', () => {
  const state: TerraformState = {
    resources: [{
      id: 'aws_vpc.main',
      type: 'vpc',
      name: 'main',
      attributes: { cidr_block: '10.0.0.0/16' },
      state: 'applied',
    }],
    connections: [],
  };

  let server: ReturnType<typeof Bun.serve>;
  let port: number;
  let app: ReturnType<typeof createServer>;

  beforeAll(() => {
    app = createServer({ getState: () => state });
    server = Bun.serve({
      port: 0,
      fetch(req, server) {
        const url = new URL(req.url);
        if (url.pathname === '/ws') {
          const upgraded = server.upgrade(req);
          if (upgraded) return undefined;
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        return app.fetch(req);
      },
      websocket: {
        open(ws) {
          app.addClient(ws as unknown as WebSocket);
        },
        message() {},
        close() {},
      },
    });
    port = server.port;
  });

  afterAll(() => {
    server.stop();
  });

  test('GET /state returns current state', async () => {
    const res = await fetch(`http://localhost:${port}/state`);
    const body = await res.json();
    expect(body.resources).toHaveLength(1);
    expect(body.resources[0].id).toBe('aws_vpc.main');
  });

  test('POST /events broadcasts to WebSocket clients', async () => {
    const messages: any[] = [];

    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    await new Promise<void>((resolve) => {
      ws.addEventListener('open', () => resolve());
    });

    ws.addEventListener('message', (e) => {
      messages.push(JSON.parse(e.data));
    });

    // Small delay to ensure WS is fully registered
    await new Promise((r) => setTimeout(r, 50));

    await fetch(`http://localhost:${port}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'resource', address: 'aws_vpc.main', action: 'creating' }),
    });

    // Wait for message delivery
    await new Promise((r) => setTimeout(r, 100));

    ws.close();

    expect(messages.some((m) => m.type === 'resource' && m.address === 'aws_vpc.main')).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `bun test apps/cli/src/integration.test.ts`
Expected: All tests PASS

**Step 3: Run full test suite**

Run: `bun test apps/cli/`
Expected: All tests PASS (output-parser, state-reader, server, integration)

**Step 4: Commit**

```bash
git add apps/cli/src/integration.test.ts
git commit -m "test(cli): end-to-end integration test for server and WebSocket"
```

---

### Task 9: Final polish and manual verification

**Files:**
- Potentially modify any files from previous tasks

**Step 1: Run full test suite from root**

Run: `bun test`
Expected: All tests across the monorepo pass

**Step 2: Run format**

Run: `bun run format`

**Step 3: Manual end-to-end test**

Navigate to a directory with a `terraform.tfstate` file and run:
```bash
bun apps/cli/src/index.ts start
```

Verify:
- Browser opens with 3D visualization
- Resources from state file are rendered
- Terminal shows the pipe command

In another terminal, run:
```bash
echo -e "aws_vpc.main: Creating...\naws_vpc.main: Creation complete after 2s [id=vpc-123]" | bun apps/cli/src/index.ts stream
```

Verify:
- Browser viz updates (resource state transitions)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(cli): polish and formatting"
```
