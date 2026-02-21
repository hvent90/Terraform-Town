import * as THREE from 'three';

export function createSphere(radius: number = 1): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial();
  return new THREE.Mesh(geometry, material);
}
