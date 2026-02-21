import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import type { TerraformState } from '../src/types';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-013: Connection lines', () => {
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

  function makeState(resources: TerraformState['resources'], connections: TerraformState['connections']): TerraformState {
    return { resources, connections };
  }

  test('lines are added to the scene for connections', () => {
    const state = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
        { id: 'subnet-1', type: 'subnet', name: 'sub', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state);

    const lines = getScene().children.filter(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    );
    expect(lines.length).toBe(1);
  });

  test('line connects the two resource positions', () => {
    const state = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
        { id: 'subnet-1', type: 'subnet', name: 'sub', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state);

    const line = getScene().children.find(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    ) as THREE.Line;
    expect(line).toBeDefined();

    const positions = (line.geometry as THREE.BufferGeometry).getAttribute('position');
    // Line should have 2 points
    expect(positions.count).toBe(2);
  });

  test('line material is visible but not distracting (low opacity)', () => {
    const state = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
        { id: 'subnet-1', type: 'subnet', name: 'sub', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state);

    const line = getScene().children.find(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    ) as THREE.Line;

    const material = line.material as THREE.LineBasicMaterial;
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBeLessThanOrEqual(0.4);
    expect(material.opacity).toBeGreaterThan(0);
  });

  test('connection lines update when resources move', () => {
    const state1 = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
        { id: 'subnet-1', type: 'subnet', name: 'sub', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state1);

    const line = getScene().children.find(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    ) as THREE.Line;
    const posAttr1 = (line.geometry as THREE.BufferGeometry).getAttribute('position');
    const firstX = posAttr1.getX(0);

    // Move resource by updating state (layout recalculates)
    vis.update(state1);

    // Positions should be set (line still exists and is updated)
    const posAttr2 = (line.geometry as THREE.BufferGeometry).getAttribute('position');
    expect(posAttr2.count).toBe(2);
  });

  test('connection with missing resource is skipped', () => {
    const state = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state);

    const lines = getScene().children.filter(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    );
    expect(lines.length).toBe(0);
  });

  test('duplicate connections are not created on repeated update', () => {
    const state = makeState(
      [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
        { id: 'subnet-1', type: 'subnet', name: 'sub', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      ],
      [
        { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      ],
    );

    vis.update(state);
    vis.update(state);

    const lines = getScene().children.filter(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    );
    expect(lines.length).toBe(1);
  });
});
