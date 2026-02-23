import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneContext, getEffectT } from '../../shared/context';
import { AMBER, COOL_BLUE } from './colors';

export function SceneLights() {
  const ctx = useSceneContext();
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const colorT = getEffectT(ctx, 'colorTemp');
    tmpColor.copy(AMBER).lerp(COOL_BLUE, colorT);
    light1.current?.color.copy(tmpColor);
    light2.current?.color.copy(tmpColor);
  });

  return (
    <>
      <ambientLight color={0x0a0a18} intensity={0.15} />
      <pointLight ref={light1} color={AMBER} intensity={0.5} distance={3} decay={2} position={[0, 0.45, 0]} />
      <pointLight ref={light2} color={AMBER} intensity={0.2} distance={2} decay={2} position={[0, 0.05, 0]} />
    </>
  );
}
