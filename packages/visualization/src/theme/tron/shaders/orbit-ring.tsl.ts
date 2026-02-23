import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, float, fract, smoothstep, vec3, Fn,
} from 'three/tsl';
import * as THREE from 'three';

export function createOrbitRingMaterial() {
  const uOpacity = uniform(0);
  const uTime = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;
  material.blending = THREE.AdditiveBlending;

  const ringColor = vec3(1.0, 0.55, 0.1).mul(2.0);

  material.colorNode = ringColor;

  material.opacityNode = Fn(() => {
    const vUv = uv();
    const dash = smoothstep(0.4, 0.5, fract(vUv.x.mul(20.0).sub(uTime.mul(0.5))));
    return dash.mul(uOpacity).mul(0.8);
  })();

  return { material, uniforms: { uOpacity, uTime } };
}
