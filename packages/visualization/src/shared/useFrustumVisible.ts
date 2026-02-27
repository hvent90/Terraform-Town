import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _frustum = new THREE.Frustum();
const _matrix = new THREE.Matrix4();
const _sphere = new THREE.Sphere(new THREE.Vector3(), 3);

/**
 * Returns a ref to attach to a <group>. The group's `visible` property
 * is set to false when outside the camera frustum, skipping its draw call.
 */
export function useFrustumVisible(margin = 3) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    _matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_matrix);

    groupRef.current.getWorldPosition(_sphere.center);
    _sphere.radius = margin;
    groupRef.current.visible = _frustum.intersectsSphere(_sphere);
  });

  return groupRef;
}
