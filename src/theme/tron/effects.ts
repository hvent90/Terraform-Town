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
