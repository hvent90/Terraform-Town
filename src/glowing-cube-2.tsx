import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { useMemo, useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';

// @ts-ignore
import GEIST_PIXEL_GRID from './fonts/GeistPixel-Grid.ttf';

/* ─── Constants ─── */
const TRACE_COLOR = '#ff8800';
const WHITE_HOT = new THREE.Color(0xffeedd);
const CUBE_SIZE = 0.6;
const CUBE_Y = CUBE_SIZE / 2;
const AMBER = new THREE.Color(0xff8822);
const AMBER_WARM = new THREE.Color(0xffaa44);
const FACE_INNER_WARM = new THREE.Color(0xffbb55);
const TRACE_WARM = new THREE.Color(TRACE_COLOR);
const HALO_WARM = new THREE.Color(0xffaa55);
const LIGHT_POOL_BRIGHT = new THREE.Color(0xffcc88);

// Cool targets for color temp shift
const COOL_BLUE = new THREE.Color(0x4488ff);
const COOL_BLUE_BRIGHT = new THREE.Color(0x88bbff);
const COOL_WHITE = new THREE.Color(0xddeeff);
const FACE_INNER_COOL = new THREE.Color(0x88bbff);
const TRACE_COOL = new THREE.Color(0x4488ff);

const STATUS_GREEN = new THREE.Color(0x44ff88);
const STATUS_GREEN_BRIGHT = new THREE.Color(0x88ffbb);

/* ─── Hover Effects System ─── */
type EffectKey = 'edgeIntensify' | 'faceOpacity' | 'breathingAmp' | 'haloBloom' | 'lift' | 'particleAttract' | 'faceSeparation' | 'tracePulse' | 'colorTemp';

const EFFECT_LABELS: Record<EffectKey, string> = {
  edgeIntensify: 'Edge Intensify',
  faceOpacity: 'Face Opacity',
  breathingAmp: 'Breathing Amp',
  haloBloom: 'Halo Bloom',
  lift: 'Lift',
  particleAttract: 'Particle Attract',
  faceSeparation: 'Face Separation',
  tracePulse: 'Trace Pulse',
  colorTemp: 'Color Temp Shift',
};

const ALL_EFFECTS: EffectKey[] = Object.keys(EFFECT_LABELS) as EffectKey[];

const DEFAULT_TOGGLES: Record<EffectKey, boolean> = Object.fromEntries(
  ALL_EFFECTS.map(k => [k, false])
) as Record<EffectKey, boolean>;

/* ─── Selected Effects System ─── */
type SelectEffectKey = 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker' | 'edgePulse' | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';

const SELECT_EFFECT_LABELS: Record<SelectEffectKey, string> = {
  orbitRing: 'Orbit Ring',
  dataStream: 'Data Stream',
  groundBeam: 'Ground Beam',
  holoFlicker: 'Holo Flicker',
  edgePulse: 'Edge Pulse',
  faceDataOverlay: 'Face Data Overlay',
  statusGlow: 'Status Glow',
  traceActivation: 'Trace Activation',
};

const ALL_SELECT_EFFECTS: SelectEffectKey[] = Object.keys(SELECT_EFFECT_LABELS) as SelectEffectKey[];

const DEFAULT_SELECT_TOGGLES: Record<SelectEffectKey, boolean> = Object.fromEntries(
  ALL_SELECT_EFFECTS.map(k => [k, false])
) as Record<SelectEffectKey, boolean>;

type CubeContextType = {
  togglesRef: React.MutableRefObject<Record<EffectKey, boolean>>;
  hoverTRef: React.MutableRefObject<number>;
  selectTogglesRef: React.MutableRefObject<Record<SelectEffectKey, boolean>>;
  selectedTRef: React.MutableRefObject<number>;
  onSelect: () => void;
  onDeselect: () => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
};

const CubeContext = createContext<CubeContextType>(null!);

/* ─── Face Configs ─── */
const faceConfigs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
  { rot: [0, 0, 0],             pos: [0, 0, CUBE_SIZE / 2] },
  { rot: [0, Math.PI, 0],       pos: [0, 0, -CUBE_SIZE / 2] },
  { rot: [0, Math.PI / 2, 0],   pos: [CUBE_SIZE / 2, 0, 0] },
  { rot: [0, -Math.PI / 2, 0],  pos: [-CUBE_SIZE / 2, 0, 0] },
  { rot: [-Math.PI / 2, 0, 0],  pos: [0, CUBE_SIZE / 2, 0] },
  { rot: [Math.PI / 2, 0, 0],   pos: [0, -CUBE_SIZE / 2, 0] },
];

