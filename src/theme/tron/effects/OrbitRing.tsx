import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import orbitRingVert from '../shaders/orbit-ring.vert.glsl';
import orbitRingFrag from '../shaders/orbit-ring.frag.glsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext } from '../../../shared/context';

export function OrbitRing() {
  const { selectTogglesRef, selectedTRef } = useSceneContext();
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
    vertexShader: orbitRingVert,
    fragmentShader: orbitRingFrag,
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
    <group position={[0, CUBE_Y, 0]} rotation={[Math.PI / 10, 0, Math.PI / 16]}>
      <mesh ref={ringRef} material={material}>
        <torusGeometry args={[CUBE_SIZE * 0.75, 0.008, 8, 64]} />
      </mesh>
    </group>
  );
}
