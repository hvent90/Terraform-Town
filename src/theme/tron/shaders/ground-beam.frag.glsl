uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float centerFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
  float heightFade = pow(1.0 - vUv.y, 1.5);
  float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + vUv.y * 8.0);
  float alpha = centerFade * heightFade * pulse * uOpacity * 0.5;
  vec3 col = vec3(1.0, 0.55, 0.1);
  gl_FragColor = vec4(col * 3.0, alpha);
}
