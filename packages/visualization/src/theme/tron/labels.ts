export type LabelStyle = 'off' | 'etched' | 'holographic' | 'neon' | 'wireframe' | 'led' | 'ghost';

export const LABEL_STYLE_LABELS: Record<LabelStyle, string> = {
  off: 'Off',
  etched: 'Etched Ground',
  holographic: 'Holographic Tag',
  neon: 'Neon Underline',
  wireframe: 'Wireframe Stencil',
  led: 'LED Matrix',
  ghost: 'Ghost / Fade',
};

export const ALL_LABEL_STYLES: LabelStyle[] = Object.keys(LABEL_STYLE_LABELS) as LabelStyle[];

export const DEFAULT_LABEL_STYLE: LabelStyle = 'etched';
