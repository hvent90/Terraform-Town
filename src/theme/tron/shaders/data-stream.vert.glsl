attribute float speed;
uniform float uTime;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec3 pos = position;
  float cycle = fract(pos.y / 1.5 + uTime * speed * 0.3);
  pos.y = cycle * 1.5;
  vAlpha = (1.0 - cycle) * uOpacity;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.0 - cycle) * 3.0 + 1.0;
  gl_Position = projectionMatrix * mv;
}
