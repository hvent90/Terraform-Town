import * as THREE from 'three';

export function createCylinder(radiusTop: number = 1, radiusBottom: number = 1, height: number = 2): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
  const material = new THREE.MeshStandardMaterial();
  return new THREE.Mesh(geometry, material);
}
