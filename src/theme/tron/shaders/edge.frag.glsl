uniform vec3 uColorBot;
uniform vec3 uColorTop;
uniform float uHover;
uniform float uSelectEdgePulse;
uniform float uSelectTime;
varying float vHeight;
void main() {
  vec3 col = mix(uColorBot, uColorTop, smoothstep(0.0, 1.0, vHeight));
  float alpha = 0.6 + vHeight * 0.4;
  alpha = alpha + uHover * (1.0 - alpha);
  float pulse = exp(-mod(uSelectTime, 1.5) * 2.5) * uSelectEdgePulse;
  col = col * (1.0 + pulse * 4.0) + vec3(1.0, 0.7, 0.3) * pulse * 1.5;
  alpha = min(alpha + pulse * 0.6 + uSelectEdgePulse * 0.4, 1.0);
  gl_FragColor = vec4(col, alpha);
}
