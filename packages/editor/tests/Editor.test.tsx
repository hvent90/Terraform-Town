import { describe, it, expect } from 'vitest';

describe('ED-001: Monaco editor installed and configured', () => {
  it('@monaco-editor/react is installed', async () => {
    const mod = await import('@monaco-editor/react');
    expect(mod.default).toBeDefined();
  });

  it('Editor component exists and is a function', async () => {
    const { Editor } = await import('../src/Editor');
    expect(typeof Editor).toBe('function');
  });

  it('Vite config includes React plugin', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.resolve(process.cwd(), 'vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('@vitejs/plugin-react');
  });

  it('Editor renders without throwing', async () => {
    const React = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { Editor } = await import('../src/Editor');
    // Monaco renders a loading state in SSR/jsdom — should not throw
    const html = renderToString(React.createElement(Editor));
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });
});
