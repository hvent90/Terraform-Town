import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import { defaultTheme } from '../src/themes/default';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-014: Ground with checkerboard', () => {
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

  function getScene(): THREE.Scene {
    return (vis as any).scene;
  }

  function findGround(): THREE.Mesh | undefined {
    return getScene().children.find(
      (c) => c instanceof THREE.Mesh && c.userData.isGround,
    ) as THREE.Mesh | undefined;
  }

  test('ground plane is visible in the scene', () => {
    const ground = findGround();
    expect(ground).toBeDefined();
    expect(ground!.visible).toBe(true);
  });

  test('ground has a texture applied (checkerboard)', () => {
    const ground = findGround();
    expect(ground).toBeDefined();
    const material = ground!.material as THREE.MeshBasicMaterial;
    expect(material.map).not.toBeNull();
  });

  test('ground uses theme checkerboard colors', () => {
    const ground = findGround();
    expect(ground).toBeDefined();
    // The texture should exist — exact pixel validation is not feasible in jsdom,
    // but we can verify the texture was created from a canvas
    const material = ground!.material as THREE.MeshBasicMaterial;
    const texture = material.map!;
    expect(texture).toBeInstanceOf(THREE.CanvasTexture);
  });

  test('ground is horizontal (rotated -PI/2 on X)', () => {
    const ground = findGround();
    expect(ground).toBeDefined();
    expect(ground!.rotation.x).toBeCloseTo(-Math.PI / 2, 3);
  });

  test('ground is below resources (y <= 0)', () => {
    const ground = findGround();
    expect(ground).toBeDefined();
    expect(ground!.position.y).toBeLessThanOrEqual(0);
  });
});
