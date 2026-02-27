import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import { createInstancedFaceMaterial } from '../shaders/instanced-face.tsl';
import { createInstancedEdgeMaterial } from '../shaders/instanced-edge.tsl';
import { createInstancedTraceMaterial } from '../shaders/instanced-trace.tsl';
import {
  COOL_BLUE_BRIGHT, FACE_INNER_COOL, COOL_WHITE, TRACE_COOL,
  STATUS_GREEN, STATUS_GREEN_BRIGHT,
  RESOURCE_COLORS, DEFAULT_RESOURCE_COLORS,
} from '../colors';
import { CUBE_SIZE, CUBE_Y, faceConfigs, createHaloTexture } from '../../../shared/geometry';
import { useSceneContext, getEffectT } from '../../../shared/context';
import type { Resource } from '../../../types';

/* ─── Resource type → theme key mapping ─── */

function themeKey(type: string): string {
  const map: Record<string, string> = {
    instance: 'ec2', vpc: 'vpc', subnet: 'subnet',
    security_group: 'security_group', s3_bucket: 's3_bucket',
    iam_role: 'iam_role', lambda_function: 'lambda',
  };
  return map[type] ?? type;
}

/* ─── InstancedLineSegments ─── */
// THREE.InstancedMesh extends Mesh and uses triangle topology.
// Edge wireframes require LINE topology, so we use a lightweight wrapper
// around THREE.LineSegments that adds instancing via InstancedBufferGeometry.

class InstancedLineSegments extends THREE.LineSegments {
  readonly isInstancedLineSegments = true;
  instanceMatrix: THREE.InstancedBufferAttribute;
  count: number;

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    instanceCount: number,
  ) {
    // Convert to InstancedBufferGeometry to enable hardware instancing
    const ibg = new THREE.InstancedBufferGeometry();
    ibg.instanceCount = instanceCount;

    // Copy all attributes from source geometry
    for (const name of Object.keys(geometry.attributes)) {
      ibg.setAttribute(name, geometry.getAttribute(name));
    }
    if (geometry.index) ibg.setIndex(geometry.index);

    super(ibg, material);

    this.count = instanceCount;
    this.instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(instanceCount * 16),
      16,
    );
    ibg.setAttribute('instanceMatrix', this.instanceMatrix);

    // Initialize all instance matrices to identity
    const identity = new THREE.Matrix4();
    for (let i = 0; i < instanceCount; i++) {
      identity.toArray(this.instanceMatrix.array, i * 16);
    }
  }

  setMatrixAt(index: number, matrix: THREE.Matrix4) {
    matrix.toArray(this.instanceMatrix.array, index * 16);
  }

  getMatrixAt(index: number, matrix: THREE.Matrix4) {
    matrix.fromArray(this.instanceMatrix.array, index * 16);
  }
}

extend({ InstancedLineSegments });

// Augment R3F's JSX namespace so <instancedLineSegments> is recognized
declare module '@react-three/fiber' {
  interface ThreeElements {
    instancedLineSegments: any;
  }
}

/* ─── Geometry merging ─── */

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0].clone();

  // Collect all attribute names from the first geometry (all should share the same attributes)
  const attrNames = Object.keys(geometries[0].attributes);
  const merged = new THREE.BufferGeometry();

  // Merge each named attribute
  for (const name of attrNames) {
    const arrays: Float32Array[] = [];
    for (const geo of geometries) {
      const attr = geo.getAttribute(name);
      if (attr) arrays.push(new Float32Array(attr.array));
    }
    const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
    const combined = new Float32Array(totalLen);
    let offset = 0;
    for (const arr of arrays) {
      combined.set(arr, offset);
      offset += arr.length;
    }
    const itemSize = geometries[0].getAttribute(name).itemSize;
    merged.setAttribute(name, new THREE.BufferAttribute(combined, itemSize));
  }

  // Merge indices
  const hasIndices = geometries.every(g => g.index !== null);
  if (hasIndices) {
    const indexArrays: number[] = [];
    let vertexOffset = 0;
    for (const geo of geometries) {
      const idx = geo.index!;
      for (let i = 0; i < idx.count; i++) {
        indexArrays.push(idx.array[i] + vertexOffset);
      }
      vertexOffset += geo.getAttribute('position').count;
    }
    merged.setIndex(indexArrays);
  }

  return merged;
}

/* ─── Face geometry: merge 6 oriented face planes ─── */

