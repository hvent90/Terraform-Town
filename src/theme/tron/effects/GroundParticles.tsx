import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import groundParticlesVert from '../shaders/ground-particles.vert.glsl';
import groundParticlesFrag from '../shaders/ground-particles.frag.glsl';
import { AMBER_WARM, COOL_BLUE_BRIGHT } from '../colors';
import { useSceneContext } from '../../../shared/context';

export function GroundParticles() {
  const { togglesRef, hoverTRef } = useSceneContext();
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const particleCount = 3000;

  const { positions, sizes, alphas } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const al = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 2.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = 0.005 + Math.random() * 0.01;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      sz[i] = 0.2 + Math.random() * 0.4;
      const falloff = Math.max(0, 1 - (r - 0.6) / 2.2);
      al[i] = (0.1 + Math.random() * 0.5) * falloff * falloff;
    }
    return { positions: pos, sizes: sz, alphas: al };
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: AMBER_WARM.clone() },
      uTime: { value: 0 },
      uZoom: { value: 80.0 },
      uHover: { value: 0 },
    },
    vertexShader: groundParticlesVert,
    fragmentShader: groundParticlesFrag,
  }), []);

  useFrame(({ clock, camera }) => {
    const toggles = togglesRef.current;
    const h = hoverTRef.current;

    material.uniforms.uTime.value = clock.getElapsedTime();
    if ((camera as THREE.OrthographicCamera).zoom) {
      material.uniforms.uZoom.value = (camera as THREE.OrthographicCamera).zoom;
    }

    // Particle attraction
    material.uniforms.uHover.value = toggles.particleAttract ? h : 0;

    // Color temp
    const colorT = toggles.colorTemp ? h : 0;
    tmpColor.copy(AMBER_WARM).lerp(COOL_BLUE_BRIGHT, colorT);
    material.uniforms.uColor.value.copy(tmpColor);
  });

  return (
    <points material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-alpha" args={[alphas, 1]} />
      </bufferGeometry>
    </points>
  );
}
