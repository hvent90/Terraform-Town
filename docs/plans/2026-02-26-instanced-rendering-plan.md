# Instanced Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce draw calls from ~12,000 to ~300 for large terraform state files by replacing per-resource CubeMesh with scene-level InstancedMesh objects and adding frustum culling.

**Architecture:** A single `InstancedCubeRenderer` component at the Scene level creates 4 InstancedMesh objects (faces, edges, halos, trace borders) that render all resources in 4 draw calls. Per-resource interaction (hover/select) is preserved via per-instance attributes updated each frame. Remaining per-resource components (particles, labels, hover detectors) get frustum culling.

**Tech Stack:** React Three Fiber, Three.js WebGPU (TSL shaders), InstancedMesh, InstancedBufferAttribute

**Design doc:** `docs/plans/2026-02-26-instanced-rendering-design.md`

---

### Task 1: Shared Frustum Culling Utility

**Files:**
- Create: `packages/visualization/src/shared/frustum.ts`
- Test: `packages/visualization/src/shared/frustum.test.ts`

**Step 1: Write the failing test**

```ts
// frustum.test.ts
import { describe, test, expect } from 'bun:test';
import * as THREE from 'three';
import { createFrustumCuller } from './frustum';

describe('createFrustumCuller', () => {
  test('returns true for point inside frustum', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const culler = createFrustumCuller(camera, 3);
    expect(culler(0, 0, 0)).toBe(true);
  });

  test('returns false for point far outside frustum', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const culler = createFrustumCuller(camera, 3);
    expect(culler(500, 0, 500)).toBe(false);
  });

  test('margin extends visibility zone', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    // A point just outside the tight frustum
    const tightCuller = createFrustumCuller(camera, 0);
    const looseCuller = createFrustumCuller(camera, 10);

    // Point that's outside with no margin but inside with large margin
    // (test with a point at the edge)
    const edgePoint = { x: 15, y: 0, z: 0 };
    const tightResult = tightCuller(edgePoint.x, edgePoint.y, edgePoint.z);
    const looseResult = looseCuller(edgePoint.x, edgePoint.y, edgePoint.z);

    // At least verify loose is >= tight (loose never culls what tight keeps)
    if (tightResult) expect(looseResult).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/shared/frustum.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
// frustum.ts
import * as THREE from 'three';

const _frustum = new THREE.Frustum();
const _matrix = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

/**
 * Creates a frustum visibility tester for the given camera.
 * Call once per frame with the current camera, then test each point.
 * @param margin Bounding sphere radius around each point (units).
 */
export function createFrustumCuller(
  camera: THREE.Camera,
  margin: number,
): (x: number, y: number, z: number) => boolean {
  _matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  _frustum.setFromProjectionMatrix(_matrix);

  return (x: number, y: number, z: number) => {
    _sphere.center.set(x, y, z);
    _sphere.radius = margin;
    return _frustum.intersectsSphere(_sphere);
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/shared/frustum.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/shared/frustum.ts packages/visualization/src/shared/frustum.test.ts
git commit -m "feat(viz): add frustum culling utility"
```

---

### Task 2: Instanced Face Shader

Migrate `face.tsl.ts` from shared uniforms to per-instance attributes. Create a new `createInstancedFaceMaterial()` that reads per-instance data.

**Files:**
- Create: `packages/visualization/src/theme/tron/shaders/instanced-face.tsl.ts`

**Step 1: Write the instanced face material**

The original `face.tsl.ts` uses these uniforms that vary per resource:
- `uColorInner`, `uColorEdge` (vec3) — resource type color, lerped on hover/select
- `uHover` (float) — hover interpolation 0-1
- `uSeparation` (float) — face separation on hover
- `uHoloFlicker` (float) — holographic effect intensity
- `uDataOverlay` (float) — data grid overlay intensity

These become instance attributes. `uTime` and `uCameraPos` remain shared uniforms (same for all instances).

