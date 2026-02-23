import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, fract, smoothstep, vec2, vec3, vec4,
  modelViewMatrix, cameraProjectionMatrix,
  positionGeometry, attribute, uv, Fn,
} from 'three/tsl';
import { viewport } from 'three/tsl';
import * as THREE from 'three';

export function createDataStreamMaterial() {
  const uOpacity = uniform(0);
  const uTime = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.side = THREE.DoubleSide;

  const instancePos = attribute('instancePosition', 'vec3');
  const instanceSpeed = attribute('instanceSpeed', 'float');

  // Cycle position along Y, compute size and alpha from cycle
  const cycle = fract(instancePos.y.div(1.5).add(uTime.mul(instanceSpeed).mul(0.3)));
  const pointSize = float(1.0).sub(cycle).mul(3.0).add(1.0);

  // Vertex: billboarded quad
  material.vertexNode = Fn(() => {
    const animatedPos = vec3(instancePos.x, cycle.mul(1.5), instancePos.z);

    const mvPos = modelViewMatrix.mul(vec4(animatedPos, 1.0));
    const aspect = viewport.z.div(viewport.w);
    const clipPos = cameraProjectionMatrix.mul(mvPos).toVar();

    // Screen-space offset for billboarding
    const offset = positionGeometry.xy.toVar();
    offset.mulAssign(pointSize);
    offset.assign(offset.div(viewport.z));
    offset.y.assign(offset.y.mul(aspect));
    offset.assign(offset.mul(clipPos.w));
    clipPos.addAssign(vec4(offset, 0, 0));

    return clipPos;
  })();

  // Fragment: circular gradient
  material.fragmentNode = Fn(() => {
    const centered = uv().mul(2).sub(1);
    const len = centered.length();
    len.greaterThan(1.0).discard();
    const c = smoothstep(1.0, 0.3, len);
    const vAlpha = float(1.0).sub(cycle).mul(uOpacity);
    const a = c.mul(vAlpha).mul(0.6);
    return vec4(vec3(1.0, 0.6, 0.15).mul(a), a);
  })();

  return { material, uniforms: { uOpacity, uTime } };
}
