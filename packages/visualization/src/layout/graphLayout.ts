import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

const ITERATIONS = 50;
const REPULSION = 2.0;
const ATTRACTION = 0.1;
const DAMPING = 0.9;
const MIN_DIST = 0.01;

export function graphLayout(resources: Resource[], connections: Connection[]): Map<string, Vec3> {
  const n = resources.length;
  if (n === 0) return new Map();
  if (n === 1) return new Map([[resources[0].id, [0, 0, 0]]]);

  // Initialize positions in a grid
  const ids = resources.map(r => r.id);
  const idIndex = new Map(ids.map((id, i) => [id, i]));

  const posX = new Float64Array(n);
  const posZ = new Float64Array(n);
  const velX = new Float64Array(n);
  const velZ = new Float64Array(n);

  // Seed from grid
  const cols = Math.ceil(Math.sqrt(n));
  const spacing = 2.5;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    posX[i] = col * spacing;
    posZ[i] = row * spacing;
  }

  // Build edge list
  const edges: [number, number][] = [];
  for (const c of connections) {
    const fi = idIndex.get(c.from);
    const ti = idIndex.get(c.to);
    if (fi !== undefined && ti !== undefined) {
      edges.push([fi, ti]);
    }
  }

  // Simulate
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = posX[i] - posX[j];
        let dz = posZ[i] - posZ[j];
        let dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < MIN_DIST) { dx = MIN_DIST; dz = 0; dist = MIN_DIST; }
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fz = (dz / dist) * force;
        velX[i] += fx; velZ[i] += fz;
        velX[j] -= fx; velZ[j] -= fz;
      }
    }

    // Attraction along edges
    for (const [a, b] of edges) {
      const dx = posX[b] - posX[a];
      const dz = posZ[b] - posZ[a];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < MIN_DIST) continue;
      const fx = dx * ATTRACTION;
      const fz = dz * ATTRACTION;
      velX[a] += fx; velZ[a] += fz;
      velX[b] -= fx; velZ[b] -= fz;
    }

    // Apply velocities with damping
    for (let i = 0; i < n; i++) {
      velX[i] *= DAMPING;
      velZ[i] *= DAMPING;
      posX[i] += velX[i];
      posZ[i] += velZ[i];
    }
  }

  // Center around origin
  let cx = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += posX[i]; cz += posZ[i]; }
  cx /= n; cz /= n;

  const map = new Map<string, Vec3>();
  for (let i = 0; i < n; i++) {
    map.set(ids[i], [posX[i] - cx, 0, posZ[i] - cz]);
  }
  return map;
}
