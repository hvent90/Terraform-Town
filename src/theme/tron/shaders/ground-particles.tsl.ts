import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, sin, smoothstep, vec2, vec3, vec4,
  modelViewMatrix, cameraProjectionMatrix,
  positionGeometry, attribute, uv, Fn,
} from 'three/tsl';
import { viewport } from 'three/tsl';
import * as THREE from 'three';

export function createGroundParticlesMaterial() {
  const uColor = uniform(new THREE.Color());
  const uTime = uniform(0);
  const uZoom = uniform(80.0);
  const uHover = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.side = THREE.DoubleSide;

  const instancePos = attribute('instancePosition', 'vec3');
  const instanceSize = attribute('instanceSize', 'float');
  const instanceAlpha = attribute('instanceAlpha', 'float');

  // Vertex: billboarded quad with hover compression + wave
  material.vertexNode = Fn(() => {
    const dist = vec2(instancePos.x, instancePos.z).length();
    const compressScale = float(1.0).sub(uHover.mul(0.4));
    const newX = instancePos.x.mul(compressScale);
    const newZ = instancePos.z.mul(compressScale);
    const newY = instancePos.y
      .add(sin(uTime.mul(1.5).add(dist.mul(4.0))).mul(0.002))
      .add(uHover.mul(0.03).mul(sin(uTime.mul(3.0).add(dist.mul(6.0)))));
    const animatedPos = vec3(newX, newY, newZ);

    const mvPos = modelViewMatrix.mul(vec4(animatedPos, 1.0));
    const aspect = viewport.z.div(viewport.w);
    const clipPos = cameraProjectionMatrix.mul(mvPos).toVar();

    // Screen-space offset for billboarding
    const pointSize = instanceSize.mul(uZoom).mul(0.04);
    const offset = positionGeometry.xy.toVar();
    offset.mulAssign(pointSize);
    offset.assign(offset.div(viewport.z));
    offset.y.assign(offset.y.mul(aspect));
    offset.assign(offset.mul(clipPos.w));
    clipPos.addAssign(vec4(offset, 0, 0));

    return clipPos;
  })();

  // Fragment: circular gradient with per-instance alpha
  material.fragmentNode = Fn(() => {
    const centered = uv().mul(2).sub(1);
    const len = centered.length();
    len.greaterThan(1.0).discard();
    const c = smoothstep(1.0, 0.2, len);
    const a = c.mul(instanceAlpha);
    return vec4(uColor.mul(a), a);
  })();

  return { material, uniforms: { uColor, uTime, uZoom, uHover } };
}