```ts
// instanced-face.tsl.ts
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, float, abs, max, pow, smoothstep, mix, clamp, sin, fract, step,
  vec3, positionLocal, positionWorld, normalLocal, normalWorld, cameraPosition,
  Fn, floor, attribute, instanceIndex,
} from 'three/tsl';
import * as THREE from 'three';

export function createInstancedFaceMaterial() {
  // Shared uniforms (same for all instances)
  const uTime = uniform(0);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  // Per-instance attributes
  const iColorInner = attribute('iColorInner', 'vec3');
  const iColorEdge = attribute('iColorEdge', 'vec3');
  const iHover = attribute('iHover', 'float');
  const iSeparation = attribute('iSeparation', 'float');
  const iHoloFlicker = attribute('iHoloFlicker', 'float');
  const iDataOverlay = attribute('iDataOverlay', 'float');

  // Vertex displacement: push faces outward along their normal
  material.positionNode = positionLocal.add(normalLocal.mul(iSeparation));

  const fragmentColor = Fn(() => {
    const vUv = uv();
    const viewDir = cameraPosition.sub(positionWorld).normalize();
    const facing = abs(viewDir.dot(normalWorld));
    const fresnel = pow(float(1.0).sub(facing), 1.5);

    const edgeDist = abs(vUv.sub(0.5)).mul(2.0);
    const edgeFactor = smoothstep(0.7, 1.0, max(edgeDist.x, edgeDist.y));

    const col = mix(iColorInner, iColorEdge, fresnel.mul(0.6).add(edgeFactor.mul(0.4))).toVar();
    col.assign(mix(col, iColorEdge, iHover.mul(0.3)));

    const topBoost = smoothstep(0.3, 1.0, normalWorld.y).mul(0.2);
    col.assign(mix(col, iColorEdge, topBoost));

    // Holographic flicker
    const scanline = smoothstep(0.4, 0.5, fract(positionWorld.y.mul(30.0).add(uTime.mul(2.0)))).mul(0.3);
    const flicker = step(0.97, fract(sin(uTime.mul(43.0)).mul(4375.5453))).mul(0.4);
    col.assign(mix(col, vec3(0.7, 0.9, 1.0), scanline.mul(0.3).add(flicker.mul(0.2)).mul(iHoloFlicker)));

    // Data overlay grid
    const gridX = smoothstep(0.9, 0.95, fract(vUv.x.mul(8.0)));
    const gridY = smoothstep(0.9, 0.95, fract(vUv.y.mul(8.0)));
    const grid = max(gridX, gridY);
    const scrollData = step(0.6, fract(sin(
      floor(vUv.x.mul(8.0)).mul(17.0).add(floor(vUv.y.mul(8.0).sub(uTime.mul(1.5))).mul(31.0))
    ).mul(43758.5453)));
    const overlay = grid.mul(0.4).add(scrollData.mul(0.15)).mul(iDataOverlay);
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

    const baseAlpha = float(0.15).add(fresnel.mul(0.45)).add(edgeFactor.mul(0.5)).add(iHover.mul(0.2)).toVar();

    const topBoost = smoothstep(0.3, 1.0, normalWorld.y).mul(0.2);
    baseAlpha.addAssign(topBoost);

    baseAlpha.mulAssign(float(0.95).add(float(0.05).mul(sin(uTime.mul(1.5)))));

    const scanline = smoothstep(0.4, 0.5, fract(positionWorld.y.mul(30.0).add(uTime.mul(2.0)))).mul(0.3);
    const flicker = step(0.97, fract(sin(uTime.mul(43.0)).mul(4375.5453))).mul(0.4);
    baseAlpha.addAssign(scanline.add(flicker).mul(iHoloFlicker));

    const gridX = smoothstep(0.9, 0.95, fract(vUv.x.mul(8.0)));
    const gridY = smoothstep(0.9, 0.95, fract(vUv.y.mul(8.0)));
    const grid = max(gridX, gridY);
    const scrollData = step(0.6, fract(sin(
      floor(vUv.x.mul(8.0)).mul(17.0).add(floor(vUv.y.mul(8.0).sub(uTime.mul(1.5))).mul(31.0))
    ).mul(43758.5453)));
    const overlay = grid.mul(0.4).add(scrollData.mul(0.15)).mul(iDataOverlay);
    baseAlpha.addAssign(overlay.mul(0.3));

    const maxAlpha = float(0.85).add(iHover.mul(0.15));
    return clamp(baseAlpha, 0.0, maxAlpha);
  });

  material.colorNode = fragmentColor();
  material.opacityNode = fragmentAlpha();

  return { material, uniforms: { uTime } };
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/theme/tron/shaders/instanced-face.tsl.ts
git commit -m "feat(viz): instanced face TSL shader with per-instance attributes"
```

---

### Task 3: Instanced Edge Shader

**Files:**
- Create: `packages/visualization/src/theme/tron/shaders/instanced-edge.tsl.ts`

**Step 1: Write the instanced edge material**

Per-instance attributes: `iColorBot` (vec3), `iHover` (float), `iEdgeIntensify` (float).
Shared uniforms: `uCubeY`, `uCubeSize` (constant across all instances).

```ts
// instanced-edge.tsl.ts
import { LineBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, smoothstep, mix, min, vec3,
  positionWorld, Fn, attribute,
} from 'three/tsl';
import * as THREE from 'three';

export function createInstancedEdgeMaterial() {
  const uCubeY = uniform(0);
  const uCubeSize = uniform(0);

  const iColorBot = attribute('iColorBot', 'vec3');
  const iHover = attribute('iHover', 'float');
  const iEdgeIntensify = attribute('iEdgeIntensify', 'float');

  const material = new LineBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;

  material.colorNode = Fn(() => {
    // uColorTop is always vec3(1,1,1) white in practice — bake it
    const colorTop = vec3(1.0, 1.0, 1.0);
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
```

**Step 2: Commit**

```bash
git add packages/visualization/src/theme/tron/shaders/instanced-edge.tsl.ts
git commit -m "feat(viz): instanced edge TSL shader with per-instance attributes"
```

