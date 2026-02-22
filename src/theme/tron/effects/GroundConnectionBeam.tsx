import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import groundBeamVert from '../shaders/ground-beam.vert.glsl';
import groundBeamFrag from '../shaders/ground-beam.frag.glsl';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext } from '../../../shared/context';

export function GroundConnectionBeam() {
  const { selectTogglesRef, selectedTRef } = useSceneContext();
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: groundBeamVert,
    fragmentShader: groundBeamFrag,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.groundBeam ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.visible = t > 0.01;
  });

  const beamHeight = CUBE_Y - 0.04;

  return (
    <mesh ref={meshRef} material={material} position={[0, 0.02 + beamHeight / 2, 0]} visible={false}>
      <planeGeometry args={[CUBE_SIZE * 0.25, beamHeight]} />
    </mesh>
  );
}
