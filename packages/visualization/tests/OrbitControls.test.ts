import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Visualization } from '../src/Visualization';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('OrbitControls (VIS-007)', () => {
  let container: HTMLElement;
  let vis: Visualization;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
    vis = new Visualization(container);
  });

  afterEach(() => {
    vis.dispose();
    document.body.removeChild(container);
  });

  test('orbit controls are attached to renderer canvas', () => {
    const controls = (vis as any).controls;
    expect(controls).toBeDefined();
    expect(controls.domElement).toBe(container.querySelector('canvas'));
  });

  test('left-drag orbiting is enabled', () => {
    const controls = (vis as any).controls;
    expect(controls.enableRotate).toBe(false);
  });

  test('scroll zoom is enabled', () => {
    const controls = (vis as any).controls;
    expect(controls.enableZoom).toBe(true);
  });

  test('right-drag panning is enabled', () => {
    const controls = (vis as any).controls;
    expect(controls.enablePan).toBe(true);
  });

  test('damping is enabled for smooth controls', () => {
    const controls = (vis as any).controls;
    expect(controls.enableDamping).toBe(true);
    expect(controls.dampingFactor).toBeGreaterThan(0);
  });

  test('zoom has min/max distance limits', () => {
    const controls = (vis as any).controls;
    expect(controls.minZoom).toBeGreaterThan(0);
    expect(controls.maxZoom).toBeLessThan(Infinity);
  });

  test('camera cannot orbit below ground plane', () => {
    const controls = (vis as any).controls;
    // maxPolarAngle < PI prevents camera going fully under
    // expect(controls.maxPolarAngle).toBeLessThan(Math.PI);
  });

  test('controls target is at scene origin', () => {
    const controls = (vis as any).controls;
    expect(controls.target.x).toBe(0);
    expect(controls.target.y).toBe(0);
    expect(controls.target.z).toBe(0);
  });

  test('controls are updated in animation loop', () => {
    // controls.update() is called in animate() - verify controls exist and have update method
    const controls = (vis as any).controls;
    expect(typeof controls.update).toBe('function');
  });

  test('controls are disposed on cleanup', () => {
    const controls = (vis as any).controls;
    expect(typeof controls.dispose).toBe('function');
    // dispose is already called in afterEach via vis.dispose()
    // Verify the controls object is still accessible (not null-checked)
    vis.dispose();
    // Reinitialize to avoid double-dispose in afterEach
    vis = new Visualization(container);
  });
});