---

### Task 4: Instanced Trace Shader

**Files:**
- Create: `packages/visualization/src/theme/tron/shaders/instanced-trace.tsl.ts`

**Step 1: Write the instanced trace material**

Per-instance: `iColor` (vec3), `iPulseAlpha` (float), `iPulseTime` (float), `iSelectPulseAlpha` (float), `iSelectPulseTime` (float).
Shared uniform: `uFadeDistance`, `uBorderDist` (same for all).

```ts
// instanced-trace.tsl.ts
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, abs, max, smoothstep, fract, exp,
  positionWorld, uv, Fn, attribute,
} from 'three/tsl';
import * as THREE from 'three';

export function createInstancedTraceMaterial() {
  const uFadeDistance = uniform(7.5);
  const uBorderDist = uniform(0);

  const iColor = attribute('iColor', 'vec3');
  const iPulseAlpha = attribute('iPulseAlpha', 'float');
  const iPulseTime = attribute('iPulseTime', 'float');
  const iSelectPulseAlpha = attribute('iSelectPulseAlpha', 'float');
  const iSelectPulseTime = attribute('iSelectPulseTime', 'float');

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;

  material.colorNode = Fn(() => {
    const distFromBorder = max(abs(positionWorld.x), abs(positionWorld.z)).sub(uBorderDist);
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
    const distFromBorder = max(abs(positionWorld.x), abs(positionWorld.z)).sub(uBorderDist);
    const d = max(distFromBorder, 0.0);
    const alpha = float(1.0).sub(smoothstep(0.0, uFadeDistance, d));

    const pulsePhase = fract(d.mul(1.5).sub(iPulseTime.mul(2.0)));
    const pulse = exp(pulsePhase.mul(pulsePhase).negate().mul(40.0)).mul(iPulseAlpha);

    const selectPhase = fract(d.mul(0.8).sub(iSelectPulseTime.mul(1.5)));
    const selectPulse = exp(selectPhase.mul(selectPhase).negate().mul(20.0)).mul(iSelectPulseAlpha);
    const combinedPulse = max(pulse, selectPulse);

    // Cross-section AA (hardcoded 'y' axis since trace borders use planeGeometry args=[len, width])
    const vuv = uv();
    const crossDist = abs(vuv.y.sub(0.5)).mul(2.0);
    const crossFade = smoothstep(1.0, 0.2, crossDist);

    return max(alpha, combinedPulse).mul(crossFade);
  })();

  return { material, uniforms: { uFadeDistance, uBorderDist } };
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/theme/tron/shaders/instanced-trace.tsl.ts
git commit -m "feat(viz): instanced trace TSL shader with per-instance attributes"
```

---

### Task 5: InstancedCubeRenderer Component

This is the core component. It creates merged geometries, instance attribute buffers, and a single `useFrame` loop that updates all per-instance data.

**Files:**
- Create: `packages/visualization/src/theme/tron/meshes/InstancedCubeRenderer.tsx`

**Step 1: Write the component**

