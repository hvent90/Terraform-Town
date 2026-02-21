import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import type { TerraformState } from '../src/types';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-015: Planned state visual', () => {
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

  function findResourceMesh(id: string): THREE.Group | undefined {
    return getScene().children.find(
      (c) => c instanceof THREE.Group && c.userData.id === id,
    ) as THREE.Group | undefined;
  }

  test('planned resource has reduced opacity (capped at state opacity)', () => {
    const state: TerraformState = {
      resources: [
        // Instance base opacity is 0.9, planned state caps at 0.5
        { id: 'inst-1', type: 'instance', name: 'planned', attributes: {}, state: 'planned' },
      ],
      connections: [],
    };

    vis.update(state);

    // Let create animation complete
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const mesh = findResourceMesh('inst-1');
    expect(mesh).toBeDefined();
    // Target opacity is 0.5 (min of instance base 0.9 and planned state 0.5)
    // Material opacity may oscillate due to pulse, so check the stable targetOpacity
    expect(mesh!.userData.targetOpacity).toBeCloseTo(0.5, 1);
    // Material opacity should be near 0.5 (within pulse range ±0.15)
    const material = mesh!.userData.mesh.material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBeGreaterThanOrEqual(0.35);
    expect(material.opacity).toBeLessThanOrEqual(0.65);
  });

  test('applied resource has full opacity', () => {
    const state: TerraformState = {
      resources: [
        { id: 'vpc-1', type: 'vpc', name: 'main', attributes: {}, state: 'applied' },
      ],
      connections: [],
    };

    vis.update(state);

    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const mesh = findResourceMesh('vpc-1');
    expect(mesh).toBeDefined();
    const material = mesh!.userData.mesh.material as THREE.MeshStandardMaterial;
    // VPC base opacity is 0.2, applied state opacity is 1.0
    // Final opacity = min(base, state) — applied should use base resource opacity
    expect(material.opacity).toBeCloseTo(0.2, 1); // VPC has base 0.2 opacity
  });

  test('planned resource is distinguishable from applied (lower opacity)', () => {
    const state: TerraformState = {
      resources: [
        { id: 'inst-1', type: 'instance', name: 'planned-inst', attributes: {}, state: 'planned' },
        { id: 'inst-2', type: 'instance', name: 'applied-inst', attributes: {}, state: 'applied' },
      ],
      connections: [],
    };

    vis.update(state);

    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const plannedMesh = findResourceMesh('inst-1');
    const appliedMesh = findResourceMesh('inst-2');
    expect(plannedMesh).toBeDefined();
    expect(appliedMesh).toBeDefined();

    const plannedMat = plannedMesh!.userData.mesh.material as THREE.MeshStandardMaterial;
    const appliedMat = appliedMesh!.userData.mesh.material as THREE.MeshStandardMaterial;

    expect(plannedMat.opacity).toBeLessThan(appliedMat.opacity);
  });

  test('planned resource has pulsing animation active', () => {
    const state: TerraformState = {
      resources: [
        { id: 'inst-1', type: 'instance', name: 'planned', attributes: {}, state: 'planned' },
      ],
      connections: [],
    };

    vis.update(state);

    // Complete create animation
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const mesh = findResourceMesh('inst-1');
    const material = mesh!.userData.mesh.material as THREE.MeshStandardMaterial;
    const opacityBefore = material.opacity;

    // Advance time — pulse oscillates with period 1000ms
    animator.update(250); // quarter period, max pulse offset

    const opacityAfter = material.opacity;
    // Pulse should change opacity over time
    expect(opacityAfter).not.toBeCloseTo(opacityBefore, 2);
  });
});
