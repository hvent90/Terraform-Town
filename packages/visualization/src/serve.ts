import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = join(import.meta.dir, '..', 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = join(DIST, path);

    if (!existsSync(file)) {
      // SPA fallback
      const index = join(DIST, 'index.html');
      return new Response(readFileSync(index), {
        headers: { 'content-type': 'text/html' },
      });
    }

    const ext = extname(file);
    return new Response(Bun.file(file), {
      headers: { 'content-type': MIME[ext] ?? 'application/octet-stream' },
    });
  },
});

console.log('Static server running at http://localhost:3000');