/* ─── Halo Texture ─── */
function createHaloTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 190, 100, 0.06)');
  g.addColorStop(0.15, 'rgba(255, 150, 60, 0.03)');
  g.addColorStop(0.35, 'rgba(255, 120, 30, 0.005)');
  g.addColorStop(0.6, 'rgba(255, 80, 10, 0.0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/* ─── CubeFace (shared material) ─── */
function CubeFace({ rot, pos, material }: { rot: [number, number, number]; pos: [number, number, number]; material: THREE.ShaderMaterial }) {
  return (
    <mesh material={material} position={pos} rotation={rot}>
      <planeGeometry args={[CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  );
}

/* ─── Hover Detection ─── */
const _projVec = new THREE.Vector3();

function HoverDetector({ selected }: { selected: boolean }) {
  const { hoverTRef, selectedTRef, onSelect, onDeselect, tooltipRef } = useContext(CubeContext);
  const hoveredRef = useRef(false);

  useFrame(({ camera, gl }, delta) => {
    const target = hoveredRef.current ? 1 : 0;
    hoverTRef.current += (target - hoverTRef.current) * Math.min(1, delta * 25);

    const selectTarget = selected ? 1 : 0;
    selectedTRef.current += (selectTarget - selectedTRef.current) * Math.min(1, delta * 8);

    // Project cube top-right to screen space for tooltip
    if (tooltipRef.current) {
      const t = hoverTRef.current;
      _projVec.set(CUBE_SIZE * 0.5, CUBE_Y + CUBE_SIZE * 0.5, 0).project(camera);
      const canvas = gl.domElement;
      const x = (_projVec.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-_projVec.y * 0.5 + 0.5) * canvas.clientHeight;
      tooltipRef.current.style.left = `${x + 16}px`;
      tooltipRef.current.style.top = `${y - 12}px`;
      tooltipRef.current.style.opacity = String(t);
      tooltipRef.current.style.transform = `translateY(${(1 - t) * 6}px)`;
    }
  });

  return (
    <mesh
      onPointerEnter={() => { hoveredRef.current = true; }}
      onPointerLeave={() => { hoveredRef.current = false; }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerMissed={() => onDeselect()}
      position={[0, CUBE_Y, 0]}
    >
      <boxGeometry args={[CUBE_SIZE * 1.5, CUBE_SIZE * 1.5, CUBE_SIZE * 1.5]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/* ─── Glowing Cube ─── */
function GlowingCube() {
  const { togglesRef, hoverTRef, selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const groupRef = useRef<THREE.Group>(null);
  const facesRef = useRef<THREE.Group>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMatRef = useRef<THREE.SpriteMaterial>(null);
  const selectTimeRef = useRef(0);

  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);
  const tmpColor3 = useMemo(() => new THREE.Color(), []);

  // Face material (shared across all 6 faces)
  const faceMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCameraPos: { value: new THREE.Vector3() },
      uColorInner: { value: FACE_INNER_WARM.clone() },
      uColorEdge: { value: WHITE_HOT.clone() },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uSeparation: { value: 0 },
      uHoloFlicker: { value: 0 },
      uDataOverlay: { value: 0 },
    },
    vertexShader: `
      uniform float uSeparation;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPos.xyz += worldNormal * uSeparation;
        vWorldPos = worldPos.xyz;
        vWorldNormal = worldNormal;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uCameraPos;
      uniform vec3 uColorInner;
      uniform vec3 uColorEdge;
      uniform float uTime;
      uniform float uHover;
      uniform float uHoloFlicker;
      uniform float uDataOverlay;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      void main() {
        vec3 viewDir = normalize(uCameraPos - vWorldPos);
        float facing = abs(dot(viewDir, vWorldNormal));
        float fresnel = pow(1.0 - facing, 1.5);

        vec2 edgeDist = abs(vUv - 0.5) * 2.0;
        float edgeFactor = max(edgeDist.x, edgeDist.y);
        edgeFactor = smoothstep(0.7, 1.0, edgeFactor);

        float baseAlpha = 0.15 + fresnel * 0.45 + edgeFactor * 0.5;
        baseAlpha += uHover * 0.2;

        vec3 col = mix(uColorInner, uColorEdge, fresnel * 0.6 + edgeFactor * 0.4);
        col = mix(col, uColorEdge, uHover * 0.3);

        float topBoost = smoothstep(0.3, 1.0, vWorldNormal.y) * 0.2;
        baseAlpha += topBoost;
        col = mix(col, uColorEdge, topBoost);

        baseAlpha *= 0.95 + 0.05 * sin(uTime * 1.5);

        // Holographic flicker
        float scanline = smoothstep(0.4, 0.5, fract(vWorldPos.y * 30.0 + uTime * 2.0)) * 0.3;
        float flicker = step(0.97, fract(sin(uTime * 43.0) * 4375.5453)) * 0.4;
        baseAlpha += (scanline + flicker) * uHoloFlicker;
        col = mix(col, vec3(0.7, 0.9, 1.0), (scanline * 0.3 + flicker * 0.2) * uHoloFlicker);

        // Data overlay grid
        float gridX = smoothstep(0.9, 0.95, fract(vUv.x * 8.0));
        float gridY = smoothstep(0.9, 0.95, fract(vUv.y * 8.0));
        float grid = max(gridX, gridY);
        float scrollData = step(0.6, fract(sin(floor(vUv.x * 8.0) * 17.0 + floor(vUv.y * 8.0 - uTime * 1.5) * 31.0) * 43758.5453));
        float overlay = (grid * 0.4 + scrollData * 0.15) * uDataOverlay;
        col = mix(col, vec3(1.0, 0.7, 0.2), overlay);
        baseAlpha += overlay * 0.3;

        float maxAlpha = 0.85 + uHover * 0.15;
        gl_FragColor = vec4(col, clamp(baseAlpha, 0.0, maxAlpha));
      }
    `,
  }), []);

  const edgesGeo = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)), []);

  const edgesMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColorBot: { value: AMBER_WARM.clone() },
      uColorTop: { value: WHITE_HOT.clone() },
      uCubeY: { value: CUBE_Y },
      uCubeSize: { value: CUBE_SIZE },
      uHover: { value: 0 },
      uSelectEdgePulse: { value: 0 },
      uSelectTime: { value: 0 },
    },
    vertexShader: `
      varying float vHeight;
      uniform float uCubeY;
      uniform float uCubeSize;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vHeight = (worldPos.y - (uCubeY - uCubeSize * 0.5)) / uCubeSize;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorBot;
      uniform vec3 uColorTop;
      uniform float uHover;
      uniform float uSelectEdgePulse;
      uniform float uSelectTime;
      varying float vHeight;
      void main() {
        vec3 col = mix(uColorBot, uColorTop, smoothstep(0.0, 1.0, vHeight));
        float alpha = 0.6 + vHeight * 0.4;
        alpha = alpha + uHover * (1.0 - alpha);
        float pulse = exp(-mod(uSelectTime, 2.0) * 3.0) * uSelectEdgePulse;
        col = mix(col, vec3(1.0, 0.95, 0.9), pulse * 0.6);
        alpha = min(alpha + pulse * 0.3 + uSelectEdgePulse * 0.2, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  }), []);

  const haloTexture = useMemo(() => createHaloTexture(), []);

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();
    const h = hoverTRef.current;
    const toggles = togglesRef.current;
    const selectToggles = selectTogglesRef.current;
    const s = selectedTRef.current;

    // Face material uniforms
    faceMat.uniforms.uCameraPos.value.copy(camera.position);
    faceMat.uniforms.uTime.value = t;
    faceMat.uniforms.uHover.value = toggles.faceOpacity ? h : 0;
    faceMat.uniforms.uSeparation.value = (toggles.faceSeparation ? h : 0) * 0.08;

    // Color temp - face colors
    const colorT = toggles.colorTemp ? h : 0;
    tmpColor1.copy(FACE_INNER_WARM).lerp(FACE_INNER_COOL, colorT);
    faceMat.uniforms.uColorInner.value.copy(tmpColor1);
    tmpColor2.copy(WHITE_HOT).lerp(COOL_WHITE, colorT);
    faceMat.uniforms.uColorEdge.value.copy(tmpColor2);

    // Edge material - color temp first, then edge intensification
    const edgeT = toggles.edgeIntensify ? h : 0;
    tmpColor1.copy(AMBER_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
    tmpColor1.lerp(WHITE_HOT, edgeT);
    edgesMat.uniforms.uColorBot.value.copy(tmpColor1);
    edgesMat.uniforms.uHover.value = edgeT;

    // Holographic flicker (Task 6)
    faceMat.uniforms.uHoloFlicker.value = selectToggles.holoFlicker ? s : 0;

    // Face data overlay (Task 8)
    faceMat.uniforms.uDataOverlay.value = selectToggles.faceDataOverlay ? s : 0;

    // Edge highlight pulse (Task 7)
    const edgePulseT = selectToggles.edgePulse ? s : 0;
    if (edgePulseT > 0.01) selectTimeRef.current += delta;
    else selectTimeRef.current = 0;
    edgesMat.uniforms.uSelectEdgePulse.value = edgePulseT;
    edgesMat.uniforms.uSelectTime.value = selectTimeRef.current;

    // Status glow shift (Task 9)
    const statusT = selectToggles.statusGlow ? s : 0;
    if (statusT > 0.001) {
      faceMat.uniforms.uColorInner.value.lerp(STATUS_GREEN, statusT * 0.4);
      faceMat.uniforms.uColorEdge.value.lerp(STATUS_GREEN_BRIGHT, statusT * 0.3);
      edgesMat.uniforms.uColorBot.value.lerp(STATUS_GREEN, statusT * 0.3);
    }

    // Breathing animation
    const breathT = toggles.breathingAmp ? h : 0;
    const breathAmp = 0.008 + breathT * 0.022;
    const b = 1 + Math.sin(t * 1.2) * breathAmp;
    facesRef.current?.scale.setScalar(b);
    edgesRef.current?.scale.setScalar(b);

    // Lift
    const liftT = toggles.lift ? h : 0;
    if (groupRef.current) {
      groupRef.current.position.y = liftT * 0.1;
    }

    // Halo bloom
    const haloT = toggles.haloBloom ? h : 0;
    if (haloRef.current) {
      const s = 1.2 + haloT * 0.6;
      haloRef.current.scale.set(s, s, 1);
    }
    if (haloMatRef.current) {
      haloMatRef.current.opacity = 0.15 + haloT * 0.25;
      tmpColor3.copy(HALO_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
      haloMatRef.current.color.copy(tmpColor3);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Frosted glass faces */}
      <group ref={facesRef} position={[0, CUBE_Y, 0]}>
        {faceConfigs.map((cfg, i) => (
          <CubeFace key={i} rot={cfg.rot} pos={cfg.pos} material={faceMat} />
        ))}
      </group>

      {/* Edge lines */}
      <lineSegments ref={edgesRef} geometry={edgesGeo} material={edgesMat} position={[0, CUBE_Y, 0]} />

      {/* Halo */}
      <sprite ref={haloRef} position={[0, CUBE_Y + 0.1, 0]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          ref={haloMatRef}
          map={haloTexture}
          color={0xffaa55}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.15}
        />
      </sprite>
    </group>
  );
}

/* ─── Trace Lines ─── */
function TraceLines() {
  const { togglesRef, hoverTRef, selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const pulseTimeRef = useRef(0);
  const selectPulseTimeRef = useRef(0);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(TRACE_COLOR) },
      fadeDistance: { value: 7.5 },
      uBorderDist: { value: CUBE_SIZE / 2 + 0.08 },
      uPulseAlpha: { value: 0 },
      uPulseTime: { value: 0 },
      uSelectPulseAlpha: { value: 0 },
      uSelectPulseTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float fadeDistance;
      uniform float uBorderDist;
      uniform float uPulseAlpha;
      uniform float uPulseTime;
      uniform float uSelectPulseAlpha;
      uniform float uSelectPulseTime;
      varying vec3 vWorldPosition;
      void main() {
        float distFromBorder = max(abs(vWorldPosition.x), abs(vWorldPosition.z)) - uBorderDist;
        float d = max(distFromBorder, 0.0);
        float alpha = 1.0 - smoothstep(0.0, fadeDistance, d);

        float pulsePhase = fract(d * 1.5 - uPulseTime * 2.0);
        float pulse = exp(-pulsePhase * pulsePhase * 40.0) * uPulseAlpha;

        float selectPhase = fract(d * 0.8 - uSelectPulseTime * 1.5);
        float selectPulse = exp(-selectPhase * selectPhase * 20.0) * uSelectPulseAlpha;
        pulse = max(pulse, selectPulse);

        float finalAlpha = max(alpha, pulse);
        float brightness = 4.0 + pulse * 6.0;
        gl_FragColor = vec4(color * brightness, finalAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  useFrame((_, delta) => {
    const toggles = togglesRef.current;
    const h = hoverTRef.current;

    // Pulse
    const pulseT = toggles.tracePulse ? h : 0;
    if (pulseT > 0.01) pulseTimeRef.current += delta * pulseT;
    material.uniforms.uPulseAlpha.value = pulseT;
    material.uniforms.uPulseTime.value = pulseTimeRef.current;

    // Color temp
    const colorT = toggles.colorTemp ? h : 0;
    tmpColor.copy(TRACE_WARM).lerp(TRACE_COOL, colorT);
    material.uniforms.color.value.copy(tmpColor);

    // Trace activation (Task 10)
    const selectTraceT = selectTogglesRef.current.traceActivation ? selectedTRef.current : 0;
    if (selectTraceT > 0.01) selectPulseTimeRef.current += delta;
    else selectPulseTimeRef.current = 0;
    material.uniforms.uSelectPulseAlpha.value = selectTraceT;
    material.uniforms.uSelectPulseTime.value = selectPulseTimeRef.current;
  });

  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Z-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half + 3.75]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Z-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(half + 3.75)]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half + 3.75, 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-(half + 3.75), 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Front border (z+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Back border (z-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Right border (x+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Left border (x-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* EC2 label */}
      <Text
        font={GEIST_PIXEL_GRID}
        fontSize={0.45}
        position={[0, -0.05, -(half + 1.2)]}
        rotation={[0, Math.PI / 2, 0]}
        anchorX="center"
        anchorY="bottom"
        color={TRACE_COLOR}
      >
        EC2
        <meshBasicMaterial color={TRACE_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </Text>
    </group>
  );
}

/* ─── Water Shader ─── */
const waterShader = {
  name: 'WaterReflector',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec4 vUv;
    varying vec3 vWorldPos;

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = dot(hash22(i), f);
      float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
      float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
      float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      float dist = length(vWorldPos.xz);
      float distFactor = smoothstep(0.2, 1.2, dist);

      float t = uTime * 0.6;
      vec2 turb = vec2(
        noise(vWorldPos.xz * 18.0 + vec2(t * 1.2, t * 0.9)),
        noise(vWorldPos.xz * 18.0 + vec2(t * 0.8, t * 1.3) + 50.0)
      ) * 0.009;

      turb += vec2(
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.7, t * 0.5)),
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.6, t * 0.8) + 100.0)
      ) * 0.004;

      turb += vec2(
        sin(vWorldPos.x * 2.0 + t) * cos(vWorldPos.z * 1.5 + t * 0.7),
        cos(vWorldPos.x * 1.5 + t * 0.8) * sin(vWorldPos.z * 2.0 + t * 1.1)
      ) * 0.002;

      turb *= 0.4 + distFactor * 0.6;

      float blur = (0.001 + distFactor * 0.005) * vUv.w;
      vec4 uv = vUv;
      uv.xy += turb * uv.w;

      vec4 col = vec4(0.0);
      col += texture2DProj(tDiffuse, uv) * 2.0;
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, 0.0), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, 0.0), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, -blur), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, blur), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, -blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, -blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, blur) * 0.7, uv.zw));
      col /= 10.0;

      float falloff = exp(-dist * dist * 1.2);
      col.rgb *= falloff * 0.85;

      gl_FragColor = col;
    }
  `,
};

