import type { Theme } from '../types';

export const defaultTheme: Theme = {
  name: 'tron',
  background: '#000000',
  ground: {
    color: '#000000',
    dotGrid: { dotColor: '#ffffff', spacing: 1.5, dotSize: 0.4 },
  },
  ambientLight: { color: '#050510', intensity: 0.1 },
  hemisphereLight: { skyColor: '#001122', groundColor: '#000005', intensity: 0.2 },
  directionalLight: {
    color: '#6688cc',
    intensity: 0.3,
    position: [5, 10, 5],
    castShadow: true,
    shadowMapSize: 512,
  },
  rimLight: { color: '#0088ff', intensity: 0.4, position: [-5, 3, -5] },
  bloom: { strength: 0.4, radius: 0.3, threshold: 0.6 },
  resources: {
    vpc: {
      color: '#00FFFF', emissive: '#00FFFF', emissiveIntensity: 0.6,
      opacity: 0.2, transmission: 0.9, roughness: 0.5, thickness: 0.5, metalness: 0,
      pointLight: { intensity: 80, distance: 40, decay: 2 },
    },
    subnet: {
      color: '#0066FF', emissive: '#0066FF', emissiveIntensity: 0.6,
      opacity: 0.85, transmission: 0.7, roughness: 0.4, thickness: 0.4, metalness: 0,
      pointLight: { intensity: 40, distance: 20, decay: 2 },
    },
    security_group: {
      color: '#FF8C00', emissive: '#FF8C00', emissiveIntensity: 0.5,
      opacity: 0.5, wireframe: true,
      pointLight: { intensity: 30, distance: 18, decay: 2 },
    },
    instance: {
      color: '#39FF14', emissive: '#39FF14', emissiveIntensity: 0.7,
      opacity: 0.9, transmission: 0.8, roughness: 0.45, thickness: 0.3, metalness: 0,
      pointLight: { intensity: 25, distance: 14, decay: 2 },
    },
    s3_bucket: {
      color: '#B026FF', emissive: '#B026FF', emissiveIntensity: 0.6,
      opacity: 0.9, transmission: 0.8, roughness: 0.5, thickness: 0.4, metalness: 0,
      pointLight: { intensity: 25, distance: 14, decay: 2 },
    },
    iam_role: {
      color: '#FFD700', emissive: '#FFD700', emissiveIntensity: 0.6,
      opacity: 0.9, transmission: 0.75, roughness: 0.4, thickness: 0.2, metalness: 0,
      pointLight: { intensity: 20, distance: 12, decay: 2 },
    },
    lambda_function: {
      color: '#FF00FF', emissive: '#FF00FF', emissiveIntensity: 0.7,
      opacity: 0.9, transmission: 0.85, roughness: 0.5, thickness: 0.3, metalness: 0,
      pointLight: { intensity: 30, distance: 14, decay: 2 },
    },
  },
  states: {
    planned: { opacity: 0.5, pulse: true },
    applied: { opacity: 1.0, pulse: false },
    modified: { opacity: 1.0, glow: '#FFFF00' },
    destroyed: { opacity: 0.3, color: '#FF0000' },
    error: { opacity: 1.0, color: '#FF0000', icon: 'error' },
  },
  animations: {
    createDuration: 300,
    destroyDuration: 300,
    hoverScale: 1.05,
    selectionGlow: 1.2,
  },
};
