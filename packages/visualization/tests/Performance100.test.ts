import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import type { TerraformState, Resource, Connection, ResourceType } from '../src/types';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-018: Performance - 100 resources at 60fps', () => {
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
        parentId: i > 0 ? `res-${Math.floor(Math.random() * i)}` : undefined,
      });

      if (i > 0) {
        connections.push({
          from: `res-${i}`,
          to: `res-${Math.floor(Math.random() * i)}`,
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

  test('100 resources render without errors', () => {
    const state = generateState(100);
    vis.update(state);

    const meshes = getScene().children.filter(
      (c) => c instanceof THREE.Mesh && c.userData.id,
    );
    expect(meshes.length).toBe(100);
  });

  test('100 resources + animations complete within reasonable time', () => {
    const state = generateState(100);

    const start = performance.now();
    vis.update(state);

    // Complete all create animations
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }
    const elapsed = performance.now() - start;

    // Should complete within 1 second (very generous for jsdom without real rendering)
    expect(elapsed).toBeLessThan(1000);
  });

  test('update frame (animator.update) for 100 resources takes < 16ms', () => {
    const state = generateState(100);
    vis.update(state);

    // Warm up
    const animator = (vis as any).animator;
    animator.update(16);

    // Measure a single frame update
    const start = performance.now();
    animator.update(16);
    const frameTime = performance.now() - start;

    // A single frame should take well under 16ms (60fps budget)
    expect(frameTime).toBeLessThan(16);
  });

  test('connection lines render for 100 resources', () => {
    const state = generateState(100);
    vis.update(state);

    const lines = getScene().children.filter(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    );
    // Should have connection lines (99 connections for 100 resources)
    expect(lines.length).toBe(99);
  });
});
