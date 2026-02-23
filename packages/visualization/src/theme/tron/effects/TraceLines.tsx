import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import { createTraceMaterial } from '../shaders/trace.tsl';
import { TRACE_COLOR, TRACE_WARM, TRACE_COOL } from '../colors';
import { CUBE_SIZE } from '../../../shared/geometry';
import { useSceneContext, getEffectT } from '../../../shared/context';

// @ts-ignore
import GEIST_PIXEL_GRID from '../../../assets/fonts/GeistPixel-Grid.ttf';

/** Load GeistPixel-Grid font and create a canvas texture for a text label */
async function loadLabelFont(): Promise<FontFace> {
  const font = new FontFace('GeistPixelGrid', `url(${GEIST_PIXEL_GRID})`);
  await font.load();
  document.fonts.add(font);
  return font;
}

function createTextTexture(text: string, color: string, fontSize = 64) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px GeistPixelGrid`;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + 16;
  const h = fontSize + 16;
  canvas.width = w;
  canvas.height = h;
  ctx.font = `${fontSize}px GeistPixelGrid`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return { texture: tex, aspect: w / h };
}

export function TraceLines() {
  const ctx = useSceneContext();
  const pulseTimeRef = useRef(0);
  const selectPulseTimeRef = useRef(0);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // Two materials: axial lines have thin dimension on UV.x, borders on UV.y
  const { lineMat, borderMat, lineUniforms, borderUniforms } = useMemo(() => {
    const line = createTraceMaterial('x');
    line.uniforms.uBorderDist.value = CUBE_SIZE / 2 + 0.08;
    const border = createTraceMaterial('y');
    border.uniforms.uBorderDist.value = CUBE_SIZE / 2 + 0.08;
    return { lineMat: line.material, borderMat: border.material, lineUniforms: line.uniforms, borderUniforms: border.uniforms };
  }, []);

  // Canvas-texture label (WebGPU-compatible replacement for drei Text)
  const { labelMesh, labelMat } = useMemo(() => {
    // Start with a placeholder - font hasn't loaded yet
    const geo = new THREE.PlaneGeometry(1, 0.45);
    const mat = new MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.depthWrite = false;
    mat.blending = THREE.AdditiveBlending;
    mat.side = THREE.DoubleSide;
    mat.opacity = 0; // hidden until font loads
    const mesh = new THREE.Mesh(geo, mat);
    return { labelMesh: mesh, labelMat: mat };
  }, []);

  // Load font async, then re-create texture
  useEffect(() => {
    loadLabelFont().then(() => {
      const { texture, aspect } = createTextTexture('EC2', TRACE_COLOR, 64);
      const labelHeight = 0.45;
      const labelWidth = labelHeight * aspect;
      labelMesh.geometry.dispose();
      labelMesh.geometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
      labelMat.map = texture;
      labelMat.opacity = 1;
      labelMat.needsUpdate = true;
    });
  }, [labelMesh, labelMat]);

  useFrame((_, delta) => {
    // Pulse
    const pulseT = getEffectT(ctx, 'tracePulse');
    if (pulseT > 0.01) pulseTimeRef.current += delta * pulseT;

    // Color temp
    const colorT = getEffectT(ctx, 'colorTemp');
    tmpColor.copy(TRACE_WARM).lerp(TRACE_COOL, colorT);

    // Trace activation
    const selectTraceT = getEffectT(ctx, 'traceActivation');
    if (selectTraceT > 0.01) selectPulseTimeRef.current += delta;
    else selectPulseTimeRef.current = 0;

    // Drive both materials
    for (const u of [lineUniforms, borderUniforms]) {
      u.uPulseAlpha.value = pulseT;
      u.uPulseTime.value = pulseTimeRef.current;
      u.uColor.value.copy(tmpColor);
      u.uSelectPulseAlpha.value = selectTraceT;
      u.uSelectPulseTime.value = selectPulseTimeRef.current;
    }
  });

  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;
  const lineW = 0.08; // wider geometry for shader-based AA
  const borderW = 0.08;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Z-axis line (positive) */}
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half + 3.75]}>
        <planeGeometry args={[lineW, 7.5]} />
      </mesh>
      {/* Z-axis line (negative) */}
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(half + 3.75)]}>
        <planeGeometry args={[lineW, 7.5]} />
      </mesh>
      {/* X-axis line (positive) */}
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half + 3.75, 0, 0]}>
        <planeGeometry args={[lineW, 7.5]} />
      </mesh>
      {/* X-axis line (negative) */}
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-(half + 3.75), 0, 0]}>
        <planeGeometry args={[lineW, 7.5]} />
      </mesh>
      {/* Front border (z+) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Back border (z-) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -half]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Right border (x+) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half, 0, 0]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Left border (x-) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-half, 0, 0]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* EC2 label - canvas texture (WebGPU compatible) */}
      <primitive
        object={labelMesh}
        position={[0, 0.225 - 0.04, -(half + 0.6)]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}
