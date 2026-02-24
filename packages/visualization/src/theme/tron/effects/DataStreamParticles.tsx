import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useContext } from 'react';
import { createDataStreamMaterial } from '../shaders/data-stream.tsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext, getEffectT, ResourceIdContext } from '../../../shared/context';

export function DataStreamParticles() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const particleCount = 200;

  const { geometry } = useMemo(() => {
    // Base quad for billboarding
    const quadPos = new Float32Array([-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]);
    const quadUV = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const quadIdx = [0, 2, 1, 2, 3, 1];

    const geo = new THREE.InstancedBufferGeometry();
    geo.setIndex(quadIdx);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(quadPos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(quadUV, 2));

    // Per-instance attributes
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    geo.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(positions, 3));
    geo.setAttribute('instanceSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
    geo.instanceCount = particleCount;

    return { geometry: geo };
  }, []);

  const { material, uniforms } = useMemo(() => createDataStreamMaterial(), []);

  useFrame(({ clock }) => {
    uniforms.uOpacity.value = getEffectT(ctx, 'dataStream', resourceId);
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh material={material} geometry={geometry} position={[0, CUBE_Y + CUBE_SIZE * 0.5, 0]} />
  );
}
