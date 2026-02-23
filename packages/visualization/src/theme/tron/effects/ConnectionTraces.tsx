import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createConnectionTraceMaterial } from '../shaders/connection-trace.tsl';
import { TRACE_WARM, STATUS_GREEN } from '../colors';
import { useSceneContext } from '../../../shared/context';
import { manhattanRoute } from '../../../routing/manhattanRoute';
import type { ConnectionType } from '../../../types';

const LINE_WIDTH = 0.06;
const GROUND_Y = 0.015;

const CONNECTION_STYLES: Record<ConnectionType, {
  color: THREE.Color;
  dashScale: number;
  pulseSpeed: number;
}> = {
  reference: { color: TRACE_WARM, dashScale: 0, pulseSpeed: 1.0 },
  attachment: { color: new THREE.Color(0xffaa44), dashScale: 8, pulseSpeed: 0.8 },
  dataflow: { color: STATUS_GREEN, dashScale: 16, pulseSpeed: 1.2 },
};

interface SegmentData {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  connectionIndex: number;
}

interface ConnectionMaterialEntry {
  material: ReturnType<typeof createConnectionTraceMaterial>['material'];
  uniforms: ReturnType<typeof createConnectionTraceMaterial>['uniforms'];
  from: string;
  to: string;
}

export function ConnectionTraces() {
  const ctx = useSceneContext();
  const prevConnectionsLen = useRef(0);
  const prevPositionsSize = useRef(0);
  const [version, setVersion] = useState(0);

  // Track version to trigger useMemo rebuild when refs change.
  // useFrame detects ref changes and bumps version via setState,
  // which triggers a re-render and useMemo recomputes.
  const [segmentMeshes, materialEntries] = useMemo(() => {
    const connections = ctx.connectionsRef.current;
    const positions = ctx.resourcePositionsRef.current;

    if (connections.length === 0 || positions.size === 0) {
      return [[] as SegmentData[], [] as ConnectionMaterialEntry[]];
    }

    const segments: SegmentData[] = [];
    const materials: ConnectionMaterialEntry[] = [];

    for (let ci = 0; ci < connections.length; ci++) {
      const conn = connections[ci];
      const fromPos = positions.get(conn.from);
      const toPos = positions.get(conn.to);
      if (!fromPos || !toPos) continue;

      const style = CONNECTION_STYLES[conn.type] ?? CONNECTION_STYLES.reference;
      const { material, uniforms } = createConnectionTraceMaterial();
      uniforms.uColor.value.copy(style.color);
      uniforms.uDashScale.value = style.dashScale;
      uniforms.uPulseSpeed.value = style.pulseSpeed;

      materials.push({ material, uniforms, from: conn.from, to: conn.to });

      const route = manhattanRoute(fromPos, toPos, ci);
      if (route.length < 2) continue;

      for (let i = 0; i < route.length - 1; i++) {
        const [ax, , az] = route[i];
        const [bx, , bz] = route[i + 1];
        const dx = bx - ax;
        const dz = bz - az;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.001) continue;

        const cx = (ax + bx) / 2;
        const cz = (az + bz) / 2;

        // Rotation: plane lies flat on ground (rotated -PI/2 around X),
        // then rotated around Y to align with segment direction.
        const angle = Math.atan2(dx, dz);

        segments.push({
          position: [cx, GROUND_Y, cz],
          rotation: [-Math.PI / 2, 0, angle],
          length,
          connectionIndex: materials.length - 1,
        });
      }
    }

    return [segments, materials];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useFrame(({ clock }) => {
    // Detect ref changes and bump version to trigger rebuild
    const connections = ctx.connectionsRef.current;
    const positions = ctx.resourcePositionsRef.current;
    if (connections.length !== prevConnectionsLen.current || positions.size !== prevPositionsSize.current) {
      prevConnectionsLen.current = connections.length;
      prevPositionsSize.current = positions.size;
      setVersion(v => v + 1);
    }

    const hoveredId = ctx.hoveredResourceIdRef.current;
    const selectedId = ctx.selectedResourceIdRef.current;
    const t = clock.getElapsedTime();

    for (const entry of materialEntries) {
      const isActive =
        entry.from === hoveredId || entry.to === hoveredId ||
        entry.from === selectedId || entry.to === selectedId;
      entry.uniforms.uActive.value = isActive ? 1.0 : 0.0;
      entry.uniforms.uTime.value = t;
    }
  });

  if (segmentMeshes.length === 0) return null;

  return (
    <group>
      {segmentMeshes.map((seg, i) => (
        <mesh
          key={i}
          material={materialEntries[seg.connectionIndex].material}
          position={seg.position}
          rotation={seg.rotation}
        >
          <planeGeometry args={[LINE_WIDTH, seg.length]} />
        </mesh>
      ))}
    </group>
  );
}