function createMergedFaceGeometry(): THREE.BufferGeometry {
  const planes: THREE.BufferGeometry[] = [];
  const euler = new THREE.Euler();
  const mat4 = new THREE.Matrix4();
  const normalMat = new THREE.Matrix3();

  for (const cfg of faceConfigs) {
    const plane = new THREE.PlaneGeometry(CUBE_SIZE, CUBE_SIZE);
    euler.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    mat4.makeRotationFromEuler(euler);
    mat4.setPosition(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    plane.applyMatrix4(mat4);

    // Recompute normals from the rotation (applyMatrix4 transforms positions
    // but we need correct normals for the shader's separation displacement)
    normalMat.getNormalMatrix(mat4);
    const normalAttr = plane.getAttribute('normal');
    const v = new THREE.Vector3();
    for (let i = 0; i < normalAttr.count; i++) {
      v.fromBufferAttribute(normalAttr, i);
      v.applyMatrix3(normalMat).normalize();
      normalAttr.setXYZ(i, v.x, v.y, v.z);
    }

    planes.push(plane);
  }

  return mergeBufferGeometries(planes);
}

/* ─── Trace geometry: merge 4 border planes ─── */

function createMergedTraceGeometry(): THREE.BufferGeometry {
  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;
  const borderW = 0.08;

  const borders: THREE.BufferGeometry[] = [];
  const euler = new THREE.Euler();
  const mat4 = new THREE.Matrix4();

  const configs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
    // Front border (z+)
    { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, half] },
    // Back border (z-)
    { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, -half] },
    // Right border (x+)
    { rot: [-Math.PI / 2, 0, Math.PI / 2], pos: [half, 0, 0] },
    // Left border (x-)
    { rot: [-Math.PI / 2, 0, Math.PI / 2], pos: [-half, 0, 0] },
  ];

  for (const cfg of configs) {
    const plane = new THREE.PlaneGeometry(borderLen, borderW);
    euler.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    mat4.makeRotationFromEuler(euler);
    mat4.setPosition(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    plane.applyMatrix4(mat4);
    borders.push(plane);
  }

  return mergeBufferGeometries(borders);
}

/* ─── Props ─── */

interface InstancedCubeRendererProps {
  resources: Resource[];
  positions: Map<string, [number, number, number]>;
}

/* ─── Component ─── */

