import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, float, abs, max, pow, smoothstep, mix, clamp, sin, fract, step,
  vec3, positionLocal, positionWorld, normalLocal, normalWorld, cameraPosition,
  Fn, floor,
} from 'three/tsl';
import * as THREE from 'three';

export function createFaceMaterial() {
  const uCameraPos = uniform(new THREE.Vector3());
  const uColorInner = uniform(new THREE.Color());
  const uColorEdge = uniform(new THREE.Color());
  const uTime = uniform(0);
  const uHover = uniform(0);
  const uSeparation = uniform(0);
  const uHoloFlicker = uniform(0);
  const uDataOverlay = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  // Vertex displacement: push faces outward along their normal
  material.positionNode = positionLocal.add(normalLocal.mul(uSeparation));

  const fragmentColor = Fn(() => {
    const vUv = uv();
    const viewDir = cameraPosition.sub(positionWorld).normalize();
    const facing = abs(viewDir.dot(normalWorld));
    const fresnel = pow(float(1.0).sub(facing), 1.5);

    // Edge detection from UV
    const edgeDist = abs(vUv.sub(0.5)).mul(2.0);
    const edgeFactor = smoothstep(0.7, 1.0, max(edgeDist.x, edgeDist.y));

    // Base color
    const col = mix(uColorInner, uColorEdge, fresnel.mul(0.6).add(edgeFactor.mul(0.4))).toVar();
    col.assign(mix(col, uColorEdge, uHover.mul(0.3)));

    // Top face boost
    const topBoost = smoothstep(0.3, 1.0, normalWorld.y).mul(0.2);
    col.assign(mix(col, uColorEdge, topBoost));

    // Holographic flicker
    const scanline = smoothstep(0.4, 0.5, fract(positionWorld.y.mul(30.0).add(uTime.mul(2.0)))).mul(0.3);
    const flicker = step(0.97, fract(sin(uTime.mul(43.0)).mul(4375.5453))).mul(0.4);
    col.assign(mix(col, vec3(0.7, 0.9, 1.0), scanline.mul(0.3).add(flicker.mul(0.2)).mul(uHoloFlicker)));

    // Data overlay grid
    const gridX = smoothstep(0.9, 0.95, fract(vUv.x.mul(8.0)));
    const gridY = smoothstep(0.9, 0.95, fract(vUv.y.mul(8.0)));
    const grid = max(gridX, gridY);
    const scrollData = step(0.6, fract(sin(
      floor(vUv.x.mul(8.0)).mul(17.0).add(floor(vUv.y.mul(8.0).sub(uTime.mul(1.5))).mul(31.0))
    ).mul(43758.5453)));
    const overlay = grid.mul(0.4).add(scrollData.mul(0.15)).mul(uDataOverlay);
    col.assign(mix(col, vec3(1.0, 0.7, 0.2), overlay));

    return col;
  });

  const fragmentAlpha = Fn(() => {
    const vUv = uv();
    const viewDir = cameraPosition.sub(positionWorld).normalize();
    const facing = abs(viewDir.dot(normalWorld));
    const fresnel = pow(float(1.0).sub(facing), 1.5);

    const edgeDist = abs(vUv.sub(0.5)).mul(2.0);
    const edgeFactor = smoothstep(0.7, 1.0, max(edgeDist.x, edgeDist.y));

    const baseAlpha = float(0.15).add(fresnel.mul(0.45)).add(edgeFactor.mul(0.5)).add(uHover.mul(0.2)).toVar();

    // Top face boost
    const topBoost = smoothstep(0.3, 1.0, normalWorld.y).mul(0.2);
    baseAlpha.addAssign(topBoost);

    // Breathing pulse
    baseAlpha.mulAssign(float(0.95).add(float(0.05).mul(sin(uTime.mul(1.5)))));

    // Holographic flicker alpha
    const scanline = smoothstep(0.4, 0.5, fract(positionWorld.y.mul(30.0).add(uTime.mul(2.0)))).mul(0.3);
    const flicker = step(0.97, fract(sin(uTime.mul(43.0)).mul(4375.5453))).mul(0.4);
    baseAlpha.addAssign(scanline.add(flicker).mul(uHoloFlicker));

    // Data overlay alpha
    const gridX = smoothstep(0.9, 0.95, fract(vUv.x.mul(8.0)));
    const gridY = smoothstep(0.9, 0.95, fract(vUv.y.mul(8.0)));
    const grid = max(gridX, gridY);
    const scrollData = step(0.6, fract(sin(
      floor(vUv.x.mul(8.0)).mul(17.0).add(floor(vUv.y.mul(8.0).sub(uTime.mul(1.5))).mul(31.0))
    ).mul(43758.5453)));
    const overlay = grid.mul(0.4).add(scrollData.mul(0.15)).mul(uDataOverlay);
    baseAlpha.addAssign(overlay.mul(0.3));

    const maxAlpha = float(0.85).add(uHover.mul(0.15));
    return clamp(baseAlpha, 0.0, maxAlpha);
  });

  material.colorNode = fragmentColor();
  material.opacityNode = fragmentAlpha();

  return {
    material,
    uniforms: { uCameraPos, uColorInner, uColorEdge, uTime, uHover, uSeparation, uHoloFlicker, uDataOverlay },
  };
}
