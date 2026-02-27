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

// Per-type color palettes
type ResourceColorSet = {
  faceInner: THREE.Color;
  faceEdge: THREE.Color;
  edge: THREE.Color;
  halo: THREE.Color;
  trace: THREE.Color;
};

function makeColorSet(base: number): ResourceColorSet {
  const b = new THREE.Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  b.getHSL(hsl);
  return {
    faceInner: new THREE.Color().setHSL(hsl.h, hsl.s * 0.8, Math.min(hsl.l + 0.15, 0.85)),
    faceEdge: new THREE.Color().setHSL(hsl.h, hsl.s * 0.4, 0.92),
    edge: new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(hsl.l + 0.05, 0.75)),
    halo: new THREE.Color().setHSL(hsl.h, hsl.s * 0.8, Math.min(hsl.l + 0.1, 0.8)),
    trace: new THREE.Color(base),
  };
}

/** Generate a deterministic hue from a string (0–1 range). */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return ((h >>> 0) % 360) / 360;
}

function makeColorSetFromHue(hue: number, sat = 0.7, light = 0.55): ResourceColorSet {
  const base = new THREE.Color().setHSL(hue, sat, light);
  return makeColorSet(base.getHex());
}

const KNOWN_COLORS: Record<string, ResourceColorSet> = {
  ec2: makeColorSet(0xff8822),
  vpc: makeColorSet(0x4488ff),
  subnet: makeColorSet(0x44ddaa),
  security_group: makeColorSet(0xff4466),
  s3_bucket: makeColorSet(0x44ff88),
  iam_role: makeColorSet(0xaa44ff),
  lambda: makeColorSet(0x44ddff),
};

/**
 * Color lookup that auto-generates a deterministic palette for unknown
 * service types based on a hash of the key string.
 */
export const RESOURCE_COLORS: Record<string, ResourceColorSet> = new Proxy(KNOWN_COLORS, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    // Generate and cache a color set from the service name hash
    const generated = makeColorSetFromHue(hashHue(prop));
    target[prop] = generated;
    return generated;
  },
});

export const DEFAULT_RESOURCE_COLORS = makeColorSet(0x888888);

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
