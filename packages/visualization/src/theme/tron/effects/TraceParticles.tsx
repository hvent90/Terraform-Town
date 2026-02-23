import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { createTraceParticlesMaterial } from '../shaders/trace-particles.tsl';
import { TRACE_WARM, STATUS_GREEN } from '../colors';
import { useSceneContext } from '../../../shared/context';
import { manhattanRoute } from '../../../routing/manhattanRoute';
import type { ConnectionType } from '../../../types';

const PARTICLES_PER_CONNECTION = 12;
const PARTICLE_BASE_SPEED = 0.15;

const CONNECTION_COLORS: Record<ConnectionType, THREE.Color> = {
  reference: TRACE_WARM,
  attachment: new THREE.Color(0xffaa44),
  dataflow: STATUS_GREEN,
};

type Vec3 = [number, number, number];

/** Interpolate a position along a polyline given t in [0,1]. */
function samplePath(waypoints: Vec3[], t: number): Vec3 {
  if (waypoints.length < 2) return waypoints[0] ?? [0, 0, 0];

  // Compute cumulative segment lengths
  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const [ax, ay, az] = waypoints[i - 1];
    const [bx, by, bz] = waypoints[i];
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    lengths.push(len);
    totalLength += len;
  }

  if (totalLength < 0.0001) return waypoints[0];

  const targetDist = t * totalLength;
  let accumulated = 0;

  for (let i = 0; i < lengths.length; i++) {
    const segLen = lengths[i];
    if (accumulated + segLen >= targetDist) {
      const segT = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      const [ax, ay, az] = waypoints[i];
      const [bx, by, bz] = waypoints[i + 1];
      return [
        ax + (bx - ax) * segT,
        ay + (by - ay) * segT,
        az + (bz - az) * segT,
      ];
    }
    accumulated += segLen;
  }

  return waypoints[waypoints.length - 1];
}

interface ConnectionParticles {
  geometry: THREE.InstancedBufferGeometry;
  material: ReturnType<typeof createTraceParticlesMaterial>['material'];
  uniforms: ReturnType<typeof createTraceParticlesMaterial>['uniforms'];
  positionAttr: THREE.InstancedBufferAttribute;
  waypoints: Vec3[];
  offsets: Float32Array; // per-particle phase offset (0-1)
  speeds: Float32Array;  // per-particle speed multiplier
  from: string;
  to: string;
}

export function TraceParticles() {
  const ctx = useSceneContext();
  const prevConnectionsLen = useRef(0);
  const prevPositionsSize = useRef(0);
  const [version, setVersion] = useState(0);

  const connectionParticles = useMemo(() => {
    const connections = ctx.connectionsRef.current;
    const positions = ctx.resourcePositionsRef.current;

    if (connections.length === 0 || positions.size === 0) return [];

    // Shared base quad
    const quadPos = new Float32Array([-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]);
    const quadUV = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const quadIdx = [0, 2, 1, 2, 3, 1];

    const result: ConnectionParticles[] = [];

    for (let ci = 0; ci < connections.length; ci++) {
      const conn = connections[ci];
      const fromPos = positions.get(conn.from);
      const toPos = positions.get(conn.to);
      if (!fromPos || !toPos) continue;

      const waypoints = manhattanRoute(fromPos, toPos, ci);
      if (waypoints.length < 2) continue;

      const geo = new THREE.InstancedBufferGeometry();
      geo.setIndex(quadIdx);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(quadPos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(quadUV, 2));

      const instancePositions = new Float32Array(PARTICLES_PER_CONNECTION * 3);
      const posAttr = new THREE.InstancedBufferAttribute(instancePositions, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('instancePosition', posAttr);
      geo.instanceCount = PARTICLES_PER_CONNECTION;

      const { material, uniforms } = createTraceParticlesMaterial();
      const color = CONNECTION_COLORS[conn.type] ?? CONNECTION_COLORS.reference;
      uniforms.uColor.value.copy(color);

      // Random phase offsets and speeds for each particle
      const offsets = new Float32Array(PARTICLES_PER_CONNECTION);
      const speeds = new Float32Array(PARTICLES_PER_CONNECTION);
      for (let i = 0; i < PARTICLES_PER_CONNECTION; i++) {
        offsets[i] = i / PARTICLES_PER_CONNECTION + (Math.random() * 0.03);
        speeds[i] = 0.8 + Math.random() * 0.4;
      }

      result.push({
        geometry: geo,
        material,
        uniforms,
        positionAttr: posAttr,
        waypoints,
        offsets,
        speeds,
        from: conn.from,
        to: conn.to,
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useFrame(({ clock }) => {
    // Detect ref changes and rebuild
    const connections = ctx.connectionsRef.current;
    const positions = ctx.resourcePositionsRef.current;
    if (
      connections.length !== prevConnectionsLen.current ||
      positions.size !== prevPositionsSize.current
    ) {
      prevConnectionsLen.current = connections.length;
      prevPositionsSize.current = positions.size;
      setVersion((v) => v + 1);
    }

    const toggles = ctx.connectionTogglesRef.current;
    const traceEnabled = toggles.traceParticles ?? false;
    const hoveredId = ctx.hoveredResourceIdRef.current;
    const selectedId = ctx.selectedResourceIdRef.current;
    const t = clock.getElapsedTime();

    for (const cp of connectionParticles) {
      const isActive =
        traceEnabled &&
        (cp.from === hoveredId ||
          cp.to === hoveredId ||
          cp.from === selectedId ||
          cp.to === selectedId);

      // Fade opacity
      cp.uniforms.uOpacity.value = isActive ? 1.0 : 0.0;

      if (!isActive) continue;

      // Update particle positions along the path
      const arr = cp.positionAttr.array as Float32Array;
      for (let i = 0; i < PARTICLES_PER_CONNECTION; i++) {
        const phase = (cp.offsets[i] + t * PARTICLE_BASE_SPEED * cp.speeds[i]) % 1;
        const [x, y, z] = samplePath(cp.waypoints, phase);
        arr[i * 3] = x;
        arr[i * 3 + 1] = y + 0.04; // slightly above ground
        arr[i * 3 + 2] = z;
      }
      cp.positionAttr.needsUpdate = true;
    }
  });

  if (connectionParticles.length === 0) return null;

  return (
    <group>
      {connectionParticles.map((cp, i) => (
        <mesh key={i} geometry={cp.geometry} material={cp.material} />
      ))}
    </group>
  );
}
