import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useContext } from 'react';
import * as THREE from 'three';
import { createGroundBeamMaterial } from '../shaders/ground-beam.tsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext, getEffectT, ResourceIdContext } from '../../../shared/context';

export function GroundConnectionBeam() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const meshRef = useRef<THREE.Mesh>(null);

  const { material, uniforms } = useMemo(() => createGroundBeamMaterial(), []);

  useFrame(({ clock }) => {
    const t = getEffectT(ctx, 'groundBeam', resourceId);
    uniforms.uOpacity.value = t;
    uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.visible = t > 0.01;
  });

  const beamHeight = CUBE_Y - 0.04;

  return (
    <mesh ref={meshRef} material={material} position={[0, 0.02 + beamHeight / 2, 0]} visible={false}>
      <planeGeometry args={[CUBE_SIZE * 0.25, beamHeight]} />
    </mesh>
  );
}
