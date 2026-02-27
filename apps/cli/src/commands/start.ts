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
  const clientBundle = await bundleClient();

  // Create server
  const app = createServer({
    getState: () => currentState,
    clientJs: clientBundle.entrypoint,
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

      // Serve bundled assets (JS, fonts, etc.)
      const assetName = url.pathname.slice(1); // strip leading /
      const asset = clientBundle.assets.get(assetName);
      if (asset) {
        return new Response(Buffer.from(asset.content), {
          headers: { 'content-type': asset.contentType },
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
      close(ws) {
        app.removeClient(ws as unknown as WebSocket);
      },
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

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
};

async function bundleClient(): Promise<{
  entrypoint: string;
  assets: Map<string, { content: Uint8Array; contentType: string }>;
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

  const assets = new Map<string, { content: Uint8Array; contentType: string }>();
  let entrypoint = '';

  for (const output of result.outputs) {
    const content = await output.arrayBuffer();
    const name = output.path.split('/').pop()!;
    const ext = name.slice(name.lastIndexOf('.'));
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
    assets.set(name, { content: new Uint8Array(content), contentType });

    if (output.kind === 'entry-point') {
      entrypoint = name;
    }
  }

  return { entrypoint, assets };
}
