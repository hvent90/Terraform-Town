import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Visualization } from '../src/Visualization';

// Requires jsdom (vitest) — skip under bun test runner
const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('Visualization', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    // Give container dimensions so camera aspect ratio works
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('constructor succeeds with a container element', () => {
    const vis = new Visualization(container);
    expect(vis).toBeDefined();
    vis.dispose();
  });

  test('renderer canvas is attached to the container', () => {
    const vis = new Visualization(container);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    vis.dispose();
  });

  test('canvas is visible in container', () => {
    const vis = new Visualization(container);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    // Canvas should have dimensions matching container
    expect(canvas!.width).toBeGreaterThan(0);
    expect(canvas!.height).toBeGreaterThan(0);
    vis.dispose();
  });
});