/* ─── Reflective Ground ─── */
function ReflectiveGround() {
  const { size } = useThree();
  const dpr = Math.min(window.devicePixelRatio, 2);

  const reflector = useMemo(() => {
    const geo = new THREE.PlaneGeometry(80, 80);
    const ref = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: size.width * dpr,
      textureHeight: size.height * dpr,
      color: 0x888880,
      shader: waterShader,
    });
    ref.rotation.x = -Math.PI / 2;

    // @ts-ignore - Reflector.onBeforeRender has non-standard signature
    const origBeforeRender = ref.onBeforeRender;
    // @ts-ignore
    ref.onBeforeRender = function (rend: any, scn: any, cam: any) {
      if (!cam.isOrthographicCamera) {
        origBeforeRender.call(this, rend, scn, cam);
        return;
      }
      const savedProjection = cam.projectionMatrix.clone();
      const origRender = rend.render.bind(rend);
      rend.render = function (s: any, c: any) {
        c.projectionMatrix.copy(savedProjection);
        origRender(s, c);
      };
      origBeforeRender.call(this, rend, scn, cam);
      rend.render = origRender;
    };

    return ref;
  }, []);

  useFrame(({ clock }) => {
    (reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime();
  });

  return <primitive object={reflector} />;
}

/* ─── Ground Particles ─── */
function GroundParticles() {
  const { togglesRef, hoverTRef } = useContext(CubeContext);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const particleCount = 3000;

  const { positions, sizes, alphas } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const al = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 2.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = 0.005 + Math.random() * 0.01;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      sz[i] = 0.2 + Math.random() * 0.4;
      const falloff = Math.max(0, 1 - (r - 0.6) / 2.2);
      al[i] = (0.1 + Math.random() * 0.5) * falloff * falloff;
    }
    return { positions: pos, sizes: sz, alphas: al };
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: AMBER_WARM.clone() },
      uTime: { value: 0 },
      uZoom: { value: 80.0 },
      uHover: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      uniform float uTime;
      uniform float uZoom;
      uniform float uHover;
      void main() {
        vAlpha = alpha;
        vec3 pos = position;
        float dist = length(pos.xz);
        pos.xz *= 1.0 - uHover * 0.4;
        pos.y += sin(uTime * 1.5 + dist * 4.0) * 0.002;
        pos.y += uHover * 0.03 * sin(uTime * 3.0 + dist * 6.0);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uZoom * 0.04;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float c = smoothstep(1.0, 0.2, d);
        gl_FragColor = vec4(uColor, c * vAlpha);
      }
    `,
  }), []);

  useFrame(({ clock, camera }) => {
    const toggles = togglesRef.current;
    const h = hoverTRef.current;

    material.uniforms.uTime.value = clock.getElapsedTime();
    if ((camera as THREE.OrthographicCamera).zoom) {
      material.uniforms.uZoom.value = (camera as THREE.OrthographicCamera).zoom;
    }

    // Particle attraction
    material.uniforms.uHover.value = toggles.particleAttract ? h : 0;

    // Color temp
    const colorT = toggles.colorTemp ? h : 0;
    tmpColor.copy(AMBER_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
    material.uniforms.uColor.value.copy(tmpColor);
  });

  return (
    <points material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-alpha" args={[alphas, 1]} />
      </bufferGeometry>
    </points>
  );
}

/* ─── Ground Light Pool ─── */
function GroundLightPool() {
  const { togglesRef, hoverTRef } = useContext(CubeContext);
  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: AMBER.clone() },
      uColorBright: { value: LIGHT_POOL_BRIGHT.clone() },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uColorBright;
      varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * 2.0;
        float r = length(c);
        vec2 world = c * 8.0;
        float boxDist = max(abs(world.x), abs(world.y));
        float coreGlow = exp(-pow(max(boxDist - 0.3, 0.0), 2.0) * 120.0) * 0.3;
        float outerGlow = exp(-r * r * 18.0) * 0.06;
        float intensity = coreGlow + outerGlow;
        vec3 col = mix(uColor, uColorBright, coreGlow / max(intensity, 0.001));
        gl_FragColor = vec4(col, intensity);
      }
    `,
  }), []);

  useFrame(() => {
    const colorT = togglesRef.current.colorTemp ? hoverTRef.current : 0;
    tmpColor1.copy(AMBER).lerp(COOL_BLUE, colorT);
    material.uniforms.uColor.value.copy(tmpColor1);
    tmpColor2.copy(LIGHT_POOL_BRIGHT).lerp(COOL_WHITE, colorT);
    material.uniforms.uColorBright.value.copy(tmpColor2);
  });

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <planeGeometry args={[16, 16]} />
    </mesh>
  );
}