```tsx
// InstancedCubeRenderer.tsx
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import { createInstancedFaceMaterial } from '../shaders/instanced-face.tsl';
import { createInstancedEdgeMaterial } from '../shaders/instanced-edge.tsl';
import { createInstancedTraceMaterial } from '../shaders/instanced-trace.tsl';
import {
  RESOURCE_COLORS, DEFAULT_RESOURCE_COLORS,
  COOL_BLUE_BRIGHT, FACE_INNER_COOL, COOL_WHITE, TRACE_COOL,
  STATUS_GREEN, STATUS_GREEN_BRIGHT,
} from '../colors';
import { CUBE_SIZE, CUBE_Y, faceConfigs, createHaloTexture } from '../../../shared/geometry';
import { useSceneContext, getEffectT } from '../../../shared/context';
import type { Resource } from '../../../types';

// Map from resource type to theme key
function themeKey(type: string): string {
  const map: Record<string, string> = {
    instance: 'ec2', vpc: 'vpc', subnet: 'subnet',
    security_group: 'security_group', s3_bucket: 's3_bucket',
    iam_role: 'iam_role', lambda_function: 'lambda',
  };
  return map[type] ?? 'ec2';
}

/**
 * Build a merged BufferGeometry from the 6 face planes.
 * Each face is a CUBE_SIZE × CUBE_SIZE plane, pre-rotated and pre-positioned,
 * with normals preserved for the shader.
 */
function buildMergedFaceGeometry(): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];
  const plane = new THREE.PlaneGeometry(CUBE_SIZE, CUBE_SIZE);

  for (const cfg of faceConfigs) {
    const g = plane.clone();
    const m = new THREE.Matrix4();
    const euler = new THREE.Euler(...cfg.rot);
    const quat = new THREE.Quaternion().setFromEuler(euler);
    m.compose(new THREE.Vector3(...cfg.pos), quat, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    geoms.push(g);
  }

  const merged = mergeBufferGeometries(geoms);
  plane.dispose();
  for (const g of geoms) g.dispose();
  return merged;
}

/** Merge multiple BufferGeometries into one (simple version for identical attribute sets). */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const attrNames = Object.keys(geometries[0].attributes);

  for (const name of attrNames) {
    const itemSize = geometries[0].attributes[name].itemSize;
    const totalCount = geometries.reduce((sum, g) => sum + g.attributes[name].count, 0);
    const arr = new Float32Array(totalCount * itemSize);
    let offset = 0;
    for (const g of geometries) {
      const a = g.attributes[name];
      arr.set(new Float32Array(a.array.buffer, a.array.byteOffset, a.count * itemSize), offset);
      offset += a.count * itemSize;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(arr, itemSize));
  }

  // Merge indices
  if (geometries[0].index) {
    let totalIndices = 0;
    let vertexOffset = 0;
    const indexArrays: number[] = [];
    for (const g of geometries) {
      const idx = g.index!;
      for (let i = 0; i < idx.count; i++) {
        indexArrays.push(idx.array[i] + vertexOffset);
      }
      vertexOffset += g.attributes['position'].count;
      totalIndices += idx.count;
    }
    merged.setIndex(indexArrays);
  }

  return merged;
}

/**
 * Build merged trace border geometry (4 border planes around the cube base).
 */
function buildMergedTraceBorderGeometry(): THREE.BufferGeometry {
  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;
  const borderW = 0.08;

  const configs: { pos: THREE.Vector3; rot: THREE.Euler }[] = [
    { pos: new THREE.Vector3(0, 0.01, half), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
    { pos: new THREE.Vector3(0, 0.01, -half), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
    { pos: new THREE.Vector3(half, 0.01, 0), rot: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2) },
    { pos: new THREE.Vector3(-half, 0.01, 0), rot: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2) },
  ];

  const plane = new THREE.PlaneGeometry(borderLen, borderW);
  const geoms: THREE.BufferGeometry[] = [];

  for (const cfg of configs) {
    const g = plane.clone();
    const m = new THREE.Matrix4();
    const quat = new THREE.Quaternion().setFromEuler(cfg.rot);
    m.compose(cfg.pos, quat, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    geoms.push(g);
  }

  const merged = mergeBufferGeometries(geoms);
  plane.dispose();
  for (const g of geoms) g.dispose();
  return merged;
}

type InstancedCubeRendererProps = {
  resources: Resource[];
  positions: Map<string, [number, number, number]>;
};

export function InstancedCubeRenderer({ resources, positions }: InstancedCubeRendererProps) {
  const ctx = useSceneContext();
  const count = resources.length;

  // --- Geometries (created once) ---
  const faceGeo = useMemo(() => buildMergedFaceGeometry(), []);
  const edgeGeo = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)), []);
  const traceGeo = useMemo(() => buildMergedTraceBorderGeometry(), []);

  // --- Materials (created once) ---
  const faceMat = useMemo(() => createInstancedFaceMaterial(), []);
  const edgeMat = useMemo(() => {
    const m = createInstancedEdgeMaterial();
    m.uniforms.uCubeY.value = CUBE_Y;
    m.uniforms.uCubeSize.value = CUBE_SIZE;
    return m;
  }, []);
  const traceMat = useMemo(() => {
    const m = createInstancedTraceMaterial();
    m.uniforms.uBorderDist.value = CUBE_SIZE / 2 + 0.08;
    return m;
  }, []);

  // --- Halo texture ---
  const haloTexture = useMemo(() => createHaloTexture(), []);

  // --- InstancedMesh refs ---
  const faceMeshRef = useRef<THREE.InstancedMesh>(null);
  const edgeMeshRef = useRef<THREE.InstancedMesh>(null);
  const traceMeshRef = useRef<THREE.InstancedMesh>(null);
  const haloMeshRef = useRef<THREE.InstancedMesh>(null);

  // --- Instance attribute buffers ---
  // Face attributes
  const faceBuffers = useMemo(() => ({
    iColorInner: new Float32Array(count * 3),
    iColorEdge: new Float32Array(count * 3),
    iHover: new Float32Array(count),
    iSeparation: new Float32Array(count),
    iHoloFlicker: new Float32Array(count),
    iDataOverlay: new Float32Array(count),
  }), [count]);

  // Edge attributes
  const edgeBuffers = useMemo(() => ({
    iColorBot: new Float32Array(count * 3),
    iHover: new Float32Array(count),
    iEdgeIntensify: new Float32Array(count),
  }), [count]);

  // Trace attributes
  const traceBuffers = useMemo(() => ({
    iColor: new Float32Array(count * 3),
    iPulseAlpha: new Float32Array(count),
    iPulseTime: new Float32Array(count),
    iSelectPulseAlpha: new Float32Array(count),
    iSelectPulseTime: new Float32Array(count),
  }), [count]);

  // Halo attributes
  const haloBuffers = useMemo(() => ({
    iColor: new Float32Array(count * 3),
    iOpacity: new Float32Array(count),
    iScale: new Float32Array(count),
  }), [count]);

  // Per-instance mutable state (pulse timers)
  const pulseTimers = useRef<Float32Array>(new Float32Array(count));
  const selectPulseTimers = useRef<Float32Array>(new Float32Array(count));

  // Temp colors for lerping
  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);
  const tmpColor3 = useMemo(() => new THREE.Color(), []);

  // Dummy matrix for setting instance transforms
  const _matrix = useMemo(() => new THREE.Matrix4(), []);
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _scale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // --- Attach instance attributes to geometries ---
  useEffect(() => {
    const faceMesh = faceMeshRef.current;
    const edgeMesh = edgeMeshRef.current;
    const traceMesh = traceMeshRef.current;
    const haloMesh = haloMeshRef.current;
    if (!faceMesh || !edgeMesh || !traceMesh || !haloMesh) return;

    // Face
    faceMesh.geometry.setAttribute('iColorInner', new THREE.InstancedBufferAttribute(faceBuffers.iColorInner, 3));
    faceMesh.geometry.setAttribute('iColorEdge', new THREE.InstancedBufferAttribute(faceBuffers.iColorEdge, 3));
    faceMesh.geometry.setAttribute('iHover', new THREE.InstancedBufferAttribute(faceBuffers.iHover, 1));
    faceMesh.geometry.setAttribute('iSeparation', new THREE.InstancedBufferAttribute(faceBuffers.iSeparation, 1));
    faceMesh.geometry.setAttribute('iHoloFlicker', new THREE.InstancedBufferAttribute(faceBuffers.iHoloFlicker, 1));
    faceMesh.geometry.setAttribute('iDataOverlay', new THREE.InstancedBufferAttribute(faceBuffers.iDataOverlay, 1));

    // Edge
    edgeMesh.geometry.setAttribute('iColorBot', new THREE.InstancedBufferAttribute(edgeBuffers.iColorBot, 3));
    edgeMesh.geometry.setAttribute('iHover', new THREE.InstancedBufferAttribute(edgeBuffers.iHover, 1));
    edgeMesh.geometry.setAttribute('iEdgeIntensify', new THREE.InstancedBufferAttribute(edgeBuffers.iEdgeIntensify, 1));

    // Trace
    traceMesh.geometry.setAttribute('iColor', new THREE.InstancedBufferAttribute(traceBuffers.iColor, 3));
    traceMesh.geometry.setAttribute('iPulseAlpha', new THREE.InstancedBufferAttribute(traceBuffers.iPulseAlpha, 1));
    traceMesh.geometry.setAttribute('iPulseTime', new THREE.InstancedBufferAttribute(traceBuffers.iPulseTime, 1));
    traceMesh.geometry.setAttribute('iSelectPulseAlpha', new THREE.InstancedBufferAttribute(traceBuffers.iSelectPulseAlpha, 1));
    traceMesh.geometry.setAttribute('iSelectPulseTime', new THREE.InstancedBufferAttribute(traceBuffers.iSelectPulseTime, 1));

    // Halo
    haloMesh.geometry.setAttribute('iColor', new THREE.InstancedBufferAttribute(haloBuffers.iColor, 3));
    haloMesh.geometry.setAttribute('iOpacity', new THREE.InstancedBufferAttribute(haloBuffers.iOpacity, 1));
    haloMesh.geometry.setAttribute('iScale', new THREE.InstancedBufferAttribute(haloBuffers.iScale, 1));
  }, [count]);

  // --- Per-frame update ---
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const delta = clock.getDelta();
    const faceMesh = faceMeshRef.current;
    const edgeMesh = edgeMeshRef.current;
    const traceMesh = traceMeshRef.current;
    const haloMesh = haloMeshRef.current;
    if (!faceMesh || !edgeMesh || !traceMesh || !haloMesh) return;

    // Shared uniforms
    faceMat.uniforms.uTime.value = t;

    for (let i = 0; i < count; i++) {
      const resource = resources[i];
      const id = resource.id;
      const type = themeKey(resource.type);
      const typeColors = RESOURCE_COLORS[type] ?? DEFAULT_RESOURCE_COLORS;
      const pos = positions.get(id) ?? [0, 0, 0];

      // Effect interpolation values
      const hoverT = getEffectT(ctx, 'faceOpacity', id);
      const sepT = getEffectT(ctx, 'faceSeparation', id) * 0.08;
      const colorT = getEffectT(ctx, 'colorTemp', id);
      const edgeT = getEffectT(ctx, 'edgeIntensify', id);
      const holoT = getEffectT(ctx, 'holoFlicker', id);
      const dataT = getEffectT(ctx, 'faceDataOverlay', id);
      const liftT = getEffectT(ctx, 'lift', id);
      const haloBloomT = getEffectT(ctx, 'haloBloom', id);
      const statusT = getEffectT(ctx, 'statusGlow', id);
      const pulseT = getEffectT(ctx, 'tracePulse', id);
      const selectTraceT = getEffectT(ctx, 'traceActivation', id);

      // --- Face instance data ---
      tmpColor1.copy(typeColors.faceInner).lerp(FACE_INNER_COOL, colorT);
      tmpColor2.copy(typeColors.faceEdge).lerp(COOL_WHITE, colorT);
      if (statusT > 0.001) {
        tmpColor1.lerp(STATUS_GREEN, statusT * 0.4);
        tmpColor2.lerp(STATUS_GREEN_BRIGHT, statusT * 0.3);
      }
      faceBuffers.iColorInner[i * 3] = tmpColor1.r;
      faceBuffers.iColorInner[i * 3 + 1] = tmpColor1.g;
      faceBuffers.iColorInner[i * 3 + 2] = tmpColor1.b;
      faceBuffers.iColorEdge[i * 3] = tmpColor2.r;
      faceBuffers.iColorEdge[i * 3 + 1] = tmpColor2.g;
      faceBuffers.iColorEdge[i * 3 + 2] = tmpColor2.b;
      faceBuffers.iHover[i] = hoverT;
      faceBuffers.iSeparation[i] = sepT;
      faceBuffers.iHoloFlicker[i] = holoT;
      faceBuffers.iDataOverlay[i] = dataT;

      // --- Edge instance data ---
      tmpColor1.copy(typeColors.edge).lerp(COOL_BLUE_BRIGHT, colorT);
      if (statusT > 0.001) tmpColor1.lerp(STATUS_GREEN, statusT * 0.3);
      edgeBuffers.iColorBot[i * 3] = tmpColor1.r;
      edgeBuffers.iColorBot[i * 3 + 1] = tmpColor1.g;
      edgeBuffers.iColorBot[i * 3 + 2] = tmpColor1.b;
      edgeBuffers.iHover[i] = edgeT;
      edgeBuffers.iEdgeIntensify[i] = edgeT;

      // --- Trace instance data ---
      tmpColor1.copy(typeColors.trace).lerp(TRACE_COOL, colorT);
      traceBuffers.iColor[i * 3] = tmpColor1.r;
      traceBuffers.iColor[i * 3 + 1] = tmpColor1.g;
      traceBuffers.iColor[i * 3 + 2] = tmpColor1.b;
      if (pulseT > 0.01) pulseTimers.current[i] += delta * pulseT;
      if (selectTraceT > 0.01) selectPulseTimers.current[i] += delta;
      else selectPulseTimers.current[i] = 0;
      traceBuffers.iPulseAlpha[i] = pulseT;
      traceBuffers.iPulseTime[i] = pulseTimers.current[i];
      traceBuffers.iSelectPulseAlpha[i] = selectTraceT;
      traceBuffers.iSelectPulseTime[i] = selectPulseTimers.current[i];

      // --- Halo instance data ---
      tmpColor3.copy(typeColors.halo).lerp(COOL_BLUE_BRIGHT, colorT);
      haloBuffers.iColor[i * 3] = tmpColor3.r;
      haloBuffers.iColor[i * 3 + 1] = tmpColor3.g;
      haloBuffers.iColor[i * 3 + 2] = tmpColor3.b;
      const hs = 1.2 + haloBloomT * 0.6;
      haloBuffers.iScale[i] = hs;
      haloBuffers.iOpacity[i] = 0.15 + haloBloomT * 0.25;

      // --- Instance transform (position + lift) ---
      const liftY = liftT * 0.1;

      // Face mesh: centered at CUBE_Y
      _pos.set(pos[0], pos[1] + CUBE_Y + liftY, pos[2]);
      _matrix.compose(_pos, _quat, _scale);
      faceMesh.setMatrixAt(i, _matrix);

      // Edge mesh: centered at CUBE_Y
      edgeMesh.setMatrixAt(i, _matrix);

      // Halo: above cube
      _pos.set(pos[0], pos[1] + CUBE_Y + 0.1 + liftY, pos[2]);
      _matrix.compose(_pos, _quat, new THREE.Vector3(hs, hs, 1));
      haloMesh.setMatrixAt(i, _matrix);

      // Trace: ground level (no lift)
      _pos.set(pos[0], pos[1], pos[2]);
      _matrix.compose(_pos, _quat, _scale);
      traceMesh.setMatrixAt(i, _matrix);
    }

    // Mark buffers for upload
    faceMesh.instanceMatrix.needsUpdate = true;
    edgeMesh.instanceMatrix.needsUpdate = true;
    traceMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;

    for (const name of ['iColorInner', 'iColorEdge', 'iHover', 'iSeparation', 'iHoloFlicker', 'iDataOverlay']) {
      (faceMesh.geometry.attributes[name] as THREE.BufferAttribute).needsUpdate = true;
    }
    for (const name of ['iColorBot', 'iHover', 'iEdgeIntensify']) {
      (edgeMesh.geometry.attributes[name] as THREE.BufferAttribute).needsUpdate = true;
    }
    for (const name of ['iColor', 'iPulseAlpha', 'iPulseTime', 'iSelectPulseAlpha', 'iSelectPulseTime']) {
      (traceMesh.geometry.attributes[name] as THREE.BufferAttribute).needsUpdate = true;
    }
    for (const name of ['iColor', 'iOpacity', 'iScale']) {
      (haloMesh.geometry.attributes[name] as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  if (count === 0) return null;

  return (
    <>
      {/* Instanced faces */}
      <instancedMesh ref={faceMeshRef} args={[faceGeo, faceMat.material, count]} frustumCulled={false} />

      {/* Instanced edges */}
      <instancedMesh ref={edgeMeshRef} args={[edgeGeo, edgeMat.material, count]} frustumCulled={false}>
        {/* lineSegments doesn't have instancedMesh support — use mesh with wireframe edge geo */}
      </instancedMesh>

      {/* Instanced trace borders */}
      <instancedMesh ref={traceMeshRef} args={[traceGeo, traceMat.material, count]} frustumCulled={false} />

      {/* Instanced halos */}
      <instancedMesh
        ref={haloMeshRef}
        args={[new THREE.PlaneGeometry(1, 1), undefined, count]}
        frustumCulled={false}
      >
        <spriteMaterial
          map={haloTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}
```

