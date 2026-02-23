import { LineBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, smoothstep, mix, min, vec3,
  positionWorld, Fn,
} from 'three/tsl';
import * as THREE from 'three';

export function createEdgeMaterial() {
  const uColorBot = uniform(new THREE.Color());
  const uColorTop = uniform(new THREE.Color());
  const uCubeY = uniform(0);
  const uCubeSize = uniform(0);
  const uHover = uniform(0);
  const uEdgeIntensify = uniform(0);

  const material = new LineBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;

  const shader = Fn(() => {
    const vHeight = positionWorld.y.sub(uCubeY.sub(uCubeSize.mul(0.5))).div(uCubeSize);
    const col = mix(uColorBot, uColorTop, smoothstep(0.0, 1.0, vHeight));
    const boosted = col.mul(float(1.0).add(uEdgeIntensify.mul(4.0))).add(vec3(1.0, 0.7, 0.3).mul(uEdgeIntensify.mul(1.5)));
    return boosted;
  });

  material.colorNode = shader();

  material.opacityNode = Fn(() => {
    const vHeight = positionWorld.y.sub(uCubeY.sub(uCubeSize.mul(0.5))).div(uCubeSize);
    const alpha = float(0.6).add(vHeight.mul(0.4));
    const alphaHover = alpha.add(uHover.mul(float(1.0).sub(alpha)));
    return min(alphaHover.add(uEdgeIntensify.mul(0.6)).add(uEdgeIntensify.mul(0.4)), 1.0);
  })();

  return {
    material,
    uniforms: { uColorBot, uColorTop, uCubeY, uCubeSize, uHover, uEdgeIntensify },
  };
}
