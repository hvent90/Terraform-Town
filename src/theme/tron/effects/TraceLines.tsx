import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import traceVert from '../shaders/trace.vert.glsl';
import traceFrag from '../shaders/trace.frag.glsl';
import { TRACE_COLOR, TRACE_WARM, TRACE_COOL } from '../colors';
import { CUBE_SIZE } from '../../../shared/geometry';
import { useSceneContext } from '../../../shared/context';

// @ts-ignore
import GEIST_PIXEL_GRID from '../../../assets/fonts/GeistPixel-Grid.ttf';

export function TraceLines() {
  const { togglesRef, hoverTRef, selectTogglesRef, selectedTRef } = useSceneContext();
  const pulseTimeRef = useRef(0);
  const selectPulseTimeRef = useRef(0);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(TRACE_COLOR) },
      fadeDistance: { value: 7.5 },
      uBorderDist: { value: CUBE_SIZE / 2 + 0.08 },
      uPulseAlpha: { value: 0 },
      uPulseTime: { value: 0 },
      uSelectPulseAlpha: { value: 0 },
      uSelectPulseTime: { value: 0 },
    },
    vertexShader: traceVert,
    fragmentShader: traceFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  useFrame((_, delta) => {
    const toggles = togglesRef.current;
    const h = hoverTRef.current;

    // Pulse
    const pulseT = toggles.tracePulse ? h : 0;
    if (pulseT > 0.01) pulseTimeRef.current += delta * pulseT;
    material.uniforms.uPulseAlpha.value = pulseT;
    material.uniforms.uPulseTime.value = pulseTimeRef.current;

    // Color temp
    const colorT = toggles.colorTemp ? h : 0;
    tmpColor.copy(TRACE_WARM).lerp(TRACE_COOL, colorT);
    material.uniforms.color.value.copy(tmpColor);

    // Trace activation
    const selectTraceT = selectTogglesRef.current.traceActivation ? selectedTRef.current : 0;
    if (selectTraceT > 0.01) selectPulseTimeRef.current += delta;
    else selectPulseTimeRef.current = 0;
    material.uniforms.uSelectPulseAlpha.value = selectTraceT;
    material.uniforms.uSelectPulseTime.value = selectPulseTimeRef.current;
  });

  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Z-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half + 3.75]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Z-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(half + 3.75)]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half + 3.75, 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-(half + 3.75), 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Front border (z+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Back border (z-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Right border (x+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Left border (x-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* EC2 label */}
      <Text
        font={GEIST_PIXEL_GRID}
        fontSize={0.45}
        position={[0, -0.05, -(half + 1.2)]}
        rotation={[0, Math.PI / 2, 0]}
        anchorX="center"
        anchorY="bottom"
        color={TRACE_COLOR}
      >
        EC2
        <meshBasicMaterial color={TRACE_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </Text>
    </group>
  );
}
