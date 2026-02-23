import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, smoothstep, vec4,
  modelViewMatrix, cameraProjectionMatrix,
  positionGeometry, attribute, uv, Fn,
} from 'three/tsl';
import { viewport } from 'three/tsl';
import * as THREE from 'three';

export function createTraceParticlesMaterial() {
  const uOpacity = uniform(0);
  const uColor = uniform(new THREE.Color(0xff8800));

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.side = THREE.DoubleSide;

  const instancePos = attribute('instancePosition', 'vec3');
  const pointSize = float(1.8);

  // Vertex: billboarded quad positioned at CPU-computed instancePosition
  material.vertexNode = Fn(() => {
    const mvPos = modelViewMatrix.mul(vec4(instancePos, 1.0));
    const aspect = viewport.z.div(viewport.w);
    const clipPos = cameraProjectionMatrix.mul(mvPos).toVar();

    const offset = positionGeometry.xy.toVar();
    offset.mulAssign(pointSize);
    offset.assign(offset.div(viewport.z));
    offset.y.assign(offset.y.mul(aspect));
    offset.assign(offset.mul(clipPos.w));
    clipPos.addAssign(vec4(offset, 0, 0));

    return clipPos;
  })();

  // Fragment: circular gradient colored by uColor
  material.fragmentNode = Fn(() => {
    const centered = uv().mul(2).sub(1);
    const len = centered.length();
    len.greaterThan(1.0).discard();
    const c = smoothstep(1.0, 0.2, len);
    const a = c.mul(uOpacity).mul(0.7);
    return vec4(uColor.mul(a), a);
  })();

  return { material, uniforms: { uOpacity, uColor } };
}
