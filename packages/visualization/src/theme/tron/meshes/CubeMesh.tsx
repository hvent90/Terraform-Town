import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useContext } from 'react';
import { createFaceMaterial } from '../shaders/face.tsl';
import { createEdgeMaterial } from '../shaders/edge.tsl';
import {
  FACE_INNER_WARM, WHITE_HOT, AMBER_WARM,
  COOL_BLUE_BRIGHT, FACE_INNER_COOL, COOL_WHITE,
  HALO_WARM, STATUS_GREEN, STATUS_GREEN_BRIGHT,
} from '../colors';
import { CUBE_SIZE, CUBE_Y, faceConfigs, createHaloTexture } from '../../../shared/geometry';
import { useSceneContext, getEffectT, ResourceIdContext } from '../../../shared/context';
import { TraceBorders } from '../effects/TraceBorders';

/* ─── CubeFace (shared material) ─── */
function CubeFace({ rot, pos, material }: { rot: [number, number, number]; pos: [number, number, number]; material: THREE.Material }) {
  return (
    <mesh material={material} position={pos} rotation={rot}>
      <planeGeometry args={[CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  );
}

/* ─── CubeMesh ─── */
export function CubeMesh() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const groupRef = useRef<THREE.Group>(null);
  const facesRef = useRef<THREE.Group>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMatRef = useRef<THREE.SpriteMaterial>(null);


  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);
  const tmpColor3 = useMemo(() => new THREE.Color(), []);

  // Face material (shared across all 6 faces)
  const { material: faceMat, uniforms: faceUni } = useMemo(() => createFaceMaterial(), []);

  const edgesGeo = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)), []);

  const { material: edgesMat, uniforms: edgeUni } = useMemo(() => {
    const result = createEdgeMaterial();
    result.uniforms.uCubeY.value = CUBE_Y;
    result.uniforms.uCubeSize.value = CUBE_SIZE;
    return result;
  }, []);

  const haloTexture = useMemo(() => createHaloTexture(), []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // Face material uniforms
    faceUni.uCameraPos.value.copy(camera.position);
    faceUni.uTime.value = t;
    faceUni.uHover.value = getEffectT(ctx, 'faceOpacity', resourceId);
    faceUni.uSeparation.value = getEffectT(ctx, 'faceSeparation', resourceId) * 0.08;

    // Color temp - face colors
    const colorT = getEffectT(ctx, 'colorTemp', resourceId);
    tmpColor1.copy(FACE_INNER_WARM).lerp(FACE_INNER_COOL, colorT);
    faceUni.uColorInner.value.copy(tmpColor1);
    tmpColor2.copy(WHITE_HOT).lerp(COOL_WHITE, colorT);
    faceUni.uColorEdge.value.copy(tmpColor2);

    // Edge material - color temp, then edge intensify
    const edgeT = getEffectT(ctx, 'edgeIntensify', resourceId);
    tmpColor1.copy(AMBER_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
    edgeUni.uColorBot.value.copy(tmpColor1);
    edgeUni.uHover.value = edgeT;
    edgeUni.uEdgeIntensify.value = edgeT;

    // Holographic flicker
    faceUni.uHoloFlicker.value = getEffectT(ctx, 'holoFlicker', resourceId);

    // Face data overlay
    faceUni.uDataOverlay.value = getEffectT(ctx, 'faceDataOverlay', resourceId);

    // Status glow shift
    const statusT = getEffectT(ctx, 'statusGlow', resourceId);
    if (statusT > 0.001) {
      faceUni.uColorInner.value.lerp(STATUS_GREEN, statusT * 0.4);
      faceUni.uColorEdge.value.lerp(STATUS_GREEN_BRIGHT, statusT * 0.3);
      edgeUni.uColorBot.value.lerp(STATUS_GREEN, statusT * 0.3);
    }

    // Breathing animation
    const breathT = getEffectT(ctx, 'breathingAmp', resourceId);
    if (breathT > 0.001) {
      const b = 1 + Math.sin(t * 1.2) * breathT * 0.03;
      facesRef.current?.scale.setScalar(b);
      edgesRef.current?.scale.setScalar(b);
    } else {
      facesRef.current?.scale.setScalar(1);
      edgesRef.current?.scale.setScalar(1);
    }

    // Lift
    const liftT = getEffectT(ctx, 'lift', resourceId);
    if (groupRef.current) {
      groupRef.current.position.y = liftT * 0.1;
    }

    // Halo bloom
    const haloT = getEffectT(ctx, 'haloBloom', resourceId);
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
    <>
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

      {/* Ground border (stays grounded, unaffected by lift) */}
      <TraceBorders />
    </>
  );
}
