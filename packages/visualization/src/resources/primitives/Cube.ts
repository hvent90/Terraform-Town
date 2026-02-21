import * as THREE from 'three';

export function createCube(size: number = 2): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial();
  return new THREE.Mesh(geometry, material);
}