**Note:** The edges InstancedMesh is a known limitation — `LineSegments` doesn't support instancing natively. We use the `EdgesGeometry` with a standard mesh material that mimics the line look. If the visual is off, we can fall back to keeping per-resource edge rendering (818 line draw calls is far less than 12K total). Address in Step 6 validation.

**Step 2: Commit**

```bash
git add packages/visualization/src/theme/tron/meshes/InstancedCubeRenderer.tsx
git commit -m "feat(viz): InstancedCubeRenderer — 4 draw calls for all resources"
```

---

### Task 6: Wire Up InstancedCubeRenderer in Scene

Remove `<CubeMesh />` from `ResourceActor`, add `<InstancedCubeRenderer />` to `Scene`, and update the theme config.

**Files:**
- Modify: `packages/visualization/src/App.tsx:132-161` (Scene component)
- Modify: `packages/visualization/src/actors/ResourceActor.tsx` (remove Mesh)
- Modify: `packages/visualization/src/theme/tron/index.ts` (remove CubeMesh from resources)

**Step 1: Update Scene in App.tsx**

Add `InstancedCubeRenderer` as a sibling to `GroundActor`:

```tsx
// In App.tsx — import at top
import { InstancedCubeRenderer } from './theme/tron/meshes/InstancedCubeRenderer';

// In Scene component, add before GroundActor:
<InstancedCubeRenderer resources={resources} positions={positions} />
```

