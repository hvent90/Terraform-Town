uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float c = smoothstep(1.0, 0.2, d);
  gl_FragColor = vec4(uColor, c * vAlpha);
}
