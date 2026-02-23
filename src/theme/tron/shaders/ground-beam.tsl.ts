import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, float, abs, pow, sin, vec3, Fn,
} from 'three/tsl';
import * as THREE from 'three';

export function createGroundBeamMaterial() {
  const uOpacity = uniform(0);
  const uTime = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.FrontSide;

  const beamColor = vec3(1.0, 0.55, 0.1).mul(3.0);

  material.colorNode = beamColor;

  material.opacityNode = Fn(() => {
    const vUv = uv();
    const centerFade = float(1.0).sub(pow(abs(vUv.x.sub(0.5)).mul(2.0), 2.0));
    const heightFade = pow(float(1.0).sub(vUv.y), 1.5);
    const pulse = float(0.8).add(float(0.2).mul(sin(uTime.mul(2.0).add(vUv.y.mul(8.0)))));
    return centerFade.mul(heightFade).mul(pulse).mul(uOpacity).mul(0.5);
  })();

  return { material, uniforms: { uOpacity, uTime } };
}
