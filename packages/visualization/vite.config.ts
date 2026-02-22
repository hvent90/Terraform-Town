import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  server: {
    allowedHosts: true,
    hmr: {
      host: '100.76.210.42',
    },
  },
});