/* ─── Scene Lights ─── */
function SceneLights() {
  const { togglesRef, hoverTRef } = useContext(CubeContext);
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const colorT = togglesRef.current.colorTemp ? hoverTRef.current : 0;
    tmpColor.copy(AMBER).lerp(COOL_BLUE, colorT);
    light1.current?.color.copy(tmpColor);
    light2.current?.color.copy(tmpColor);
  });

  return (
    <>
      <pointLight ref={light1} color={AMBER} intensity={0.5} distance={3} decay={2} position={[0, 0.45, 0]} />
      <pointLight ref={light2} color={AMBER} intensity={0.2} distance={2} decay={2} position={[0, 0.05, 0]} />
    </>
  );
}

/* ─── Mock Terraform EC2 Data ─── */
const EC2_DATA = {
  resource: 'aws_instance.main',
  instance_id: 'i-0a3b8f29d4e6c1072',
  instance_type: 't3.medium',
  ami: 'ami-0c55b159cbfafe1f0',
  availability_zone: 'us-east-1a',
  state: 'running',
  public_ip: '54.210.167.89',
  private_ip: '10.0.1.42',
  vpc_id: 'vpc-0a1b2c3d4e5f6g7h8',
  security_groups: ['sg-web-prod'],
  key_name: 'prod-ssh-key',
  tags: {
    Name: 'web-server-prod',
    Environment: 'production',
    Team: 'platform',
  },
};

