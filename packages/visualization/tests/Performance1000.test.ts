import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import type { TerraformState, Resource, Connection, ResourceType } from '../src/types';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-019: Performance - 1000 resources at 30fps', () => {
  let container: HTMLElement;
  let vis: Visualization;

  const resourceTypes: ResourceType[] = ['vpc', 'subnet', 'security_group', 'instance', 's3_bucket', 'iam_role', 'lambda_function'];

  function generateState(count: number): TerraformState {
    const resources: Resource[] = [];
    const connections: Connection[] = [];

    for (let i = 0; i < count; i++) {
      const type = resourceTypes[i % resourceTypes.length];
      resources.push({
        id: `res-${i}`,
        type,
        name: `resource-${i}`,
        attributes: { index: i },
        state: 'applied',
        parentId: i > 0 ? `res-${Math.max(0, i - 1 - (i % 10))}` : undefined,
      });

      if (i > 0 && i % 3 === 0) {
        connections.push({
          from: `res-${i}`,
          to: `res-${Math.max(0, i - 1)}`,
          type: 'reference',
        });
      }
    }

    return { resources, connections };
  }

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

  test('1000 resources render without errors', () => {
    const state = generateState(1000);
    vis.update(state);

    const meshes = getScene().children.filter(
      (c) => c instanceof THREE.Mesh && c.userData.id,
    );
    expect(meshes.length).toBe(1000);
  });

  test('single frame update for 1000 resources takes < 33ms (30fps budget)', () => {
    const state = generateState(1000);
    vis.update(state);

    const animator = (vis as any).animator;
    // Warm up
    animator.update(16);

    // Measure a single frame update
    const start = performance.now();
    animator.update(16);
    const frameTime = performance.now() - start;

    // 30fps = 33ms budget per frame
    expect(frameTime).toBeLessThan(33);
  });

  test('instancing is available via ResourceFactory geometry sharing', () => {
    const state = generateState(1000);
    vis.update(state);

    // All meshes of the same type should share geometries
    const meshes = getScene().children.filter(
      (c) => c instanceof THREE.Mesh && c.userData.id,
    ) as THREE.Mesh[];

    // Collect geometries by resource type
    const geometriesByType = new Map<string, Set<THREE.BufferGeometry>>();
    for (const mesh of meshes) {
      const type = mesh.userData.type;
      if (!geometriesByType.has(type)) {
        geometriesByType.set(type, new Set());
      }
      geometriesByType.get(type)!.add(mesh.geometry);
    }

    // Each type should reuse geometry (not create 1000 unique ones)
    // With geometry sharing, each type has exactly 1 geometry
    for (const [type, geometries] of geometriesByType) {
      expect(geometries.size).toBe(1);
    }
  });

  test('1000 resources with animations complete within reasonable time', () => {
    const state = generateState(1000);

    const start = performance.now();
    vis.update(state);

    // Run some animation frames
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }
    const elapsed = performance.now() - start;

    // Should complete within 5 seconds even in jsdom
    expect(elapsed).toBeLessThan(5000);
  });
});
