import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

const SPACING = 2.5;
const CHILD_OFFSET_Z = 3.0;

export function hierarchyLayout(resources: Resource[], _connections: Connection[]): Map<string, Vec3> {
  const map = new Map<string, Vec3>();

  // Build parent->children map
  const childrenOf = new Map<string, Resource[]>();
  const roots: Resource[] = [];

  for (const r of resources) {
    if (r.parentId && resources.some(p => p.id === r.parentId)) {
      const list = childrenOf.get(r.parentId) ?? [];
      list.push(r);
      childrenOf.set(r.parentId, list);
    } else {
      roots.push(r);
    }
  }

  // Measure the width needed for a subtree
  function measureTree(node: Resource): number {
    const children = childrenOf.get(node.id) ?? [];
    if (children.length === 0) return SPACING;
    let total = 0;
    for (const child of children) {
      total += measureTree(child);
    }
    return Math.max(total, SPACING);
  }

  // Place a node and its children recursively
  function placeTree(node: Resource, cx: number, cz: number): void {
    map.set(node.id, [cx, 0, cz]);
    const children = childrenOf.get(node.id) ?? [];
    if (children.length === 0) return;

    // Measure children widths
    const childWidths = children.map(c => measureTree(c));
    const totalWidth = childWidths.reduce((a, b) => a + b, 0);

    // Place children in a row below parent
    let childX = cx - totalWidth / 2;
    for (let i = 0; i < children.length; i++) {
      const w = childWidths[i];
      placeTree(children[i], childX + w / 2, cz + CHILD_OFFSET_Z);
      childX += w;
    }
  }

  // Layout roots in a row
  const rootWidths = roots.map(r => measureTree(r));
  const totalRootWidth = rootWidths.reduce((a, b) => a + b, 0);

  let rootX = -totalRootWidth / 2;
  for (let i = 0; i < roots.length; i++) {
    const w = rootWidths[i];
    placeTree(roots[i], rootX + w / 2, 0);
    rootX += w;
  }

  // Center around origin
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