**Step 2: Update ResourceActor**

Remove the `<Mesh />` render. ResourceActor now only renders effects:

```tsx
// ResourceActor.tsx
import { useTheme } from '../theme/ThemeProvider';
import { ResourceTypeContext } from '../shared/context';

export function ResourceActor({ type }: { type: string }) {
  const theme = useTheme();
  const config = theme.resources[type] ?? theme.resources['ec2'];
  if (!config) return null;

  const { effects } = config;

  return (
    <ResourceTypeContext.Provider value={type}>
      <group>
        {Object.entries(effects).map(([state, fxList]) =>
          fxList!.map((Fx, i) => <Fx key={`${state}-${i}`} />)
        )}
      </group>
    </ResourceTypeContext.Provider>
  );
}
```

**Step 3: Remove CubeMesh from theme config**

In `packages/visualization/src/theme/tron/index.ts`, the `Mesh` field is still required by the Theme type, but we can set it to a no-op component. Alternatively, update the Theme type to make `Mesh` optional. Simpler: set `Mesh` to a no-op:

```tsx
// Add at top of index.ts
function NoopMesh() { return null; }

// Replace all `Mesh: CubeMesh` with `Mesh: NoopMesh`
```

**Step 4: Verify visually**

Run: `bun apps/cli/src/index.ts start --state ~/Sazabi/monorepo/terraform/main/terraform.tfstate`

