import * as THREE from 'three';

export const TRACE_COLOR = '#ff8800';

// Warm palette
export const AMBER = new THREE.Color(0xff8822);
export const AMBER_WARM = new THREE.Color(0xffaa44);
export const WHITE_HOT = new THREE.Color(0xffeedd);
export const FACE_INNER_WARM = new THREE.Color(0xffbb55);
export const TRACE_WARM = new THREE.Color(TRACE_COLOR);
export const HALO_WARM = new THREE.Color(0xffaa55);
export const LIGHT_POOL_BRIGHT = new THREE.Color(0xffcc88);

// Cool palette (color temp shift targets)
export const COOL_BLUE = new THREE.Color(0x4488ff);
export const COOL_BLUE_BRIGHT = new THREE.Color(0x88bbff);
export const COOL_WHITE = new THREE.Color(0xddeeff);
export const FACE_INNER_COOL = new THREE.Color(0x88bbff);
export const TRACE_COOL = new THREE.Color(0x4488ff);

// Status
export const STATUS_GREEN = new THREE.Color(0x44ff88);
export const STATUS_GREEN_BRIGHT = new THREE.Color(0x88ffbb);

// UI tokens
export const ui = {
  surface: 'rgba(10, 8, 5, 0.85)',
  surfaceDense: 'rgba(8, 6, 4, 0.92)',
  border: 'rgba(255, 150, 50, 0.25)',
  borderSubtle: 'rgba(255, 150, 50, 0.15)',
  borderFaint: 'rgba(255, 150, 50, 0.1)',
  text: 'rgba(255, 200, 140, 0.7)',
  textBright: 'rgba(255, 200, 140, 0.9)',
  textDim: 'rgba(255, 200, 140, 0.45)',
  textFaint: 'rgba(255, 200, 140, 0.4)',
  textMuted: 'rgba(255, 200, 140, 0.35)',
  textGhost: 'rgba(255, 200, 140, 0.25)',
  heading: 'rgba(255, 180, 100, 0.95)',
  accent: '#ff8800',
  accentBg: 'rgba(255, 136, 0, 0.4)',
  accentBorder: 'rgba(255, 136, 0, 0.6)',
  accentGlow: 'rgba(255, 136, 0, 0.5)',
  statusOk: '#44ff88',
  statusOkGlow: 'rgba(68, 255, 136, 0.4)',
  inactiveBg: 'rgba(255, 255, 255, 0.08)',
  inactiveBorder: 'rgba(255, 255, 255, 0.15)',
  inactiveKnob: 'rgba(255, 255, 255, 0.25)',
  font: 'monospace',
  blur: '10px',
  blurHeavy: '16px',
  radiusSm: 6,
  radiusMd: 8,
};
