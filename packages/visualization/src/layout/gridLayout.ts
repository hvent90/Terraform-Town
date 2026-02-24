import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

export function gridLayout(resources: Resource[], _connections: Connection[]): Map<string, Vec3> {
  const map = new Map<string, Vec3>();
  const total = resources.length;
  for (let i = 0; i < total; i++) {
    const r = resources[i];
    if (r.position) {
      map.set(r.id, [r.position.x, r.position.y, r.position.z]);
    } else {
      map.set(r.id, gridPosition(i, total));
    }
  }
  return map;
}

function gridPosition(index: number, total: number): Vec3 {
  if (total === 1) return [0, 0, 0];
  const spacing = 2.5;
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetZ = ((Math.ceil(total / cols) - 1) * spacing) / 2;
  return [col * spacing - offsetX, 0, row * spacing - offsetZ];
}