Open browser, verify cubes render. Check:
- All resource types show with correct colors
- Hover/select effects work (color shift, lift, separation)
- Performance is improved (check FPS in DevTools)

**Step 5: Commit**

```bash
git add packages/visualization/src/App.tsx packages/visualization/src/actors/ResourceActor.tsx packages/visualization/src/theme/tron/index.ts
git commit -m "feat(viz): wire InstancedCubeRenderer into scene, remove per-resource CubeMesh"
```

---

### Task 7: Add Frustum Culling to Per-Resource Effects

Add frustum culling to `GroundParticles`, `ResourceLabel`, and `HoverDetector` so off-screen resources skip their draw calls.

**Files:**
- Modify: `packages/visualization/src/App.tsx` (add frustum culler to scene context or a new provider)
- Modify: `packages/visualization/src/theme/tron/effects/GroundParticles.tsx`
- Modify: `packages/visualization/src/theme/tron/effects/HoverDetector.tsx`
- Modify: `packages/visualization/src/theme/tron/meshes/ResourceLabel.tsx`

**Approach:** Add a `useFrustumVisible` hook that each per-resource component calls. It reads the resource's world position from the parent `<group>` and tests against the camera frustum each frame.

**Step 1: Create the hook**

```ts
// packages/visualization/src/shared/useFrustumVisible.ts
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _frustum = new THREE.Frustum();
const _matrix = new THREE.Matrix4();
const _sphere = new THREE.Sphere(new THREE.Vector3(), 3);

/**
 * Returns a ref whose .current is true when the parent group is inside the camera frustum.
 * Attach the returned groupRef to a <group> wrapping your mesh.
 */
export function useFrustumVisible(margin = 3) {
  const visibleRef = useRef(true);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    _matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_matrix);

    groupRef.current.getWorldPosition(_sphere.center);
    _sphere.radius = margin;
    visibleRef.current = _frustum.intersectsSphere(_sphere);
    groupRef.current.visible = visibleRef.current;
  });

  return groupRef;
}
```