/* ─── Hover Tooltip (screen-space projected) ─── */
/* Rendered as a DOM element in App, positioned by HoverDetector's useFrame */

/* ─── Service Info Card (fixed right panel) ─── */
function ServiceInfoCard({ selected, onClose }: { selected: boolean; onClose: () => void }) {
  const kv: React.CSSProperties = {
    color: 'rgba(255, 200, 140, 0.45)',
    paddingRight: 14,
    whiteSpace: 'nowrap',
    verticalAlign: 'top',
    paddingBottom: 4,
  };
  const vv: React.CSSProperties = {
    color: 'rgba(255, 200, 140, 0.9)',
    whiteSpace: 'nowrap',
    paddingBottom: 4,
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1000,
      width: 340,
      background: 'rgba(8, 6, 4, 0.92)',
      borderLeft: '1px solid rgba(255, 150, 50, 0.2)',
      backdropFilter: 'blur(16px)',
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'rgba(255, 200, 140, 0.7)',
      transform: selected ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 150, 50, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255, 200, 140, 0.4)',
            marginBottom: 4,
          }}>
            Resource
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: 'rgba(255, 180, 100, 0.95)',
          }}>
            {EC2_DATA.resource}
          </div>
        </div>
        <div
          onClick={onClose}
          style={{
            cursor: 'pointer',
            color: 'rgba(255, 200, 140, 0.4)',
            fontSize: 18,
            lineHeight: 1,
            padding: '4px 8px',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255, 200, 140, 0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 200, 140, 0.4)'; }}
        >
          &#x2715;
        </div>
      </div>

      {/* State badge */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255, 150, 50, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: '#44ff88',
          boxShadow: '0 0 8px rgba(68, 255, 136, 0.4)',
        }} />
        <span style={{ color: '#44ff88', fontWeight: 'bold' }}>{EC2_DATA.state}</span>
        <span style={{ color: 'rgba(255, 200, 140, 0.3)', marginLeft: 'auto' }}>
          {EC2_DATA.availability_zone}
        </span>
      </div>

      {/* Details */}
      <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
        {/* Instance section */}
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'rgba(255, 200, 140, 0.35)', marginBottom: 10,
        }}>
          Instance
        </div>
        <table style={{ borderSpacing: 0, marginBottom: 20, width: '100%' }}>
          <tbody>
            <tr><td style={kv}>id</td><td style={vv}>{EC2_DATA.instance_id}</td></tr>
            <tr><td style={kv}>type</td><td style={vv}>{EC2_DATA.instance_type}</td></tr>
            <tr><td style={kv}>ami</td><td style={vv}>{EC2_DATA.ami}</td></tr>
            <tr><td style={kv}>key_name</td><td style={vv}>{EC2_DATA.key_name}</td></tr>
          </tbody>
        </table>

        {/* Network section */}
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'rgba(255, 200, 140, 0.35)', marginBottom: 10,
        }}>
          Network
        </div>
        <table style={{ borderSpacing: 0, marginBottom: 20, width: '100%' }}>
          <tbody>
            <tr><td style={kv}>public_ip</td><td style={vv}>{EC2_DATA.public_ip}</td></tr>
            <tr><td style={kv}>private_ip</td><td style={vv}>{EC2_DATA.private_ip}</td></tr>
            <tr><td style={kv}>vpc_id</td><td style={vv}>{EC2_DATA.vpc_id}</td></tr>
            <tr><td style={kv}>security_groups</td><td style={vv}>{EC2_DATA.security_groups.join(', ')}</td></tr>
          </tbody>
        </table>

        {/* Tags section */}
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'rgba(255, 200, 140, 0.35)', marginBottom: 10,
        }}>
          Tags
        </div>
        <table style={{ borderSpacing: 0, width: '100%' }}>
          <tbody>
            {Object.entries(EC2_DATA.tags).map(([k, v]) => (
              <tr key={k}><td style={kv}>{k}</td><td style={vv}>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255, 150, 50, 0.1)',
        fontSize: 10,
        color: 'rgba(255, 200, 140, 0.25)',
        flexShrink: 0,
      }}>
        terraform state &middot; last applied 2m ago
      </div>
    </div>
  );
}

