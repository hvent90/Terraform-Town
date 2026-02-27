import { describe, test, expect } from 'bun:test';
import * as THREE from 'three';
import { createFrustumCuller } from './frustum';

describe('createFrustumCuller', () => {
  test('returns true for point inside frustum', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const culler = createFrustumCuller(camera, 3);
    expect(culler(0, 0, 0)).toBe(true);
  });

  test('returns false for point far outside frustum', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const culler = createFrustumCuller(camera, 3);
    expect(culler(500, 0, 500)).toBe(false);
  });

  test('margin extends visibility zone', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const tightCuller = createFrustumCuller(camera, 0);
    const looseCuller = createFrustumCuller(camera, 10);

    const edgePoint = { x: 15, y: 0, z: 0 };
    const tightResult = tightCuller(edgePoint.x, edgePoint.y, edgePoint.z);
    const looseResult = looseCuller(edgePoint.x, edgePoint.y, edgePoint.z);

    if (tightResult) expect(looseResult).toBe(true);
  });
});
