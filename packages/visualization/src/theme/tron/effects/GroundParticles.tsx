import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useContext } from 'react';
import { createGroundParticlesMaterial } from '../shaders/ground-particles.tsl';
import { AMBER_WARM, COOL_BLUE_BRIGHT, RESOURCE_COLORS, DEFAULT_RESOURCE_COLORS } from '../colors';
import { useSceneContext, getEffectT, ResourceTypeContext } from '../../../shared/context';
import { useFrustumVisible } from '../../../shared/useFrustumVisible';

export function GroundParticles() {
  const groupRef = useFrustumVisible(5);
  const ctx = useSceneContext();
  const resourceType = useContext(ResourceTypeContext);
  const typeColors = resourceType ? (RESOURCE_COLORS[resourceType] ?? DEFAULT_RESOURCE_COLORS) : null;
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const particleCount = 3000;

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
    const sizes = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 2.2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.005 + Math.random() * 0.01;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      sizes[i] = 0.2 + Math.random() * 0.4;
      const falloff = Math.max(0, 1 - (r - 0.6) / 2.2);
      alphas[i] = (0.1 + Math.random() * 0.5) * falloff * falloff;
    }

    geo.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(positions, 3));
    geo.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(sizes, 1));
    geo.setAttribute('instanceAlpha', new THREE.InstancedBufferAttribute(alphas, 1));
    geo.instanceCount = particleCount;

    return { geometry: geo };
  }, []);

  const { material, uniforms } = useMemo(() => createGroundParticlesMaterial(), []);

  useFrame(({ clock, camera }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    if ((camera as THREE.OrthographicCamera).zoom) {
      uniforms.uZoom.value = (camera as THREE.OrthographicCamera).zoom;
    }

    // Particle attraction
    uniforms.uHover.value = getEffectT(ctx, 'particleAttract');

    // Color: use resource trace color when inside a resource actor, otherwise color temp
    if (typeColors) {
      uniforms.uColor.value.copy(typeColors.trace);
    } else {
      const colorT = getEffectT(ctx, 'colorTemp');
      tmpColor.copy(AMBER_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
      uniforms.uColor.value.copy(tmpColor);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh material={material} geometry={geometry} />
    </group>
  );
}
