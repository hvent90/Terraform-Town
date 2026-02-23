export type EffectKey =
  | 'edgeIntensify' | 'faceOpacity' | 'breathingAmp' | 'haloBloom' | 'lift'
  | 'particleAttract' | 'faceSeparation' | 'tracePulse' | 'colorTemp'
  | 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker'
  | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';

export const EFFECT_LABELS: Record<EffectKey, string> = {
  edgeIntensify: 'Edge Intensify',
  faceOpacity: 'Face Opacity',
  breathingAmp: 'Breathing Amp',
  haloBloom: 'Halo Bloom',
  lift: 'Lift',
  particleAttract: 'Particle Attract',
  faceSeparation: 'Face Separation',
  tracePulse: 'Trace Pulse',
  colorTemp: 'Color Temp Shift',
  orbitRing: 'Orbit Ring',
  dataStream: 'Data Stream',
  groundBeam: 'Ground Beam',
  holoFlicker: 'Holo Flicker',
  faceDataOverlay: 'Face Data Overlay',
  statusGlow: 'Status Glow',
  traceActivation: 'Trace Activation',
};

export const ALL_EFFECTS: EffectKey[] = Object.keys(EFFECT_LABELS) as EffectKey[];

export const DEFAULT_HOVER_TOGGLES: Record<EffectKey, boolean> = Object.fromEntries(
  ALL_EFFECTS.map(k => [k, k === 'faceOpacity'])
) as Record<EffectKey, boolean>;

export const DEFAULT_SELECT_TOGGLES: Record<EffectKey, boolean> = Object.fromEntries(
  ALL_EFFECTS.map(k => [k, k === 'edgeIntensify' || k === 'lift'])
) as Record<EffectKey, boolean>;

// Post-processing parameters
export type PostProcessKey = 'bloomThreshold' | 'bloomStrength' | 'bloomRadius' | 'filmGrain' | 'vignetteDarkness' | 'exposure';

export const POST_PROCESS_LABELS: Record<PostProcessKey, string> = {
  bloomThreshold: 'Bloom Threshold',
  bloomStrength: 'Bloom Strength',
  bloomRadius: 'Bloom Radius',
  filmGrain: 'Film Grain',
  vignetteDarkness: 'Vignette Darkness',
  exposure: 'Exposure',
};

export const POST_PROCESS_RANGES: Record<PostProcessKey, { min: number; max: number; step: number }> = {
  bloomThreshold: { min: 0, max: 1, step: 0.01 },
  bloomStrength: { min: 0, max: 3, step: 0.05 },
  bloomRadius: { min: 0, max: 1, step: 0.01 },
  filmGrain: { min: 0, max: 0.2, step: 0.005 },
  vignetteDarkness: { min: 0, max: 2, step: 0.05 },
  exposure: { min: 0.1, max: 2, step: 0.05 },
};

export const DEFAULT_POST_PROCESS: Record<PostProcessKey, number> = {
  bloomThreshold: 0.4,
  bloomStrength: 0.35,
  bloomRadius: 0.2,
  filmGrain: 0.03,
  vignetteDarkness: 1.1,
  exposure: 0.6,
};

export const ALL_POST_PROCESS: PostProcessKey[] = Object.keys(POST_PROCESS_LABELS) as PostProcessKey[];

// Water / reflection parameters
export type WaterKey = 'reflectionIntensity' | 'reflectionBlur' | 'falloffSpread' | 'falloffBrightness' | 'turbulenceSpeed' | 'turbulenceStrength';

export const WATER_LABELS: Record<WaterKey, string> = {
  reflectionIntensity: 'Reflection Intensity',
  reflectionBlur: 'Reflection Blur',
  falloffSpread: 'Falloff Spread',
  falloffBrightness: 'Falloff Brightness',
  turbulenceSpeed: 'Turbulence Speed',
  turbulenceStrength: 'Turbulence Strength',
};

export const WATER_RANGES: Record<WaterKey, { min: number; max: number; step: number }> = {
  reflectionIntensity: { min: 0, max: 5, step: 0.1 },
  reflectionBlur: { min: 0, max: 0.03, step: 0.001 },
  falloffSpread: { min: 0.1, max: 5, step: 0.1 },
  falloffBrightness: { min: 0.1, max: 1, step: 0.05 },
  turbulenceSpeed: { min: 0, max: 2, step: 0.05 },
  turbulenceStrength: { min: 0, max: 3, step: 0.05 },
};

export const DEFAULT_WATER: Record<WaterKey, number> = {
  reflectionIntensity: 0.6,
  reflectionBlur: 0.008,
  falloffSpread: 1.2,
  falloffBrightness: 0.85,
  turbulenceSpeed: 0.6,
  turbulenceStrength: 2.2,
};

export const ALL_WATER: WaterKey[] = Object.keys(WATER_LABELS) as WaterKey[];

// Connection effect keys
export type ConnectionEffectKey = 'connectionTraces' | 'tracePulse' | 'traceParticles' | 'traceLabels';

export const CONNECTION_LABELS: Record<ConnectionEffectKey, string> = {
  connectionTraces: 'Traces',
  tracePulse: 'Pulse',
  traceParticles: 'Particles',
  traceLabels: 'Labels',
};

export const ALL_CONNECTION_EFFECTS: ConnectionEffectKey[] = Object.keys(CONNECTION_LABELS) as ConnectionEffectKey[];

export const DEFAULT_CONNECTION_TOGGLES: Record<ConnectionEffectKey, boolean> = {
  connectionTraces: true,
  tracePulse: true,
  traceParticles: false,
  traceLabels: false,
};
