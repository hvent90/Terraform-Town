import * as THREE from 'three';

const _frustum = new THREE.Frustum();
const _matrix = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

/**
 * Creates a frustum visibility tester for the given camera.
 * Call once per frame with the current camera, then test each point.
 * @param margin Bounding sphere radius around each point (units).
 */
export function createFrustumCuller(
  camera: THREE.Camera,
  margin: number,
): (x: number, y: number, z: number) => boolean {
  _matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  _frustum.setFromProjectionMatrix(_matrix);

  return (x: number, y: number, z: number) => {
    _sphere.center.set(x, y, z);
    _sphere.radius = margin;
    return _frustum.intersectsSphere(_sphere);
  };
}
