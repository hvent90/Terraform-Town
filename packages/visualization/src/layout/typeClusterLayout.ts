import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

const SPACING = 2.5;
const GROUP_GAP = 2.0;

export function typeClusterLayout(resources: Resource[], _connections: Connection[]): Map<string, Vec3> {
  const map = new Map<string, Vec3>();

  // Group by type
  const groups = new Map<string, Resource[]>();
  for (const r of resources) {
    const list = groups.get(r.type) ?? [];
    list.push(r);
    groups.set(r.type, list);
  }

  // Sort group keys alphabetically for deterministic layout
  const sortedTypes = [...groups.keys()].sort();

  // Lay out each group, tracking bounding boxes to offset groups
  const groupCols = Math.ceil(Math.sqrt(sortedTypes.length));
  let groupIndex = 0;

  for (const type of sortedTypes) {
    const members = groups.get(type)!;
    const groupRow = Math.floor(groupIndex / groupCols);
    const groupCol = groupIndex % groupCols;

    // Each group gets a sub-grid
    const subCols = Math.ceil(Math.sqrt(members.length));
    const subRows = Math.ceil(members.length / subCols);

    // Group origin offset — groups are spaced by max possible sub-grid size + gap
    const maxSubExtent = Math.ceil(Math.sqrt(resources.length));
    const groupSpacing = maxSubExtent * SPACING + GROUP_GAP;
    const groupOffsetX = groupCol * groupSpacing;
    const groupOffsetZ = groupRow * groupSpacing;

    for (let i = 0; i < members.length; i++) {
      const r = members[i];
      const row = Math.floor(i / subCols);
      const col = i % subCols;
      const x = col * SPACING - ((subCols - 1) * SPACING) / 2 + groupOffsetX;
      const z = row * SPACING - ((subRows - 1) * SPACING) / 2 + groupOffsetZ;
      map.set(r.id, [x, 0, z]);
    }
    groupIndex++;
  }

  // Center everything around origin
  if (map.size > 0) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [x, , z] of map.values()) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    for (const [id, [x, y, z]] of map) {
      map.set(id, [x - cx, y, z - cz]);
    }
  }

  return map;
}
