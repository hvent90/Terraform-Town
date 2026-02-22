uniform vec3 uCameraPos;
uniform vec3 uColorInner;
uniform vec3 uColorEdge;
uniform float uTime;
uniform float uHover;
uniform float uHoloFlicker;
uniform float uDataOverlay;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
void main() {
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float facing = abs(dot(viewDir, vWorldNormal));
  float fresnel = pow(1.0 - facing, 1.5);

  vec2 edgeDist = abs(vUv - 0.5) * 2.0;
  float edgeFactor = max(edgeDist.x, edgeDist.y);
  edgeFactor = smoothstep(0.7, 1.0, edgeFactor);

  float baseAlpha = 0.15 + fresnel * 0.45 + edgeFactor * 0.5;
  baseAlpha += uHover * 0.2;

  vec3 col = mix(uColorInner, uColorEdge, fresnel * 0.6 + edgeFactor * 0.4);
  col = mix(col, uColorEdge, uHover * 0.3);

  float topBoost = smoothstep(0.3, 1.0, vWorldNormal.y) * 0.2;
  baseAlpha += topBoost;
  col = mix(col, uColorEdge, topBoost);

  baseAlpha *= 0.95 + 0.05 * sin(uTime * 1.5);

  // Holographic flicker
  float scanline = smoothstep(0.4, 0.5, fract(vWorldPos.y * 30.0 + uTime * 2.0)) * 0.3;
  float flicker = step(0.97, fract(sin(uTime * 43.0) * 4375.5453)) * 0.4;
  baseAlpha += (scanline + flicker) * uHoloFlicker;
  col = mix(col, vec3(0.7, 0.9, 1.0), (scanline * 0.3 + flicker * 0.2) * uHoloFlicker);

  // Data overlay grid
  float gridX = smoothstep(0.9, 0.95, fract(vUv.x * 8.0));
  float gridY = smoothstep(0.9, 0.95, fract(vUv.y * 8.0));
  float grid = max(gridX, gridY);
  float scrollData = step(0.6, fract(sin(floor(vUv.x * 8.0) * 17.0 + floor(vUv.y * 8.0 - uTime * 1.5) * 31.0) * 43758.5453));
  float overlay = (grid * 0.4 + scrollData * 0.15) * uDataOverlay;
  col = mix(col, vec3(1.0, 0.7, 0.2), overlay);
  baseAlpha += overlay * 0.3;

  float maxAlpha = 0.85 + uHover * 0.15;
  gl_FragColor = vec4(col, clamp(baseAlpha, 0.0, maxAlpha));
}
