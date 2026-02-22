uniform vec3 color;
uniform float fadeDistance;
uniform float uBorderDist;
uniform float uPulseAlpha;
uniform float uPulseTime;
uniform float uSelectPulseAlpha;
uniform float uSelectPulseTime;
varying vec3 vWorldPosition;
void main() {
  float distFromBorder = max(abs(vWorldPosition.x), abs(vWorldPosition.z)) - uBorderDist;
  float d = max(distFromBorder, 0.0);
  float alpha = 1.0 - smoothstep(0.0, fadeDistance, d);

  float pulsePhase = fract(d * 1.5 - uPulseTime * 2.0);
  float pulse = exp(-pulsePhase * pulsePhase * 40.0) * uPulseAlpha;

  float selectPhase = fract(d * 0.8 - uSelectPulseTime * 1.5);
  float selectPulse = exp(-selectPhase * selectPhase * 20.0) * uSelectPulseAlpha;
  pulse = max(pulse, selectPulse);

  float finalAlpha = max(alpha, pulse);
  float brightness = 4.0 + pulse * 6.0;
  gl_FragColor = vec4(color * brightness, finalAlpha);
}
