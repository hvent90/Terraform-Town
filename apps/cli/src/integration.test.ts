import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer } from './server';
import type { TerraformState } from '@terraform-town/visualization/src/types';

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
        close(ws) {
          app.removeClient(ws as unknown as WebSocket);
        },
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
      messages.push(JSON.parse(e.data as string));
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
