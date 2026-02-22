varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float c = smoothstep(1.0, 0.3, d);
  gl_FragColor = vec4(1.0, 0.6, 0.15, c * vAlpha * 0.6);
}
