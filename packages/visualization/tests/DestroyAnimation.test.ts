import { describe, test, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Animator } from '../src/animations/Animator';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-012: Destroy animation', () => {
  let scene: THREE.Scene;
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
    scene.add(mesh);
    return mesh;
  }

  beforeEach(() => {
    scene = new THREE.Scene();
    meshes = new Map();
    animator = new Animator((id) => meshes.get(id));
  });

  test('destroyed resource starts fading out (opacity decreases)', () => {
    const mesh = createTestMesh('res-1');
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBe(1);

    animator.play({
      id: 'destroy-res-1',
      type: 'destroy',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    animator.update(150);

    expect(material.opacity).toBeLessThan(1);
    expect(material.opacity).toBeGreaterThan(0);
  });

  test('scale animates 1→0', () => {
    const mesh = createTestMesh('res-1');
    expect(mesh.scale.x).toBe(1);

    animator.play({
      id: 'destroy-res-1',
      type: 'destroy',
      target: 'res-1',
      duration: 300,
      easing: 'linear',
      interruptible: true,
    });

    // Mid-animation
    animator.update(150);
    expect(mesh.scale.x).toBeGreaterThan(0);
    expect(mesh.scale.x).toBeLessThan(1);

    // Complete animation
    animator.update(200);
    expect(mesh.scale.x).toBeCloseTo(0, 1);
  });

  test('duration is 300ms', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'destroy-res-1',
      type: 'destroy',
      target: 'res-1',
      duration: 300,
      easing: 'linear',
      interruptible: true,
    });

    // At 200ms, animation should still be running
    animator.update(200);
    expect(animator.isRunning('destroy-res-1')).toBe(true);

    // At 300ms total, animation should be complete
    animator.update(100);
    expect(animator.isRunning('destroy-res-1')).toBe(false);
  });

  test('mesh removed from scene after animation completes', () => {
    const mesh = createTestMesh('res-1');
    expect(scene.children).toContain(mesh);

    animator.play({
      id: 'destroy-res-1',
      type: 'destroy',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    // Complete the animation
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    expect(scene.children).not.toContain(mesh);
  });

  test('opacity reaches 0 after animation completes', () => {
    const mesh = createTestMesh('res-1');

    animator.play({
      id: 'destroy-res-1',
      type: 'destroy',
      target: 'res-1',
      duration: 300,
      easing: 'easeOut',
      interruptible: true,
    });

    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBeCloseTo(0, 1);
  });
});
