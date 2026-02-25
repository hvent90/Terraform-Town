import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from '../server';
import { readStateFile } from '../state-reader';
import { watchStateFile } from '../watcher';
import type { TerraformState } from '@terraform-town/visualization/src/types';

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
  const clientJs = await bundleClient();

  // Create server
  const app = createServer({
    getState: () => currentState,
    clientJs: clientJs.name,
  });

  // Start Bun server with WebSocket support
  Bun.serve({
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
        return new Response(Buffer.from(clientJs.content), {
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
  const opener =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  Bun.spawn([opener, `http://localhost:${port}`]);

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

async function bundleClient(): Promise<{
  name: string;
  content: Uint8Array;
}> {
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
