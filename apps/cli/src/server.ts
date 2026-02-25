import { Hono } from 'hono';
import type { TerraformState } from '@terraform-town/visualization/src/types';
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

  // Get current state
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
