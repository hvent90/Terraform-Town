import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef, useContext } from 'react';
import { CUBE_SIZE, CUBE_Y } from '../../../shared/geometry';
import { useSceneContext, ResourceIdContext } from '../../../shared/context';

const _projVec = new THREE.Vector3();

export function HoverDetector() {
  const { hoverTRef, selectedRef, selectedTRef, onSelect, onDeselect, setHoveredResourceId, tooltipRef } = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const hoveredRef = useRef(false);

  useFrame(({ camera, gl }, delta) => {
    const target = hoveredRef.current ? 1 : 0;
    hoverTRef.current += (target - hoverTRef.current) * Math.min(1, delta * 25);

    const selectTarget = selectedRef.current ? 1 : 0;
    selectedTRef.current += (selectTarget - selectedTRef.current) * Math.min(1, delta * 8);

    // Project cube top-right to screen space for tooltip
    if (tooltipRef.current) {
      const t = hoverTRef.current;
      _projVec.set(CUBE_SIZE * 0.5, CUBE_Y + CUBE_SIZE * 0.5, 0).project(camera);
      const canvas = gl.domElement;
      const x = (_projVec.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-_projVec.y * 0.5 + 0.5) * canvas.clientHeight;
      tooltipRef.current.style.left = `${x + 16}px`;
      tooltipRef.current.style.top = `${y - 12}px`;
      tooltipRef.current.style.opacity = String(t);
      tooltipRef.current.style.transform = `translateY(${(1 - t) * 6}px)`;
    }
  });

  return (
    <mesh
      onPointerEnter={() => { hoveredRef.current = true; setHoveredResourceId(resourceId); }}
      onPointerLeave={() => { hoveredRef.current = false; setHoveredResourceId(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect(resourceId); }}
      onPointerMissed={() => onDeselect()}
      position={[0, CUBE_Y, 0]}
    >
      <boxGeometry args={[CUBE_SIZE * 1.5, CUBE_SIZE * 1.5, CUBE_SIZE * 1.5]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
