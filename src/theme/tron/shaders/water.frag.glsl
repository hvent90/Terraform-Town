uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float uTime;
varying vec4 vUv;
varying vec3 vWorldPos;

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float dist = length(vWorldPos.xz);
  float distFactor = smoothstep(0.2, 1.2, dist);

  float t = uTime * 0.6;
  vec2 turb = vec2(
    noise(vWorldPos.xz * 18.0 + vec2(t * 1.2, t * 0.9)),
    noise(vWorldPos.xz * 18.0 + vec2(t * 0.8, t * 1.3) + 50.0)
  ) * 0.009;

  turb += vec2(
    noise(vWorldPos.xz * 7.0 + vec2(t * 0.7, t * 0.5)),
    noise(vWorldPos.xz * 7.0 + vec2(t * 0.6, t * 0.8) + 100.0)
  ) * 0.004;

  turb += vec2(
    sin(vWorldPos.x * 2.0 + t) * cos(vWorldPos.z * 1.5 + t * 0.7),
    cos(vWorldPos.x * 1.5 + t * 0.8) * sin(vWorldPos.z * 2.0 + t * 1.1)
  ) * 0.002;

  turb *= 0.4 + distFactor * 0.6;

  float blur = (0.001 + distFactor * 0.005) * vUv.w;
  vec4 uv = vUv;
  uv.xy += turb * uv.w;

  vec4 col = vec4(0.0);
  col += texture2DProj(tDiffuse, uv) * 2.0;
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, 0.0), uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, 0.0), uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, -blur), uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, blur), uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, -blur) * 0.7, uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, -blur) * 0.7, uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, blur) * 0.7, uv.zw));
  col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, blur) * 0.7, uv.zw));
  col /= 10.0;

  float falloff = exp(-dist * dist * 1.2);
  col.rgb *= falloff * 0.85;

  gl_FragColor = col;
}
