import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createServer } from './server';
import type { TerraformState } from '@terraform-town/visualization/src/types';

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

  test('GET /state returns current state', async () => {
    const res = await fetch(`http://localhost:${port}/state`);
    const body = await res.json();
    expect(body.resources).toHaveLength(0);
    expect(body.connections).toHaveLength(0);
  });
});
