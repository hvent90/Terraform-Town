import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useContext } from 'react';
import * as THREE from 'three';
import { createOrbitRingMaterial } from '../shaders/orbit-ring.tsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext, getEffectT, ResourceIdContext } from '../../../shared/context';

export function OrbitRing() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const ringRef = useRef<THREE.Mesh>(null);

  const { material, uniforms } = useMemo(() => createOrbitRingMaterial(), []);

  useFrame(({ clock }) => {
    uniforms.uOpacity.value = getEffectT(ctx, 'orbitRing', resourceId);
    uniforms.uTime.value = clock.getElapsedTime();
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
