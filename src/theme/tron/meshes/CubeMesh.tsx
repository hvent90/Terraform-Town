import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import faceVert from '../shaders/face.vert.glsl';
import faceFrag from '../shaders/face.frag.glsl';
import edgeVert from '../shaders/edge.vert.glsl';
import edgeFrag from '../shaders/edge.frag.glsl';
import {
  FACE_INNER_WARM, WHITE_HOT, AMBER_WARM,
  COOL_BLUE_BRIGHT, FACE_INNER_COOL, COOL_WHITE,
  HALO_WARM, STATUS_GREEN, STATUS_GREEN_BRIGHT,
} from '../colors';
import { CUBE_SIZE, CUBE_Y, faceConfigs, createHaloTexture } from '../../../shared/geometry';
import { useSceneContext } from '../../../shared/context';

/* ─── CubeFace (shared material) ─── */
function CubeFace({ rot, pos, material }: { rot: [number, number, number]; pos: [number, number, number]; material: THREE.ShaderMaterial }) {
  return (
    <mesh material={material} position={pos} rotation={rot}>
      <planeGeometry args={[CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  );
}

/* ─── CubeMesh ─── */
export function CubeMesh() {
  const { togglesRef, hoverTRef, selectTogglesRef, selectedTRef } = useSceneContext();
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
    vertexShader: faceVert,
    fragmentShader: faceFrag,
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
    vertexShader: edgeVert,
    fragmentShader: edgeFrag,
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

    // Holographic flicker
    faceMat.uniforms.uHoloFlicker.value = selectToggles.holoFlicker ? s : 0;

    // Face data overlay
    faceMat.uniforms.uDataOverlay.value = selectToggles.faceDataOverlay ? s : 0;

    // Edge highlight pulse
    const edgePulseT = selectToggles.edgePulse ? s : 0;
    if (edgePulseT > 0.01) selectTimeRef.current += delta;
    else selectTimeRef.current = 0;
    edgesMat.uniforms.uSelectEdgePulse.value = edgePulseT;
    edgesMat.uniforms.uSelectTime.value = selectTimeRef.current;

    // Status glow shift
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
      const hs = 1.2 + haloT * 0.6;
      haloRef.current.scale.set(hs, hs, 1);
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
