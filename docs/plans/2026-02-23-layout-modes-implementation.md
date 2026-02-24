# Layout Modes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four selectable layout modes (flat grid, type clusters, hierarchy, graph) with a Layout panel in the top-right corner.

**Architecture:** Extract layout logic into pure functions in `src/layout/`. Add `LayoutPanel` UI component. Wire layout mode state into App.tsx's position computation. Enhance parseHcl to detect parentId for hierarchy layout.

**Tech Stack:** React, Three.js (positions only), Bun test runner

---

### Task 1: Extract gridLayout into its own module

**Files:**
- Create: `packages/visualization/src/layout/gridLayout.ts`
- Create: `packages/visualization/src/layout/gridLayout.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, test, expect } from 'bun:test';
import { gridLayout } from './gridLayout';
import type { Resource, Connection } from '../types';

const r = (id: string, type: string = 'instance'): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied',
});

describe('gridLayout', () => {
  test('single resource at origin', () => {
    const pos = gridLayout([r('a.x')], []);
    expect(pos.get('a.x')).toEqual([0, 0, 0]);
  });

  test('four resources in 2x2 grid', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c'), r('a.d')];
    const pos = gridLayout(resources, []);
    expect(pos.size).toBe(4);
    // cols = ceil(sqrt(4)) = 2, spacing = 2.5
    // offsetX = (1 * 2.5) / 2 = 1.25, offsetZ = 1.25
    expect(pos.get('a.a')).toEqual([-1.25, 0, -1.25]);
    expect(pos.get('a.b')).toEqual([1.25, 0, -1.25]);
    expect(pos.get('a.c')).toEqual([-1.25, 0, 1.25]);
    expect(pos.get('a.d')).toEqual([1.25, 0, 1.25]);
  });

  test('respects resource.position override', () => {
    const resources = [{ ...r('a.x'), position: { x: 5, y: 1, z: 3 } }];
    const pos = gridLayout(resources, []);
    expect(pos.get('a.x')).toEqual([5, 1, 3]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/layout/gridLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
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
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/layout/gridLayout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/layout/gridLayout.ts packages/visualization/src/layout/gridLayout.test.ts
git commit -m "feat(viz): extract gridLayout into layout module"
```

---

### Task 2: typeClusterLayout

**Files:**
- Create: `packages/visualization/src/layout/typeClusterLayout.ts`
- Create: `packages/visualization/src/layout/typeClusterLayout.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, test, expect } from 'bun:test';
import { typeClusterLayout } from './typeClusterLayout';
import type { Resource } from '../types';

const r = (id: string, type: string): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied',
});

describe('typeClusterLayout', () => {
  test('groups resources by type into separate spatial clusters', () => {
    const resources = [
      r('aws_vpc.a', 'vpc'),
      r('aws_instance.a', 'instance'),
      r('aws_vpc.b', 'vpc'),
      r('aws_instance.b', 'instance'),
    ];
    const pos = typeClusterLayout(resources, []);
    // VPCs should be near each other, instances near each other
    const vpcA = pos.get('aws_vpc.a')!;
    const vpcB = pos.get('aws_vpc.b')!;
    const instA = pos.get('aws_instance.a')!;
    const instB = pos.get('aws_instance.b')!;

    // Within-group distance should be less than between-group distance
    const vpcDist = Math.hypot(vpcA[0] - vpcB[0], vpcA[2] - vpcB[2]);
    const crossDist = Math.hypot(vpcA[0] - instA[0], vpcA[2] - instA[2]);
    expect(vpcDist).toBeLessThan(crossDist);
  });

  test('single type behaves like flat grid', () => {
    const resources = [r('a.x', 'instance'), r('a.y', 'instance')];
    const pos = typeClusterLayout(resources, []);
    expect(pos.size).toBe(2);
  });

  test('all resources get positions', () => {
    const resources = [
      r('a.a', 'vpc'), r('a.b', 'subnet'), r('a.c', 'instance'),
      r('a.d', 'vpc'), r('a.e', 's3_bucket'),
    ];
    const pos = typeClusterLayout(resources, []);
    expect(pos.size).toBe(5);
    for (const r of resources) {
      expect(pos.has(r.id)).toBe(true);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/layout/typeClusterLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
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
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/layout/typeClusterLayout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/layout/typeClusterLayout.ts packages/visualization/src/layout/typeClusterLayout.test.ts
git commit -m "feat(viz): typeClusterLayout groups resources by type"
```