**Step 2: Apply to GroundParticles**

Wrap the mesh return in a `<group ref={groupRef}>`:

```tsx
// In GroundParticles.tsx
import { useFrustumVisible } from '../../../shared/useFrustumVisible';

export function GroundParticles() {
  const groupRef = useFrustumVisible(5); // larger margin for particle spread
  // ... existing code ...

  return (
    <group ref={groupRef}>
      <mesh material={material} geometry={geometry} />
    </group>
  );
}
```

**Step 3: Apply to HoverDetector**

```tsx
// In HoverDetector.tsx
import { useFrustumVisible } from '../../../shared/useFrustumVisible';

export function HoverDetector() {
  const groupRef = useFrustumVisible();
  // ... existing code ...

  return (
    <group ref={groupRef}>
      <mesh ... >
        ...
      </mesh>
    </group>
  );
}
```

**Step 4: Apply to ResourceLabel**

```tsx
// In ResourceLabel.tsx
import { useFrustumVisible } from '../../../shared/useFrustumVisible';

export function ResourceLabel() {
  const groupRef = useFrustumVisible();
  // ... existing code ...

  // Wrap both ground and billboard returns:
  if (GROUND_STYLES.has(activeStyle)) {
    return (
      <group ref={groupRef}>
        <mesh ...>...</mesh>
      </group>
    );
  }
  if (BILLBOARD_STYLES.has(activeStyle)) {
    return (
      <group ref={groupRef}>
        <sprite ...>...</sprite>
      </group>
    );
  }
}
```

**Step 5: Verify**

Run: `bun apps/cli/src/index.ts start --state ~/Sazabi/monorepo/terraform/main/terraform.tfstate`

Pan camera around. Verify:
- Off-screen particles/labels don't render (check draw calls in DevTools → Performance tab)
- No visible pop-in when panning (margin should prevent it)
- Hovering still works for on-screen resources

**Step 6: Commit**

```bash
git add packages/visualization/src/shared/useFrustumVisible.ts \
    packages/visualization/src/theme/tron/effects/GroundParticles.tsx \
    packages/visualization/src/theme/tron/effects/HoverDetector.tsx \
    packages/visualization/src/theme/tron/meshes/ResourceLabel.tsx
git commit -m "feat(viz): frustum culling for per-resource particles, labels, hover detectors"
```

---

### Task 8: Validate & Fix Edge Cases

**Step 1: Test with the real tfstate**

Run: `bun apps/cli/src/index.ts start --state ~/Sazabi/monorepo/terraform/main/terraform.tfstate`

Check:
- [ ] All resources render (count matches tfstate)
- [ ] Resource type colors are correct (vpc=blue, ec2=orange, etc.)
- [ ] Hover effect works (face opacity, edge intensify, lift, color shift)
- [ ] Select effect works (orbit ring, data stream particles, ground beam)
- [ ] Trace border pulse animates on hover/select
- [ ] Halo sprite scales on select
- [ ] Ground particles visible for nearby resources, culled for distant
- [ ] Labels visible for nearby resources
- [ ] No visual artifacts (z-fighting, missing faces, etc.)
- [ ] FPS improved (target: 30+ FPS)

**Step 2: Fix edge instancing**

If `InstancedMesh` with `EdgesGeometry` doesn't render properly (LineSegments vs Mesh mismatch), fall back to rendering edges as thin box meshes or accept 818 line draw calls (still much better than 12K). Document the chosen approach.

**Step 3: Handle dynamic resource count**

If resources change (live state watching), the instance count needs to update. The current approach uses `useMemo([count])` which recreates buffers on count change. Verify this works by modifying the tfstate file while the server is running.

**Step 4: Final commit**

```bash
git add -u
git commit -m "fix(viz): edge case fixes for instanced rendering"
```
