import { LineBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, smoothstep, mix, min, vec3,
  positionWorld, Fn, attribute,
} from 'three/tsl';

export function createInstancedEdgeMaterial() {
  const uCubeY = uniform(0);
  const uCubeSize = uniform(0);

  // Per-instance attributes (replace per-resource uniforms)
  const iColorBot = attribute('iColorBot', 'vec3');
  const iHover = attribute('iHover', 'float');
  const iEdgeIntensify = attribute('iEdgeIntensify', 'float');

  const material = new LineBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;

  // uColorTop is never set in CubeMesh — defaults to black (0,0,0).
  // Hardcode it here since it's constant across all instances.
  const colorTop = vec3(0.0, 0.0, 0.0);

  material.colorNode = Fn(() => {
    const vHeight = positionWorld.y.sub(uCubeY.sub(uCubeSize.mul(0.5))).div(uCubeSize);
    const col = mix(iColorBot, colorTop, smoothstep(0.0, 1.0, vHeight));
    const boosted = col.mul(float(1.0).add(iEdgeIntensify.mul(4.0)))
      .add(vec3(1.0, 0.7, 0.3).mul(iEdgeIntensify.mul(1.5)));
    return boosted;
  })();

  material.opacityNode = Fn(() => {
    const vHeight = positionWorld.y.sub(uCubeY.sub(uCubeSize.mul(0.5))).div(uCubeSize);
    const alpha = float(0.6).add(vHeight.mul(0.4));
    const alphaHover = alpha.add(iHover.mul(float(1.0).sub(alpha)));
    return min(alphaHover.add(iEdgeIntensify.mul(0.6)).add(iEdgeIntensify.mul(0.4)), 1.0);
  })();

  return { material, uniforms: { uCubeY, uCubeSize } };
}
