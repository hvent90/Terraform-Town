import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import dataStreamVert from '../shaders/data-stream.vert.glsl';
import dataStreamFrag from '../shaders/data-stream.frag.glsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext } from '../../../shared/context';

export function DataStreamParticles() {
  const { selectTogglesRef, selectedTRef } = useSceneContext();
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
    vertexShader: dataStreamVert,
    fragmentShader: dataStreamFrag,
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
