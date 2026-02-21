import { describe, test, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Animator } from '../src/animations/Animator';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-011: Create animation', () => {
  let meshes: Map<string, THREE.Object3D>;
  let animator: Animator;

  function createTestMesh(id: string): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 1,
      }),
    );
    mesh.userData = { id, type: 'instance' };
    meshes.set(id, mesh);
    return mesh;
  }

  beforeEach(() => {
    meshes = new Map();
    animator = new Animator((id) => meshes.get(id));
  });

  test('new resource starts at scale 0 after create animation queued', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    expect(mesh.scale.x).toBe(0);
    expect(mesh.scale.y).toBe(0);
    expect(mesh.scale.z).toBe(0);
  });

  test('opacity starts at 0 after create animation queued', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBe(0);
    expect(material.transparent).toBe(true);
  });

  test('scale reaches 1 after full animation duration', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    // Simulate 300ms+ of updates
    for (let i = 0; i < 20; i++) {
      animator.update(16);
    }

    expect(mesh.scale.x).toBeCloseTo(1, 1);
    expect(mesh.scale.y).toBeCloseTo(1, 1);
    expect(mesh.scale.z).toBeCloseTo(1, 1);
  });

  test('opacity reaches 1 after full animation duration', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    for (let i = 0; i < 20; i++) {
      animator.update(16);
    }

    const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBeCloseTo(1, 1);
  });

  test('mid-animation scale is between 0 and 1', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'linear',
      interruptible: true,
    });

    // ~150ms = halfway through 300ms
    animator.update(150);

    expect(mesh.scale.x).toBeGreaterThan(0);
    expect(mesh.scale.x).toBeLessThan(1);
  });

  test('animation is interruptible - stop prevents further progress', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    animator.update(100);
    const scaleAfterStop = mesh.scale.x;

    animator.stop('create-res-1');

    // Further updates should not change scale
    animator.update(100);
    expect(mesh.scale.x).toBe(scaleAfterStop);
  });

  test('completed animation is removed from running', () => {
    createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    // Complete the animation
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    expect(animator.isRunning('create-res-1')).toBe(false);
  });

  test('interruptible animation can be restarted', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    animator.update(100); // Partial progress

    // Replay same animation — should restart from 0
    animator.play({
      id: 'create-res-1',
      type: 'create',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    expect(mesh.scale.x).toBe(0);
  });
});
