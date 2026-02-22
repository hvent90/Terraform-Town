uniform vec3 uColor;
uniform vec3 uColorBright;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  vec2 world = c * 8.0;
  float boxDist = max(abs(world.x), abs(world.y));
  float coreGlow = exp(-pow(max(boxDist - 0.3, 0.0), 2.0) * 120.0) * 0.3;
  float outerGlow = exp(-r * r * 18.0) * 0.06;
  float intensity = coreGlow + outerGlow;
  vec3 col = mix(uColor, uColorBright, coreGlow / max(intensity, 0.001));
  gl_FragColor = vec4(col, intensity);
}
