import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Find the llm-gateway logger.ts in node_modules to alias it (uses Bun-only import.meta.dir)
function findLlmGatewayLoggerPath(): string {
  const bunDir = resolve(__dirname, '../../node_modules/.bun');
  try {
    const entry = readdirSync(bunDir).find((d) => d.startsWith('llm-gateway@'));
    if (entry) {
      return resolve(bunDir, entry, 'node_modules/llm-gateway/packages/ai/logger.ts');
    }
  } catch {}
  return '';
}

const loggerPath = findLlmGatewayLoggerPath();

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: [
      ...(loggerPath ? [{ find: loggerPath, replacement: resolve(__dirname, 'tests/stubs/logger.ts') }] : []),
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
