import type { Theme } from './Theme';

export const defaultTheme: Theme = {
  name: 'tron',
  
  background: '#0a0a0a',
  fog: {
    color: '#0a0a0a',
    near: 50,
    far: 200,
  },
  
  ground: {
    color: '#111111',
    checkerboard: {
      color1: '#1a1a1a',
      color2: '#0f0f0f',
      size: 10,
    },
  },
  
  ambientLight: {
    color: '#222222',
    intensity: 0.5,
  },
  
  resources: {
    vpc: {
      color: '#00FFFF',
      emissive: '#00FFFF',
      emissiveIntensity: 0.5,
      opacity: 0.2,
    },
    subnet: {
      color: '#0066FF',      // Neon blue (was #4169E1)
      emissive: '#0066FF',
      emissiveIntensity: 0.5,
      opacity: 0.85,
    },
    security_group: {
      color: '#FF8C00',
      emissive: '#FF8C00',
      emissiveIntensity: 0.4,
      opacity: 0.5,
      wireframe: true,
    },
    instance: {
      color: '#39FF14',      // Neon green (was #00FF00)
      emissive: '#39FF14',
      emissiveIntensity: 0.6,
      opacity: 0.9,
    },
    s3_bucket: {
      color: '#B026FF',      // Neon purple (was #9B59B6)
      emissive: '#B026FF',
      emissiveIntensity: 0.5,
      opacity: 0.9,
    },
    iam_role: {
      color: '#FFD700',
      emissive: '#FFD700',
      emissiveIntensity: 0.5,
      opacity: 0.9,
    },
    lambda_function: {
      color: '#FF00FF',
      emissive: '#FF00FF',
      emissiveIntensity: 0.6,
      opacity: 0.9,
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
