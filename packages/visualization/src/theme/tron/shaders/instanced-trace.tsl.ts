import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, abs, max, smoothstep, fract, exp,
  uv, Fn, attribute,
} from 'three/tsl';
import * as THREE from 'three';

export function createInstancedTraceMaterial() {
  const uFadeDistance = uniform(7.5);
  const uBorderDist = uniform(0);

  // Raw geometry vertex position (before instance matrix transform).
  // positionLocal is reassigned by InstanceNode to include the instance matrix,
  // so we read the 'position' attribute directly.
  const posGeo = attribute('position', 'vec3');

  const iColor = attribute('iColor', 'vec3');
  // iPulseData: x=pulseAlpha, y=pulseTime, z=selectPulseAlpha, w=selectPulseTime
  const iPulseData = attribute('iPulseData', 'vec4');
  const iPulseAlpha = iPulseData.x;
  const iPulseTime = iPulseData.y;
  const iSelectPulseAlpha = iPulseData.z;
  const iSelectPulseTime = iPulseData.w;

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;

  material.colorNode = Fn(() => {
    const distFromBorder = max(abs(posGeo.x), abs(posGeo.z)).sub(uBorderDist);
    const d = max(distFromBorder, 0.0);

    const pulsePhase = fract(d.mul(1.5).sub(iPulseTime.mul(2.0)));
    const pulse = exp(pulsePhase.mul(pulsePhase).negate().mul(40.0)).mul(iPulseAlpha);

    const selectPhase = fract(d.mul(0.8).sub(iSelectPulseTime.mul(1.5)));
    const selectPulse = exp(selectPhase.mul(selectPhase).negate().mul(20.0)).mul(iSelectPulseAlpha);
    const combinedPulse = max(pulse, selectPulse);

    const brightness = float(4.0).add(combinedPulse.mul(6.0));
    return iColor.mul(brightness);
  })();

  material.opacityNode = Fn(() => {
    const distFromBorder = max(abs(posGeo.x), abs(posGeo.z)).sub(uBorderDist);
    const d = max(distFromBorder, 0.0);
    const alpha = float(1.0).sub(smoothstep(0.0, uFadeDistance, d));

    const pulsePhase = fract(d.mul(1.5).sub(iPulseTime.mul(2.0)));
    const pulse = exp(pulsePhase.mul(pulsePhase).negate().mul(40.0)).mul(iPulseAlpha);

    const selectPhase = fract(d.mul(0.8).sub(iSelectPulseTime.mul(1.5)));
    const selectPulse = exp(selectPhase.mul(selectPhase).negate().mul(20.0)).mul(iSelectPulseAlpha);
    const combinedPulse = max(pulse, selectPulse);

    // Cross-section AA: hardcoded to 'y' axis (all trace borders use this orientation)
    const vuv = uv();
    const crossDist = abs(vuv.y.sub(0.5)).mul(2.0);
    const crossFade = smoothstep(1.0, 0.2, crossDist);

    return max(alpha, combinedPulse).mul(crossFade);
  })();

  return { material, uniforms: { uFadeDistance, uBorderDist } };
}
