attribute float size;
attribute float alpha;
varying float vAlpha;
uniform float uTime;
uniform float uZoom;
uniform float uHover;
void main() {
  vAlpha = alpha;
  vec3 pos = position;
  float dist = length(pos.xz);
  pos.xz *= 1.0 - uHover * 0.4;
  pos.y += sin(uTime * 1.5 + dist * 4.0) * 0.002;
  pos.y += uHover * 0.03 * sin(uTime * 3.0 + dist * 6.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = size * uZoom * 0.04;
  gl_Position = projectionMatrix * mv;
}