export function InstancedCubeRenderer({ resources, positions }: InstancedCubeRendererProps) {
  const ctx = useSceneContext();
  const count = resources.length;

  // Refs for instanced objects
  const facesMeshRef = useRef<THREE.InstancedMesh>(null);
  const edgesRef = useRef<InstancedLineSegments>(null);
  const traceMeshRef = useRef<THREE.InstancedMesh>(null);
  const haloMeshRef = useRef<THREE.InstancedMesh>(null);

  // Hover/select interaction state
  const hoveredInstanceRef = useRef(-1);

  // Per-instance pulse time accumulators for trace borders
  const pulseTimesRef = useRef<Float32Array>(new Float32Array(0));
  const selectPulseTimesRef = useRef<Float32Array>(new Float32Array(0));

  // Scratch objects (reused every frame)
  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);
  const _projVec = useMemo(() => new THREE.Vector3(), []);

  /* ─── Geometries (created once) ─── */

  const faceGeometry = useMemo(() => createMergedFaceGeometry(), []);

  const edgeGeometry = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)), []);

  const traceGeometry = useMemo(() => createMergedTraceGeometry(), []);

  const haloGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  /* ─── Materials (created once) ─── */

  const { material: faceMaterial, uniforms: faceUniforms } = useMemo(
    () => createInstancedFaceMaterial(), []);

  const { material: edgeMaterial } = useMemo(() => {
    const result = createInstancedEdgeMaterial();
    result.uniforms.uCubeY.value = CUBE_Y;
    result.uniforms.uCubeSize.value = CUBE_SIZE;
    return result;
  }, []);

  const { material: traceMaterial } = useMemo(() => {
    const result = createInstancedTraceMaterial();
    result.uniforms.uBorderDist.value = CUBE_SIZE / 2 + 0.08;
    return result;
  }, []);

  const haloTexture = useMemo(() => createHaloTexture(), []);

  const haloMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0.15,
    });
    return mat;
  }, [haloTexture]);

  /* ─── Instance attribute buffers (packed to stay within WebGPU's 8 vertex buffer limit) ─── */
  // Face: position(1) + normal(1) + uv(1) + iColorInner(1) + iColorEdge(1) + iEffects(1) = 6 buffers
  // Trace: position(1) + normal(1) + uv(1) + iColor(1) + iPulseData(1) = 5 buffers
  // Edge: position(1) + instanceMatrix(1) + iColorBot(1) + iHover(1) + iEdgeIntensify(1) = 5 buffers

  const faceAttrs = useMemo(() => {
    if (count === 0) return null;
    const attrs = {
      iColorInner: new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3),
      iColorEdge: new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3),
      // Packed vec4: x=hover, y=separation, z=holoFlicker, w=dataOverlay
      iEffects: new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4),
    };
    // Attach to geometry immediately so they exist before first render
    faceGeometry.setAttribute('iColorInner', attrs.iColorInner);
    faceGeometry.setAttribute('iColorEdge', attrs.iColorEdge);
    faceGeometry.setAttribute('iEffects', attrs.iEffects);
    return attrs;
  }, [count, faceGeometry]);

  const edgeAttrs = useMemo(() => {
    if (count === 0) return null;
    const attrs = {
      iColorBot: new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3),
      iHover: new THREE.InstancedBufferAttribute(new Float32Array(count), 1),
      iEdgeIntensify: new THREE.InstancedBufferAttribute(new Float32Array(count), 1),
    };
    // Attach to source geometry so InstancedLineSegments copies them to its IBG
    edgeGeometry.setAttribute('iColorBot', attrs.iColorBot);
    edgeGeometry.setAttribute('iHover', attrs.iHover);
    edgeGeometry.setAttribute('iEdgeIntensify', attrs.iEdgeIntensify);
    return attrs;
  }, [count, edgeGeometry]);

  const traceAttrs = useMemo(() => {
    if (count === 0) return null;
    const attrs = {
      iColor: new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3),
      // Packed vec4: x=pulseAlpha, y=pulseTime, z=selectPulseAlpha, w=selectPulseTime
      iPulseData: new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4),
    };
    // Attach to geometry immediately
    traceGeometry.setAttribute('iColor', attrs.iColor);
    traceGeometry.setAttribute('iPulseData', attrs.iPulseData);
    return attrs;
  }, [count, traceGeometry]);

  /* ─── Resize pulse timer arrays when count changes ─── */

  useEffect(() => {
    if (count === 0) return;
    // Preserve existing pulse times where possible
    const oldPulse = pulseTimesRef.current;
    const newPulse = new Float32Array(count);
    newPulse.set(oldPulse.subarray(0, Math.min(oldPulse.length, count)));
    pulseTimesRef.current = newPulse;

    const oldSelect = selectPulseTimesRef.current;
    const newSelect = new Float32Array(count);
    newSelect.set(oldSelect.subarray(0, Math.min(oldSelect.length, count)));
    selectPulseTimesRef.current = newSelect;
  }, [count]);

  /* ─── Per-frame update loop ─── */

  useFrame(({ clock, camera, gl }, delta) => {
    if (count === 0) return;

    const t = clock.getElapsedTime();

    // Update face material time uniform
    faceUniforms.uTime.value = t;

    const facesMesh = facesMeshRef.current;
    const edgesObj = edgesRef.current;
    const traceMesh = traceMeshRef.current;
    const haloMesh = haloMeshRef.current;
    if (!facesMesh || !edgesObj || !traceMesh || !haloMesh) return;
    if (!faceAttrs || !edgeAttrs || !traceAttrs) return;

    const pulseTimes = pulseTimesRef.current;
    const selectPulseTimes = selectPulseTimesRef.current;

    for (let i = 0; i < count; i++) {
      const resource = resources[i];
      const pos = positions.get(resource.id);
      if (!pos) continue;

      const rid = resource.id;

      // --- Hover/select interpolation (replaces per-resource HoverDetector) ---
      const hoverTarget = hoveredInstanceRef.current === i ? 1 : 0;
      const prevHover = ctx.hoverTMapRef.current[rid] ?? 0;
      ctx.hoverTMapRef.current[rid] = prevHover + (hoverTarget - prevHover) * Math.min(1, delta * 25);

      const selectTarget = ctx.selectedResourceIdRef.current === rid ? 1 : 0;
      const prevSelect = ctx.selectedTMapRef.current[rid] ?? 0;
      ctx.selectedTMapRef.current[rid] = prevSelect + (selectTarget - prevSelect) * Math.min(1, delta * 8);

      const tk = themeKey(resource.type);
      const typeColors = RESOURCE_COLORS[tk] ?? DEFAULT_RESOURCE_COLORS;

      // --- Effect values ---
      const hoverT = getEffectT(ctx, 'faceOpacity', rid);
      const separationT = getEffectT(ctx, 'faceSeparation', rid);
      const colorT = getEffectT(ctx, 'colorTemp', rid);
      const edgeT = getEffectT(ctx, 'edgeIntensify', rid);
      const holoFlickerT = getEffectT(ctx, 'holoFlicker', rid);
      const dataOverlayT = getEffectT(ctx, 'faceDataOverlay', rid);
      const statusT = getEffectT(ctx, 'statusGlow', rid);
      const liftT = getEffectT(ctx, 'lift', rid);
      const haloT = getEffectT(ctx, 'haloBloom', rid);
      const pulseT = getEffectT(ctx, 'tracePulse', rid);
      const selectTraceT = getEffectT(ctx, 'traceActivation', rid);

      // --- Face colors ---
      tmpColor1.copy(typeColors.faceInner).lerp(FACE_INNER_COOL, colorT);
      tmpColor2.copy(typeColors.faceEdge).lerp(COOL_WHITE, colorT);

      // Status glow shift (applied to face colors)
      if (statusT > 0.001) {
        tmpColor1.lerp(STATUS_GREEN, statusT * 0.4);
        tmpColor2.lerp(STATUS_GREEN_BRIGHT, statusT * 0.3);
      }

      const i3 = i * 3;
      const i4 = i * 4;
      faceAttrs.iColorInner.array[i3] = tmpColor1.r;
      faceAttrs.iColorInner.array[i3 + 1] = tmpColor1.g;
      faceAttrs.iColorInner.array[i3 + 2] = tmpColor1.b;
      faceAttrs.iColorEdge.array[i3] = tmpColor2.r;
      faceAttrs.iColorEdge.array[i3 + 1] = tmpColor2.g;
      faceAttrs.iColorEdge.array[i3 + 2] = tmpColor2.b;
      // Packed iEffects vec4: x=hover, y=separation, z=holoFlicker, w=dataOverlay
      faceAttrs.iEffects.array[i4] = hoverT;
      faceAttrs.iEffects.array[i4 + 1] = separationT * 0.08;
      faceAttrs.iEffects.array[i4 + 2] = holoFlickerT;
      faceAttrs.iEffects.array[i4 + 3] = dataOverlayT;

      // --- Edge colors ---
      tmpColor1.copy(typeColors.edge).lerp(COOL_BLUE_BRIGHT, colorT);
      if (statusT > 0.001) {
        tmpColor1.lerp(STATUS_GREEN, statusT * 0.3);
      }

      edgeAttrs.iColorBot.array[i3] = tmpColor1.r;
      edgeAttrs.iColorBot.array[i3 + 1] = tmpColor1.g;
      edgeAttrs.iColorBot.array[i3 + 2] = tmpColor1.b;
      (edgeAttrs.iHover.array as Float32Array)[i] = edgeT;
      (edgeAttrs.iEdgeIntensify.array as Float32Array)[i] = edgeT;

      // --- Trace colors & pulse timing ---
      tmpColor1.copy(typeColors.trace).lerp(TRACE_COOL, colorT);

      traceAttrs.iColor.array[i3] = tmpColor1.r;
      traceAttrs.iColor.array[i3 + 1] = tmpColor1.g;
      traceAttrs.iColor.array[i3 + 2] = tmpColor1.b;

      // Accumulate pulse times per instance
      if (pulseT > 0.01) pulseTimes[i] += delta * pulseT;
      if (selectTraceT > 0.01) selectPulseTimes[i] += delta;
      else selectPulseTimes[i] = 0;

      // Packed iPulseData vec4: x=pulseAlpha, y=pulseTime, z=selectPulseAlpha, w=selectPulseTime
      const ti4 = i * 4;
      traceAttrs.iPulseData.array[ti4] = pulseT;
      traceAttrs.iPulseData.array[ti4 + 1] = pulseTimes[i];
      traceAttrs.iPulseData.array[ti4 + 2] = selectTraceT;
      traceAttrs.iPulseData.array[ti4 + 3] = selectPulseTimes[i];

      // --- Instance matrices ---
      const px = pos[0];
      const py = pos[1];
      const pz = pos[2];
      const lift = liftT * 0.1;

      // Faces + Edges: offset by CUBE_Y + lift
      tmpMatrix.makeTranslation(px, py + CUBE_Y + lift, pz);
      facesMesh.setMatrixAt(i, tmpMatrix);
      edgesObj.setMatrixAt(i, tmpMatrix);

      // Traces: ground level (y = 0.01), no lift
      tmpMatrix.makeTranslation(px, py + 0.01, pz);
      traceMesh.setMatrixAt(i, tmpMatrix);

      // Halo: above resource, with scale based on haloBloom
      const hs = 1.2 + haloT * 0.6;
      tmpMatrix.makeScale(hs, hs, 1);
      tmpMatrix.setPosition(px, py + CUBE_Y + 0.1 + lift, pz);
      haloMesh.setMatrixAt(i, tmpMatrix);
    }

    // Mark instance matrices as needing GPU upload
    facesMesh.instanceMatrix.needsUpdate = true;
    edgesObj.instanceMatrix.needsUpdate = true;
    traceMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;

    // Mark all attribute buffers as needing GPU upload
    faceAttrs.iColorInner.needsUpdate = true;
    faceAttrs.iColorEdge.needsUpdate = true;
    faceAttrs.iEffects.needsUpdate = true;

    edgeAttrs.iColorBot.needsUpdate = true;
    edgeAttrs.iHover.needsUpdate = true;
    edgeAttrs.iEdgeIntensify.needsUpdate = true;

    traceAttrs.iColor.needsUpdate = true;
    traceAttrs.iPulseData.needsUpdate = true;

    // Update halo material opacity based on max halo bloom across all resources
    haloMaterial.opacity = 0.15 + (getEffectT(ctx, 'haloBloom', resources[count - 1]?.id) * 0.25);

    // Tooltip positioning
    if (ctx.tooltipRef.current) {
      const hi = hoveredInstanceRef.current;
      if (hi >= 0 && hi < count) {
        const hPos = positions.get(resources[hi]?.id);
        if (hPos) {
          _projVec.set(hPos[0] + CUBE_SIZE * 0.5, hPos[1] + CUBE_Y + CUBE_SIZE * 0.5, hPos[2]);
          _projVec.project(camera);
          const canvas = gl.domElement;
          const x = (_projVec.x * 0.5 + 0.5) * canvas.clientWidth;
          const y = (-_projVec.y * 0.5 + 0.5) * canvas.clientHeight;
          const ht = ctx.hoverTMapRef.current[resources[hi]?.id] ?? 0;
          ctx.tooltipRef.current.style.left = `${x + 16}px`;
          ctx.tooltipRef.current.style.top = `${y - 12}px`;
          ctx.tooltipRef.current.style.opacity = String(ht);
          ctx.tooltipRef.current.style.transform = `translateY(${(1 - ht) * 6}px)`;
        }
      } else {
        ctx.tooltipRef.current.style.opacity = '0';
      }
    }

    // Invalidate bounding sphere for raycasting after matrix updates
    facesMesh.boundingSphere = null;

    // Set instance count
    facesMesh.count = count;
    traceMesh.count = count;
    haloMesh.count = count;
    // Edge count is managed via InstancedBufferGeometry.instanceCount
    const edgeIBG = edgesObj.geometry as THREE.InstancedBufferGeometry;
    edgeIBG.instanceCount = count;
  });

  if (count === 0) return null;

  return (
    <>
      {/* Faces: 6 merged planes per instance — also handles hover/select interaction */}
      <instancedMesh
        ref={facesMeshRef}
        args={[faceGeometry, faceMaterial, count]}
        frustumCulled={false}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId !== hoveredInstanceRef.current) {
            hoveredInstanceRef.current = e.instanceId;
            ctx.setHoveredResourceId(resources[e.instanceId]?.id ?? null);
          }
        }}
        onPointerLeave={() => {
          hoveredInstanceRef.current = -1;
          ctx.setHoveredResourceId(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            ctx.onSelect(resources[e.instanceId]?.id ?? '');
          }
        }}
        onPointerMissed={() => ctx.onDeselect()}
      />

      {/* Edges: instanced wireframe lines — uses LineSegments for correct LINE topology */}
      <instancedLineSegments
        ref={edgesRef}
        args={[edgeGeometry, edgeMaterial, count]}
        frustumCulled={false}
      />

      {/* Trace borders: 4 merged border planes per instance */}
      <instancedMesh
        ref={traceMeshRef}
        args={[traceGeometry, traceMaterial, count]}
        frustumCulled={false}
      />

      {/* Halos: plane with additive blending per instance */}
      <instancedMesh
        ref={haloMeshRef}
        args={[haloGeometry, haloMaterial, count]}
        frustumCulled={false}
      />
    </>
  );
}
