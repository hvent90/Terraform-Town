import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, abs, max, smoothstep, fract, exp,
  positionWorld, uv, Fn,
} from 'three/tsl';
import * as THREE from 'three';

/**
 * @param crossAxis Which UV axis runs across the thin dimension of the plane.
 *   'x' → planeGeometry args=[thinWidth, length] (axial lines)
 *   'y' → planeGeometry args=[length, thinWidth] (border lines)
 */
export function createTraceMaterial(crossAxis: 'x' | 'y' = 'x') {
  const uColor = uniform(new THREE.Color());
  const uFadeDistance = uniform(7.5);
  const uBorderDist = uniform(0);
  const uPulseAlpha = uniform(0);
  const uPulseTime = uniform(0);
  const uSelectPulseAlpha = uniform(0);
  const uSelectPulseTime = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;

  const shader = Fn(() => {
    const distFromBorder = max(abs(positionWorld.x), abs(positionWorld.z)).sub(uBorderDist);
    const d = max(distFromBorder, 0.0);

    // Pulse effect
    const pulsePhase = fract(d.mul(1.5).sub(uPulseTime.mul(2.0)));
    const pulse = exp(pulsePhase.mul(pulsePhase).negate().mul(40.0)).mul(uPulseAlpha);

    // Select pulse effect
    const selectPhase = fract(d.mul(0.8).sub(uSelectPulseTime.mul(1.5)));
    const selectPulse = exp(selectPhase.mul(selectPhase).negate().mul(20.0)).mul(uSelectPulseAlpha);
    const combinedPulse = max(pulse, selectPulse);

    const brightness = float(4.0).add(combinedPulse.mul(6.0));
    return uColor.mul(brightness);
  });

  material.colorNode = shader();

  material.opacityNode = Fn(() => {
    const distFromBorder = max(abs(positionWorld.x), abs(positionWorld.z)).sub(uBorderDist);
    const d = max(distFromBorder, 0.0);
    const alpha = float(1.0).sub(smoothstep(0.0, uFadeDistance, d));

    const pulsePhase = fract(d.mul(1.5).sub(uPulseTime.mul(2.0)));
    const pulse = exp(pulsePhase.mul(pulsePhase).negate().mul(40.0)).mul(uPulseAlpha);

    const selectPhase = fract(d.mul(0.8).sub(uSelectPulseTime.mul(1.5)));
    const selectPulse = exp(selectPhase.mul(selectPhase).negate().mul(20.0)).mul(uSelectPulseAlpha);
    const combinedPulse = max(pulse, selectPulse);

    // Cross-section AA: smooth falloff from bright center to transparent edges
    const vuv = uv();
    const crossCoord = crossAxis === 'x' ? vuv.x : vuv.y;
    const crossDist = abs(crossCoord.sub(0.5)).mul(2.0); // 0 at center, 1 at edge
    const crossFade = smoothstep(1.0, 0.2, crossDist);

    return max(alpha, combinedPulse).mul(crossFade);
  })();

  return {
    material,
    uniforms: { uColor, uFadeDistance, uBorderDist, uPulseAlpha, uPulseTime, uSelectPulseAlpha, uSelectPulseTime },
  };
}
