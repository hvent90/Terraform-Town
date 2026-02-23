import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { createGroundLightPoolMaterial } from '../shaders/ground-light-pool.tsl';
import { AMBER, LIGHT_POOL_BRIGHT, COOL_BLUE, COOL_WHITE } from '../colors';
import { useSceneContext, getEffectT } from '../../../shared/context';

export function GroundLightPool() {
  const ctx = useSceneContext();
  const tmpColor1 = useMemo(() => new THREE.Color(), []);
  const tmpColor2 = useMemo(() => new THREE.Color(), []);

  const { material, uniforms } = useMemo(() => createGroundLightPoolMaterial(), []);

  useFrame(() => {
    const colorT = getEffectT(ctx, 'colorTemp');
    tmpColor1.copy(AMBER).lerp(COOL_BLUE, colorT);
    uniforms.uColor.value.copy(tmpColor1);
    tmpColor2.copy(LIGHT_POOL_BRIGHT).lerp(COOL_WHITE, colorT);
    uniforms.uColorBright.value.copy(tmpColor2);
  });

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <planeGeometry args={[16, 16]} />
    </mesh>
  );
}
