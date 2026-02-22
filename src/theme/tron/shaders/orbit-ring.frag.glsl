uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float dash = smoothstep(0.4, 0.5, fract(vUv.x * 20.0 - uTime * 0.5));
  vec3 col = vec3(1.0, 0.55, 0.1);
  float alpha = dash * uOpacity * 0.8;
  gl_FragColor = vec4(col * 3.0, alpha);
}
