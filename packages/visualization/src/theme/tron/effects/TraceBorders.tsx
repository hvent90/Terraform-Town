import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useContext } from 'react';
import { createTraceMaterial } from '../shaders/trace.tsl';
import { TRACE_WARM, TRACE_COOL } from '../colors';
import { CUBE_SIZE } from '../../../shared/geometry';
import { useSceneContext, getEffectT, ResourceIdContext } from '../../../shared/context';

export function TraceBorders() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const pulseTimeRef = useRef(0);
  const selectPulseTimeRef = useRef(0);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const { borderMat, borderUniforms } = useMemo(() => {
    const border = createTraceMaterial('y');
    border.uniforms.uBorderDist.value = CUBE_SIZE / 2 + 0.08;
    return { borderMat: border.material, borderUniforms: border.uniforms };
  }, []);

  useFrame((_, delta) => {
    const pulseT = getEffectT(ctx, 'tracePulse', resourceId);
    if (pulseT > 0.01) pulseTimeRef.current += delta * pulseT;

    const colorT = getEffectT(ctx, 'colorTemp', resourceId);
    tmpColor.copy(TRACE_WARM).lerp(TRACE_COOL, colorT);

    const selectTraceT = getEffectT(ctx, 'traceActivation', resourceId);
    if (selectTraceT > 0.01) selectPulseTimeRef.current += delta;
    else selectPulseTimeRef.current = 0;

    borderUniforms.uPulseAlpha.value = pulseT;
    borderUniforms.uPulseTime.value = pulseTimeRef.current;
    borderUniforms.uColor.value.copy(tmpColor);
    borderUniforms.uSelectPulseAlpha.value = selectTraceT;
    borderUniforms.uSelectPulseTime.value = selectPulseTimeRef.current;
  });

  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;
  const borderW = 0.08;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Front border (z+) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Back border (z-) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -half]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Right border (x+) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half, 0, 0]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
      {/* Left border (x-) */}
      <mesh material={borderMat} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-half, 0, 0]}>
        <planeGeometry args={[borderLen, borderW]} />
      </mesh>
    </group>
  );
}
