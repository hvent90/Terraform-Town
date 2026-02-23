import {
  uniform, float, vec2, vec3, fract, floor, mix, smoothstep, exp,
  sin, cos, positionWorld, Fn, dot,
} from 'three/tsl';

// Dynamic uniforms — updated per frame from waterRef
export const uFalloffSpread = uniform(1.2);
export const uFalloffBrightness = uniform(0.85);
export const uTurbulenceSpeed = uniform(0.6);
export const uTurbulenceStrength = uniform(2.2);

/**
 * hash22: pseudo-random 2D gradient hash
 * Ports the GLSL hash22(vec2 p) -> vec2
 */
const hash22 = Fn(([p_in]: [any]) => {
  // p3 = fract(vec3(p.x, p.y, p.x) * vec3(0.1031, 0.1030, 0.0973))
  const p3 = fract(vec3(p_in.x, p_in.y, p_in.x).mul(vec3(0.1031, 0.1030, 0.0973))).toVar();
  // p3 += dot(p3, vec3(p3.y, p3.z, p3.x) + 33.33)
  const p3yzx = vec3(p3.y, p3.z, p3.x);
  p3.addAssign(dot(p3, p3yzx.add(33.33)));
  // return fract((vec2(p3.x, p3.x) + vec2(p3.y, p3.z)) * vec2(p3.z, p3.y)) * 2.0 - 1.0
  return fract(vec2(p3.x, p3.x).add(vec2(p3.y, p3.z)).mul(vec2(p3.z, p3.y))).mul(2.0).sub(1.0);
});

/**
 * noise: gradient noise from hash22
 * Ports the GLSL noise(vec2 p) -> float
 */
const noise = Fn(([p_in]: [any]) => {
  const i = floor(p_in);
  const f = fract(p_in).toVar();
  // Hermite interpolation: f = f * f * (3 - 2f)
  const smooth = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

  const a = dot(hash22(i), f);
  const b = dot(hash22(i.add(vec2(1.0, 0.0))), f.sub(vec2(1.0, 0.0)));
  const c = dot(hash22(i.add(vec2(0.0, 1.0))), f.sub(vec2(0.0, 1.0)));
  const d = dot(hash22(i.add(vec2(1.0, 1.0))), f.sub(vec2(1.0, 1.0)));

  return mix(mix(a, b, smooth.x), mix(c, d, smooth.x), smooth.y);
});

/**
 * Compute water turbulence displacement
 * Returns a vec2 turbulence offset based on world position and time
 */
export const waterTurbulence = Fn(([worldXZ, uTime]: [any, any]) => {
  const dist = worldXZ.length();
  const distFactor = smoothstep(0.2, 1.2, dist);
  const t = uTime.mul(uTurbulenceSpeed);

  // Layer 1: fine detail
  const turb = vec2(
    noise(worldXZ.mul(18.0).add(vec2(t.mul(1.2), t.mul(0.9)))),
    noise(worldXZ.mul(18.0).add(vec2(t.mul(0.8), t.mul(1.3)).add(50.0))),
  ).mul(0.009).toVar();

  // Layer 2: medium detail
  turb.addAssign(vec2(
    noise(worldXZ.mul(7.0).add(vec2(t.mul(0.7), t.mul(0.5)))),
    noise(worldXZ.mul(7.0).add(vec2(t.mul(0.6), t.mul(0.8)).add(100.0))),
  ).mul(0.004));

  // Layer 3: broad wave
  turb.addAssign(vec2(
    sin(worldXZ.x.mul(2.0).add(t)).mul(cos(worldXZ.y.mul(1.5).add(t.mul(0.7)))),
    cos(worldXZ.x.mul(1.5).add(t.mul(0.8))).mul(sin(worldXZ.y.mul(2.0).add(t.mul(1.1)))),
  ).mul(0.002));

  // Scale by distance and strength uniform
  turb.mulAssign(float(0.4).add(distFactor.mul(0.6)));
  turb.mulAssign(uTurbulenceStrength);

  return turb;
});

/**
 * Compute distance-based falloff for the reflection
 */
export const waterFalloff = Fn(() => {
  const dist = vec2(positionWorld.x, positionWorld.z).length();
  return exp(dist.mul(dist).negate().mul(uFalloffSpread)).mul(uFalloffBrightness);
});
