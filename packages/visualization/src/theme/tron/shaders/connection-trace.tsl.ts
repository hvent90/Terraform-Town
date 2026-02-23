import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, float, abs, mix, smoothstep, fract, exp, sin, Fn,
} from 'three/tsl';
import * as THREE from 'three';

export function createConnectionTraceMaterial() {
  const uColor = uniform(new THREE.Color());
  const uActive = uniform(0);
  const uTime = uniform(0);
  const uDashScale = uniform(0);
  const uPulseSpeed = uniform(1.0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  material.colorNode = Fn(() => {
    const vUv = uv();
    const baseBrightness = mix(float(1.5), float(4.0), uActive);

    // Traveling pulse: gaussian centered on fract(time * speed) along UV.y
    const pulseCenter = fract(uTime.mul(uPulseSpeed));
    const dist = abs(fract(vUv.y).sub(pulseCenter));
    const pulse = exp(dist.mul(dist).negate().mul(30.0));

    const brightness = baseBrightness.add(pulse.mul(uActive).mul(3.0));
    return uColor.mul(brightness);
  })();

  material.opacityNode = Fn(() => {
    const vUv = uv();

    // Cross-fade: smooth falloff from line center (UV.x)
    const crossDist = abs(vUv.x.sub(0.5)).mul(2.0);
    const crossFade = smoothstep(float(1.0), float(0.2), crossDist);

    // Dash mask from UV.y * dashScale (0 = solid, >0 = dashed/dotted)
    const dashPhase = fract(vUv.y.mul(uDashScale));
    // When dashScale is 0, we want full opacity (solid line).
    // smoothstep with sin gives dash/gap pattern; multiply by step so dashScale=0 means no masking.
    const dashWave = sin(dashPhase.mul(Math.PI * 2.0)).mul(0.5).add(0.5);
    // If dashScale > 0, use dashWave; if dashScale == 0, use 1.0
    const hasDash = smoothstep(float(0.0), float(0.5), uDashScale);
    const dashMask = mix(float(1.0), dashWave, hasDash);

    const baseAlpha = mix(float(0.15), float(0.8), uActive);

    return crossFade.mul(dashMask).mul(baseAlpha);
  })();

  return {
    material,
    uniforms: { uColor, uActive, uTime, uDashScale, uPulseSpeed },
  };
}
