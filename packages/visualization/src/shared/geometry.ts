import * as THREE from 'three';

export const CUBE_SIZE = 0.6;
export const CUBE_Y = CUBE_SIZE / 2;

export const faceConfigs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
  { rot: [0, 0, 0],             pos: [0, 0, CUBE_SIZE / 2] },
  { rot: [0, Math.PI, 0],       pos: [0, 0, -CUBE_SIZE / 2] },
  { rot: [0, Math.PI / 2, 0],   pos: [CUBE_SIZE / 2, 0, 0] },
  { rot: [0, -Math.PI / 2, 0],  pos: [-CUBE_SIZE / 2, 0, 0] },
  { rot: [-Math.PI / 2, 0, 0],  pos: [0, CUBE_SIZE / 2, 0] },
  { rot: [Math.PI / 2, 0, 0],   pos: [0, -CUBE_SIZE / 2, 0] },
];

export function createHaloTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 190, 100, 0.06)');
  g.addColorStop(0.15, 'rgba(255, 150, 60, 0.03)');
  g.addColorStop(0.35, 'rgba(255, 120, 30, 0.005)');
  g.addColorStop(0.6, 'rgba(255, 80, 10, 0.0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