/* ─── Orbit Ring ─── */
function OrbitRing() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const ringRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float dash = smoothstep(0.4, 0.5, fract(vUv.x * 20.0 - uTime * 0.5));
        vec3 col = vec3(1.0, 0.55, 0.1);
        float alpha = dash * uOpacity * 0.8;
        gl_FragColor = vec4(col * 3.0, alpha);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.orbitRing ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, CUBE_Y, 0]} rotation={[Math.PI / 6, 0, Math.PI / 12]} material={material}>
      <torusGeometry args={[CUBE_SIZE * 0.75, 0.008, 8, 64]} />
    </mesh>
  );
}

/* ─── Data Stream Particles ─── */
function DataStreamParticles() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const particleCount = 200;

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      pos[i * 3 + 1] = Math.random() * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    return { positions: pos, speeds: spd };
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float speed;
      uniform float uTime;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        float cycle = fract(pos.y / 1.5 + uTime * speed * 0.3);
        pos.y = cycle * 1.5;
        vAlpha = (1.0 - cycle) * uOpacity;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (1.0 - cycle) * 3.0 + 1.0;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float c = smoothstep(1.0, 0.3, d);
        gl_FragColor = vec4(1.0, 0.6, 0.15, c * vAlpha * 0.6);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.dataStream ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points material={material} position={[0, CUBE_Y + CUBE_SIZE * 0.5, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
      </bufferGeometry>
    </points>
  );
}