---

### Task 3: parseHcl parentId detection

**Files:**
- Modify: `packages/visualization/src/state/parseHcl.ts`
- Create: `packages/visualization/src/state/parseHcl.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, test, expect } from 'bun:test';
import { parseHcl } from './parseHcl';

describe('parseHcl parentId detection', () => {
  test('subnet gets parentId from vpc_id reference', () => {
    const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}
`;
    const state = parseHcl(hcl);
    const subnet = state.resources.find(r => r.id === 'aws_subnet.web')!;
    expect(subnet.parentId).toBe('aws_vpc.main');
  });

  test('instance gets parentId from subnet_id reference', () => {
    const hcl = `
resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "app" {
  subnet_id = aws_subnet.web.id
  ami       = "ami-12345678"
}
`;
    const state = parseHcl(hcl);
    const instance = state.resources.find(r => r.id === 'aws_instance.app')!;
    expect(instance.parentId).toBe('aws_subnet.web');
  });

  test('subnet_id takes priority over vpc_id for parentId', () => {
    const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "app" {
  subnet_id = aws_subnet.web.id
  vpc_id    = aws_vpc.main.id
  ami       = "ami-12345678"
}
`;
    const state = parseHcl(hcl);
    const instance = state.resources.find(r => r.id === 'aws_instance.app')!;
    expect(instance.parentId).toBe('aws_subnet.web');
  });

  test('resource without container references has no parentId', () => {
    const hcl = `
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
}
`;
    const state = parseHcl(hcl);
    const bucket = state.resources.find(r => r.id === 'aws_s3_bucket.data')!;
    expect(subnet.parentId).toBeUndefined();
  });
});
```

Note: fix the typo in step 3 — test 4 should use `bucket.parentId` not `subnet.parentId`.

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/state/parseHcl.test.ts`
Expected: FAIL — parentId is undefined on all resources

**Step 3: Implement parentId detection in parseHcl**

Add to `parseHcl.ts` after line 159 (after the resource is created), before pushing to the resources array. The parent detection logic goes in the `parseHcl` function between resource creation and connection detection:

```ts
// Parent attribute keys, ordered by specificity (most specific first)
const PARENT_KEYS = ['subnet_id', 'vpc_id'];

// After creating resources array, detect parentId
for (const resource of resources) {
  for (const key of PARENT_KEYS) {
    const val = resource.attributes[key];
    if (typeof val === 'string') {
      const match = val.match(/^([a-z_]+\.[a-z_][a-z0-9_]*)(?:\.[a-z_]+)?$/);
      if (match && allAddresses.has(match[1])) {
        resource.parentId = match[1];
        break; // most specific wins
      }
    }
  }
}
```

Insert this block in `parseHcl()` at line 161, between the `resources` array creation and the `connections` loop.

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/state/parseHcl.test.ts`
Expected: PASS

**Step 5: Run existing tests to confirm no regression**

Run: `cd packages/visualization && bun test src/routing/connections.test.ts`
Expected: PASS (existing parseHcl behavior unchanged)

**Step 6: Commit**

```bash
git add packages/visualization/src/state/parseHcl.ts packages/visualization/src/state/parseHcl.test.ts
git commit -m "feat(viz): detect parentId in parseHcl from vpc_id/subnet_id refs"
```

---

### Task 4: hierarchyLayout

**Files:**
- Create: `packages/visualization/src/layout/hierarchyLayout.ts`
- Create: `packages/visualization/src/layout/hierarchyLayout.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, test, expect } from 'bun:test';
import { hierarchyLayout } from './hierarchyLayout';
import type { Resource } from '../types';

const r = (id: string, type: string, parentId?: string): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied', parentId,
});

describe('hierarchyLayout', () => {
  test('children positioned near their parent', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_subnet.a', 'subnet', 'aws_vpc.main'),
      r('aws_subnet.b', 'subnet', 'aws_vpc.main'),
    ];
    const pos = hierarchyLayout(resources, []);
    const vpc = pos.get('aws_vpc.main')!;
    const subA = pos.get('aws_subnet.a')!;
    const subB = pos.get('aws_subnet.b')!;

    // Children should be closer to parent than to arbitrary far positions
    const distA = Math.hypot(vpc[0] - subA[0], vpc[2] - subA[2]);
    const distB = Math.hypot(vpc[0] - subB[0], vpc[2] - subB[2]);
    expect(distA).toBeLessThan(8);
    expect(distB).toBeLessThan(8);
  });

  test('resources without parents are placed as top-level', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_s3_bucket.data', 's3_bucket'),
    ];
    const pos = hierarchyLayout(resources, []);
    expect(pos.size).toBe(2);
    expect(pos.has('aws_vpc.main')).toBe(true);
    expect(pos.has('aws_s3_bucket.data')).toBe(true);
  });

  test('two-level nesting: vpc > subnet > instance', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_subnet.web', 'subnet', 'aws_vpc.main'),
      r('aws_instance.app', 'instance', 'aws_subnet.web'),
    ];
    const pos = hierarchyLayout(resources, []);
    expect(pos.size).toBe(3);
    // instance should be near subnet, subnet near vpc
    const vpc = pos.get('aws_vpc.main')!;
    const subnet = pos.get('aws_subnet.web')!;
    const instance = pos.get('aws_instance.app')!;
    const subnetToVpc = Math.hypot(vpc[0] - subnet[0], vpc[2] - subnet[2]);
    const instanceToSubnet = Math.hypot(subnet[0] - instance[0], subnet[2] - instance[2]);
    expect(subnetToVpc).toBeLessThan(8);
    expect(instanceToSubnet).toBeLessThan(8);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/layout/hierarchyLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

const SPACING = 2.5;
const CHILD_OFFSET_Z = 3.0;

export function hierarchyLayout(resources: Resource[], _connections: Connection[]): Map<string, Vec3> {
  const map = new Map<string, Vec3>();

  // Build parent→children map
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

  // Place a node and its children recursively
  function placeTree(node: Resource, cx: number, cz: number, depth: number): number {
    const children = childrenOf.get(node.id) ?? [];

    if (children.length === 0) {
      map.set(node.id, [cx, 0, cz]);
      return SPACING; // width consumed
    }

    // Place children in a row below the parent
    let totalWidth = 0;
    const childWidths: number[] = [];
    for (const child of children) {
      const w = placeTree(child, 0, 0, depth + 1); // temporary position
      childWidths.push(w);
      totalWidth += w;
    }

    // Reposition children centered under parent
    let childX = cx - totalWidth / 2;
    for (let i = 0; i < children.length; i++) {
      const w = childWidths[i];
      const childCx = childX + w / 2;
      // Shift the subtree
      shiftSubtree(children[i], childCx, cz + CHILD_OFFSET_Z, childrenOf, map);
      childX += w;
    }

    // Place the parent itself
    map.set(node.id, [cx, 0, cz]);

    return Math.max(totalWidth, SPACING);
  }

  // Layout roots in a row
  const rootWidths: number[] = [];
  let totalRootWidth = 0;
  for (const root of roots) {
    const w = measureTree(root, childrenOf);
    rootWidths.push(w);
    totalRootWidth += w;
  }

  let rootX = -totalRootWidth / 2;
  for (let i = 0; i < roots.length; i++) {
    const w = rootWidths[i];
    placeTree(roots[i], rootX + w / 2, 0, 0);
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

function measureTree(node: Resource, childrenOf: Map<string, Resource[]>): number {
  const children = childrenOf.get(node.id) ?? [];
  if (children.length === 0) return SPACING;
  let total = 0;
  for (const child of children) {
    total += measureTree(child, childrenOf);
  }
  return Math.max(total, SPACING);
}

function shiftSubtree(
  node: Resource,
  newX: number,
  newZ: number,
  childrenOf: Map<string, Resource[]>,
  map: Map<string, Vec3>,
) {
  const old = map.get(node.id);
  if (!old) {
    map.set(node.id, [newX, 0, newZ]);
    return;
  }
  const dx = newX - old[0];
  const dz = newZ - old[2];
  map.set(node.id, [newX, 0, newZ]);
  const children = childrenOf.get(node.id) ?? [];
  for (const child of children) {
    const cp = map.get(child.id);
    if (cp) {
      shiftSubtree(child, cp[0] + dx, cp[2] + dz, childrenOf, map);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/layout/hierarchyLayout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/layout/hierarchyLayout.ts packages/visualization/src/layout/hierarchyLayout.test.ts
git commit -m "feat(viz): hierarchyLayout positions children near parents"
```

---

### Task 5: graphLayout (force-directed)

**Files:**
- Create: `packages/visualization/src/layout/graphLayout.ts`
- Create: `packages/visualization/src/layout/graphLayout.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, test, expect } from 'bun:test';
import { graphLayout } from './graphLayout';
import type { Resource, Connection } from '../types';

const r = (id: string): Resource => ({
  id, type: 'instance', name: id.split('.')[1], attributes: {}, state: 'applied',
});

const conn = (from: string, to: string): Connection => ({
  from, to, type: 'reference',
});

describe('graphLayout', () => {
  test('connected nodes end up closer than unconnected nodes', () => {
    const resources = [r('a.x'), r('a.y'), r('a.z')];
    const connections = [conn('a.x', 'a.y')]; // x-y connected, z isolated
    const pos = graphLayout(resources, connections);

    const xy = Math.hypot(
      pos.get('a.x')![0] - pos.get('a.y')![0],
      pos.get('a.x')![2] - pos.get('a.y')![2],
    );
    const xz = Math.hypot(
      pos.get('a.x')![0] - pos.get('a.z')![0],
      pos.get('a.x')![2] - pos.get('a.z')![2],
    );
    expect(xy).toBeLessThan(xz);
  });

  test('all resources get positions', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c')];
    const pos = graphLayout(resources, []);
    expect(pos.size).toBe(3);
  });

  test('single resource at origin', () => {
    const pos = graphLayout([r('a.x')], []);
    expect(pos.get('a.x')).toEqual([0, 0, 0]);
  });

  test('no NaN or Infinity in positions', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c'), r('a.d')];
    const connections = [conn('a.a', 'a.b'), conn('a.b', 'a.c'), conn('a.c', 'a.d')];
    const pos = graphLayout(resources, connections);
    for (const [x, y, z] of pos.values()) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/layout/graphLayout.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
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

  // Build adjacency list
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
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/layout/graphLayout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/layout/graphLayout.ts packages/visualization/src/layout/graphLayout.test.ts
git commit -m "feat(viz): graphLayout force-directed layout for connection proximity"
```

---

### Task 6: Layout index module (dispatcher)

**Files:**
- Create: `packages/visualization/src/layout/index.ts`

**Step 1: Write the module**

```ts
import type { Resource, Connection } from '../types';
import { gridLayout } from './gridLayout';
import { typeClusterLayout } from './typeClusterLayout';
import { hierarchyLayout } from './hierarchyLayout';
import { graphLayout } from './graphLayout';

export type LayoutMode = 'grid' | 'type' | 'hierarchy' | 'graph';

type Vec3 = [number, number, number];
type LayoutFn = (resources: Resource[], connections: Connection[]) => Map<string, Vec3>;

const LAYOUT_FNS: Record<LayoutMode, LayoutFn> = {
  grid: gridLayout,
  type: typeClusterLayout,
  hierarchy: hierarchyLayout,
  graph: graphLayout,
};

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  grid: 'Flat Grid',
  type: 'Type Clusters',
  hierarchy: 'Hierarchy',
  graph: 'Graph',
};

export const ALL_LAYOUTS: LayoutMode[] = ['grid', 'type', 'hierarchy', 'graph'];

export function computeLayout(
  mode: LayoutMode,
  resources: Resource[],
  connections: Connection[],
): Map<string, Vec3> {
  return LAYOUT_FNS[mode](resources, connections);
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/layout/index.ts
git commit -m "feat(viz): layout index with LayoutMode type and dispatcher"
```

---

### Task 7: LayoutPanel UI component

**Files:**
- Create: `packages/visualization/src/ui/features/LayoutPanel.tsx`

**Step 1: Write the component**

The panel uses the existing themed `Panel` component and renders radio-style buttons for each layout mode. Pattern follows `ConnectionsPanel.tsx`.

```tsx
import { useThemedComponents } from '../../theme/ThemeProvider';
import { ALL_LAYOUTS, LAYOUT_LABELS, type LayoutMode } from '../../layout';
import { ui } from '../../theme/tron/colors';

type LayoutPanelProps = {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
};

export function LayoutPanel({ value, onChange }: LayoutPanelProps) {
  const { Panel } = useThemedComponents();
  return (
    <Panel title="Layout" collapsible>
      {ALL_LAYOUTS.map(mode => (
        <div
          key={mode}
          onClick={() => onChange(mode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: value === mode ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            border: `1px solid ${value === mode ? ui.accentBorder : ui.inactiveBorder}`,
            background: value === mode ? ui.accent : 'transparent',
            boxShadow: value === mode ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>{LAYOUT_LABELS[mode]}</span>
        </div>
      ))}
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/ui/features/LayoutPanel.tsx
git commit -m "feat(viz): LayoutPanel UI with radio selection"
```

---

### Task 8: Wire layout into App.tsx

**Files:**
- Modify: `packages/visualization/src/App.tsx`

**Step 1: Add imports**

Add to the imports at the top of App.tsx:

```ts
import { computeLayout, type LayoutMode } from './layout';
import { LayoutPanel } from './ui/features/LayoutPanel';
```

**Step 2: Add layout state**

Add after the `connectionToggles` useState (around line 162):

```ts
const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
```

**Step 3: Replace positions useMemo**

Replace the existing `positions` useMemo block (lines 186-196) with:

```ts
const positions = useMemo(() => {
  // If any resource has an explicit position, respect it (override mode)
  const hasOverrides = resources.some(r => r.position);
  if (hasOverrides) {
    const map = new Map<string, [number, number, number]>();
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      const pos = r.position
        ? [r.position.x, r.position.y, r.position.z] as [number, number, number]
        : [0, 0, 0] as [number, number, number];
      map.set(r.id, pos);
    }
    return map;
  }
  return computeLayout(layoutMode, resources, connections);
}, [resources, connections, layoutMode]);
```

**Step 4: Remove the `gridPosition` function**

Delete the `gridPosition` function (lines 61-70) from App.tsx — it's now in `gridLayout.ts`.

**Step 5: Add LayoutPanel to the UI**

Add a new positioned div for the top-right panel. Insert after the top-left panel div (after the closing `</div>` at approximately line 338):

```tsx
<div style={{
  position: 'fixed', top: 16, right: 16, zIndex: 1000,
  display: 'flex', flexDirection: 'column', gap: 8,
}}>
  <LayoutPanel value={layoutMode} onChange={setLayoutMode} />
</div>
```

Note: position this BEFORE the `<ResourceInspector>` so it doesn't overlap. The ResourceInspector slides in from the right at width 340, so the LayoutPanel's min-width of 180 should not conflict at the top-right corner.

**Step 6: Run all tests**

Run: `cd packages/visualization && bun test`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add packages/visualization/src/App.tsx
git commit -m "feat(viz): wire layout modes into App with LayoutPanel in top-right"
```

---

### Task 9: Manual verification

**Step 1: Start the dev server**

Run: `cd packages/visualization && bun run dev`

**Step 2: Verify in browser**

- Layout panel visible in top-right corner
- "Flat Grid" selected by default — same behavior as before
- Paste a multi-resource HCL config (VPC + subnets + instances)
- Switch to "Type Clusters" — resources group by type
- Switch to "Hierarchy" — children nest near parents
- Switch to "Graph" — connected resources cluster together
- Connection traces update correctly for each layout
- Panel collapses/expands correctly

**Step 3: Run full test suite**

Run: `cd packages/visualization && bun test`
Expected: All tests PASS

**Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix(viz): layout mode fixups from manual testing"
```
