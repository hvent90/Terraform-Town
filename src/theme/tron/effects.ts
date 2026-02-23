export type EffectKey = 'edgeIntensify' | 'faceOpacity' | 'breathingAmp' | 'haloBloom' | 'lift' | 'particleAttract' | 'faceSeparation' | 'tracePulse' | 'colorTemp';

export type SelectEffectKey = 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker' | 'edgePulse' | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';

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
};

export const SELECT_EFFECT_LABELS: Record<SelectEffectKey, string> = {
  orbitRing: 'Orbit Ring',
  dataStream: 'Data Stream',
  groundBeam: 'Ground Beam',
  holoFlicker: 'Holo Flicker',
  edgePulse: 'Edge Pulse',
  faceDataOverlay: 'Face Data Overlay',
  statusGlow: 'Status Glow',
  traceActivation: 'Trace Activation',
};

export const ALL_EFFECTS: EffectKey[] = Object.keys(EFFECT_LABELS) as EffectKey[];
export const ALL_SELECT_EFFECTS: SelectEffectKey[] = Object.keys(SELECT_EFFECT_LABELS) as SelectEffectKey[];

export const DEFAULT_TOGGLES: Record<EffectKey, boolean> = Object.fromEntries(
  ALL_EFFECTS.map(k => [k, false])
) as Record<EffectKey, boolean>;

export const DEFAULT_SELECT_TOGGLES: Record<SelectEffectKey, boolean> = Object.fromEntries(
  ALL_SELECT_EFFECTS.map(k => [k, false])
) as Record<SelectEffectKey, boolean>;

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
  bloomStrength: 0.8,
  bloomRadius: 0.4,
  filmGrain: 0.03,
  vignetteDarkness: 1.1,
  exposure: 0.6,
};

export const ALL_POST_PROCESS: PostProcessKey[] = Object.keys(POST_PROCESS_LABELS) as PostProcessKey[];