/* ─── Ground Connection Beam ─── */
function GroundConnectionBeam() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float centerFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
        float heightFade = pow(1.0 - vUv.y, 1.5);
        float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + vUv.y * 8.0);
        float alpha = centerFade * heightFade * pulse * uOpacity * 0.3;
        vec3 col = vec3(1.0, 0.55, 0.1);
        gl_FragColor = vec4(col * 2.0, alpha);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.groundBeam ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
    // Hide from Reflector when inactive to avoid clip plane artifacts
    if (meshRef.current) meshRef.current.visible = t > 0.01;
  });

  // Raise beam above ground plane (y=0.02) to avoid Reflector clip plane intersection
  const beamHeight = CUBE_Y - 0.02;

  return (
    <mesh ref={meshRef} material={material} position={[0, 0.02 + beamHeight / 2, 0]} visible={false}>
      <planeGeometry args={[CUBE_SIZE * 0.3, beamHeight]} />
    </mesh>
  );
}

/* ─── Ground ─── */
function Ground() {
  return (
    <group>
      <ReflectiveGround />
      <GroundLightPool />
      <GroundParticles />
      <TraceLines />
    </group>
  );
}

/* ─── Control Panel ─── */
function ControlPanel({ toggles, onToggle }: {
  toggles: Record<EffectKey, boolean>;
  onToggle: (key: EffectKey) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: 'rgba(10, 8, 5, 0.85)',
      border: '1px solid rgba(255, 150, 50, 0.25)',
      borderRadius: 8,
      padding: collapsed ? '8px 14px' : '12px 16px',
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'rgba(255, 200, 140, 0.7)',
      backdropFilter: 'blur(10px)',
      userSelect: 'none',
      minWidth: 180,
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span style={{
          display: 'inline-block',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: 10,
        }}>&#9660;</span>
        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>Hover Effects</span>
      </div>

      {/* Toggle list */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ALL_EFFECTS.map(key => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <span style={{
                opacity: toggles[key] ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}>
                {EFFECT_LABELS[key]}
              </span>
              <div
                onClick={() => onToggle(key)}
                style={{
                  width: 32, height: 16, borderRadius: 8,
                  background: toggles[key] ? 'rgba(255, 136, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${toggles[key] ? 'rgba(255, 136, 0, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: toggles[key] ? '#ff8800' : 'rgba(255, 255, 255, 0.25)',
                  position: 'absolute', top: 2,
                  left: toggles[key] ? 19 : 2,
                  transition: 'left 0.2s ease, background 0.2s',
                  boxShadow: toggles[key] ? '0 0 6px rgba(255, 136, 0, 0.5)' : 'none',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Selected Control Panel ─── */
function SelectedControlPanel({ toggles, onToggle }: {
  toggles: Record<SelectEffectKey, boolean>;
  onToggle: (key: SelectEffectKey) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: 'rgba(10, 8, 5, 0.85)',
      border: '1px solid rgba(255, 150, 50, 0.25)',
      borderRadius: 8,
      padding: collapsed ? '8px 14px' : '12px 16px',
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'rgba(255, 200, 140, 0.7)',
      backdropFilter: 'blur(10px)',
      userSelect: 'none',
      minWidth: 180,
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span style={{
          display: 'inline-block',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: 10,
        }}>&#9660;</span>
        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>Selected Effects</span>
      </div>

      {/* Toggle list */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ALL_SELECT_EFFECTS.map(key => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <span style={{
                opacity: toggles[key] ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}>
                {SELECT_EFFECT_LABELS[key]}
              </span>
              <div
                onClick={() => onToggle(key)}
                style={{
                  width: 32, height: 16, borderRadius: 8,
                  background: toggles[key] ? 'rgba(255, 136, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${toggles[key] ? 'rgba(255, 136, 0, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: toggles[key] ? '#ff8800' : 'rgba(255, 255, 255, 0.25)',
                  position: 'absolute', top: 2,
                  left: toggles[key] ? 19 : 2,
                  transition: 'left 0.2s ease, background 0.2s',
                  boxShadow: toggles[key] ? '0 0 6px rgba(255, 136, 0, 0.5)' : 'none',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [isOrtho, setIsOrtho] = useState(true);
  const [toggles, setToggles] = useState<Record<EffectKey, boolean>>({ ...DEFAULT_TOGGLES });
  const [selected, setSelected] = useState(false);
  const [selectToggles, setSelectToggles] = useState<Record<SelectEffectKey, boolean>>({ ...DEFAULT_SELECT_TOGGLES });

  const togglesRef = useRef(toggles);
  togglesRef.current = toggles;
  const hoverTRef = useRef(0);

  const selectTogglesRef = useRef(selectToggles);
  selectTogglesRef.current = selectToggles;
  const selectedTRef = useRef(0);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const onSelect = useCallback(() => setSelected(true), []);
  const onDeselect = useCallback(() => setSelected(false), []);

  const cubeCtx = useMemo<CubeContextType>(() => ({
    togglesRef,
    hoverTRef,
    selectTogglesRef,
    selectedTRef,
    onSelect,
    onDeselect,
    tooltipRef,
  }), []);

  const toggleCamera = useCallback(() => setIsOrtho(prev => !prev), []);
  const toggleEffect = useCallback((key: EffectKey) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const toggleSelectEffect = useCallback((key: SelectEffectKey) => {
    setSelectToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') toggleCamera();
      if (e.key === 'Escape') onDeselect();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCamera, onDeselect]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.6 }}>
        <color attach="background" args={['#010103']} />

        <CubeContext.Provider value={cubeCtx}>
          {isOrtho ? (
            <OrthographicCamera makeDefault position={[6, 6, 6]} zoom={80} near={-100} far={100} />
          ) : (
            <PerspectiveCamera makeDefault position={[0, 0.8, 4.5]} fov={32} near={0.1} far={100} />
          )}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 - 0.05}
            target={isOrtho ? [0, 0.3, 0] : [0, 0.5, 0]}
            minDistance={isOrtho ? undefined : 2}
            maxDistance={isOrtho ? undefined : 12}
          />

          <ambientLight color={0x0a0a18} intensity={0.15} />
          <SceneLights />

          <HoverDetector selected={selected} />
          <GlowingCube />
          <OrbitRing />
          <DataStreamParticles />
          <GroundConnectionBeam />
          <Ground />

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </CubeContext.Provider>
      </Canvas>

      {/* Hover tooltip - positioned by HoverDetector via ref */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 900,
          fontFamily: 'monospace',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(10, 8, 5, 0.88)',
          border: '1px solid rgba(255, 150, 50, 0.25)',
          borderRadius: 6,
          padding: '6px 12px',
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'rgba(255, 200, 140, 0.9)', fontWeight: 'bold' }}>
          {EC2_DATA.instance_type}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: '#44ff88',
            boxShadow: '0 0 6px rgba(68, 255, 136, 0.4)',
            display: 'inline-block',
          }} />
          <span style={{ color: '#44ff88', fontSize: 11 }}>{EC2_DATA.state}</span>
        </span>
      </div>

      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <ControlPanel toggles={toggles} onToggle={toggleEffect} />
        <SelectedControlPanel toggles={selectToggles} onToggle={toggleSelectEffect} />
      </div>
      <ServiceInfoCard selected={selected} onClose={onDeselect} />

      <button
        onClick={toggleCamera}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255, 200, 140, 0.8)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)'; }}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 1000,
          background: 'none', border: 'none',
          color: isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)',
          fontFamily: 'monospace', fontSize: 13, cursor: 'pointer',
          transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center',
        }}
      >
        <span style={{
          border: '1px solid rgba(255, 200, 140, 0.4)',
          borderRadius: 3, padding: '1px 5px',
          fontWeight: 'bold', marginRight: 6,
        }}>C</span>
        Camera
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
