import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import groundLightPoolVert from '../shaders/ground-light-pool.vert.glsl';
import groundLightPoolFrag from '../shaders/ground-light-pool.frag.glsl';
import { AMBER, LIGHT_POOL_BRIGHT, COOL_BLUE, COOL_WHITE } from '../colors';
import { useSceneContext } from '../../../shared/context';

export function GroundLightPool() {
  const { togglesRef, hoverTRef } = useSceneContext();
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
    vertexShader: groundLightPoolVert,
    fragmentShader: groundLightPoolFrag,
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
