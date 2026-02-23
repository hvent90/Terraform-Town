import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, vec2, float, abs, max, exp, pow, mix, Fn, color,
} from 'three/tsl';
import * as THREE from 'three';

export function createGroundLightPoolMaterial() {
  const uColor = uniform(new THREE.Color());
  const uColorBright = uniform(new THREE.Color());

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;

  const fragmentShader = Fn(() => {
    const vUv = uv();
    const c = vUv.sub(0.5).mul(2.0);
    const r = c.length();
    const world = c.mul(8.0);
    const boxDist = max(abs(world.x), abs(world.y));
    const coreGlow = exp(pow(max(boxDist.sub(0.3), 0.0), 2.0).negate().mul(120.0)).mul(0.3);
    const outerGlow = exp(r.mul(r).negate().mul(18.0)).mul(0.06);
    const intensity = coreGlow.add(outerGlow);
    const col = mix(uColor, uColorBright, coreGlow.div(max(intensity, 0.001)));
    return col;
  });

  material.colorNode = fragmentShader();
  material.opacityNode = Fn(() => {
    const vUv = uv();
    const c = vUv.sub(0.5).mul(2.0);
    const r = c.length();
    const world = c.mul(8.0);
    const boxDist = max(abs(world.x), abs(world.y));
    const coreGlow = exp(pow(max(boxDist.sub(0.3), 0.0), 2.0).negate().mul(120.0)).mul(0.3);
    const outerGlow = exp(r.mul(r).negate().mul(18.0)).mul(0.06);
    return coreGlow.add(outerGlow);
  })();

  return { material, uniforms: { uColor, uColorBright } };
}
