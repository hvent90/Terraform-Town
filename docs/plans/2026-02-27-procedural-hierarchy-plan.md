# Procedural Hierarchy Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the hierarchy layout so real-world tfstate files produce a 2D grid of service clusters with tree nesting, instead of a single line.

**Architecture:** Two changes: (1) StateSync.findParent becomes procedural — scans all string attributes, matches them against a multimap of resource IDs, and picks the parent with the longest shared type prefix. (2) hierarchyLayout groups orphan roots by service type in a 2D grid instead of a single row.

**Tech Stack:** TypeScript, Bun test runner

---

### Task 1: Rewrite `buildIdLookup` to return a multimap with types

**Files:**
- Modify: `packages/visualization/src/state/StateSync.ts:42-55`

**Step 1: Write the failing test**

Create test file `packages/visualization/src/state/StateSync.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import { StateSync } from './StateSync';

const sync = new StateSync();

describe('StateSync.parseState', () => {
  test('procedural parent detection via shared type prefix', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_s3_bucket',
          name: 'data',
          address: 'aws_s3_bucket.data',
          instances: [{ attributes: { id: 'my-bucket' } }],
        },
        {
          type: 'aws_s3_bucket_policy',
          name: 'data',
          address: 'aws_s3_bucket_policy.data',
          instances: [{ attributes: { id: 'my-bucket-policy', bucket: 'my-bucket' } }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const policy = state.resources.find(r => r.id === 'aws_s3_bucket_policy.data');
    expect(policy?.parentId).toBe('aws_s3_bucket.data');
  });

  test('higher shared prefix wins over lower', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_iam_role',
          name: 'main',
          address: 'aws_iam_role.main',
          instances: [{ attributes: { id: 'my-role' } }],
        },
        {
          type: 'aws_iam_policy',
          name: 'main',
          address: 'aws_iam_policy.main',
          instances: [{ attributes: { id: 'my-policy', arn: 'arn:aws:iam::123:policy/main' } }],
        },
        {
          type: 'aws_iam_role_policy_attachment',
          name: 'main',
          address: 'aws_iam_role_policy_attachment.main',
          instances: [{
            attributes: {
              id: 'attach-1',
              role: 'my-role',
              policy_arn: 'arn:aws:iam::123:policy/main',
            },
          }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const attach = state.resources.find(r => r.id === 'aws_iam_role_policy_attachment.main');
    // aws_iam_role shares 3 prefix segments, aws_iam_policy shares 2 -> role wins
    expect(attach?.parentId).toBe('aws_iam_role.main');
  });

  test('same-type references do not create parent', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_ssm_parameter',
          name: 'a',
          address: 'aws_ssm_parameter.a',
          instances: [{ attributes: { id: '/app/a', value: '/app/b' } }],
        },
        {
          type: 'aws_ssm_parameter',
          name: 'b',
          address: 'aws_ssm_parameter.b',
          instances: [{ attributes: { id: '/app/b' } }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const paramA = state.resources.find(r => r.id === 'aws_ssm_parameter.a');
    expect(paramA?.parentId).toBeUndefined();
  });

  test('minimum 2 shared segments required', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_sns_topic',
          name: 'alerts',
          address: 'aws_sns_topic.alerts',
          instances: [{ attributes: { id: 'arn:topic', arn: 'arn:topic' } }],
        },
        {
          type: 'aws_cloudwatch_metric_alarm',
          name: 'high_cpu',
          address: 'aws_cloudwatch_metric_alarm.high_cpu',
          instances: [{
            attributes: { id: 'alarm-1', alarm_actions: 'arn:topic' },
          }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const alarm = state.resources.find(r => r.id === 'aws_cloudwatch_metric_alarm.high_cpu');
    // aws_cloudwatch vs aws_sns -> only 1 shared segment -> no parent
    expect(alarm?.parentId).toBeUndefined();
  });

  test('shorter type wins tiebreak when scores equal', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_lambda_function',
          name: 'api',
          address: 'aws_lambda_function.api',
          instances: [{ attributes: { id: 'my-fn', arn: 'arn:lambda:fn' } }],
        },
        {
          type: 'aws_lambda_function_url',
          name: 'api',
          address: 'aws_lambda_function_url.api',
          instances: [{ attributes: { id: 'my-fn/url', function_name: 'my-fn' } }],
        },
        {
          type: 'aws_lambda_alias',
          name: 'current',
          address: 'aws_lambda_alias.current',
          instances: [{ attributes: { id: 'alias-1', function_name: 'my-fn' } }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const alias = state.resources.find(r => r.id === 'aws_lambda_alias.current');
    // Both aws_lambda_function and aws_lambda_function_url share 2 prefix segments
    // aws_lambda_function is shorter -> wins tiebreak
    expect(alias?.parentId).toBe('aws_lambda_function.api');
  });

  test('arn-based references create parents', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_ecs_cluster',
          name: 'main',
          address: 'aws_ecs_cluster.main',
          instances: [{ attributes: { id: 'arn:ecs:cluster/main', arn: 'arn:ecs:cluster/main' } }],
        },
        {
          type: 'aws_ecs_service',
          name: 'web',
          address: 'aws_ecs_service.web',
          instances: [{ attributes: { id: 'svc-1', cluster: 'arn:ecs:cluster/main' } }],
        },
      ],
    };
    const state = sync.parseState(tfstate);
    const svc = state.resources.find(r => r.id === 'aws_ecs_service.web');
    expect(svc?.parentId).toBe('aws_ecs_cluster.main');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/state/StateSync.test.ts`
Expected: FAIL — current `findParent` only checks `vpc_id` and `subnet_id`

**Step 3: Rewrite StateSync**

Replace the contents of `packages/visualization/src/state/StateSync.ts`:

```typescript
import type { TerraformState, Resource, Connection, ResourceType } from '../types';

// Longest prefix first — first match wins.
const TYPE_PREFIXES: [string, ResourceType][] = [
  ['aws_security_group', 'security_group'],
  ['aws_lambda_', 'lambda_function'],
  ['aws_subnet', 'subnet'],
  ['aws_instance', 'instance'],
  ['aws_s3_', 's3_bucket'],
  ['aws_iam_', 'iam_role'],
  ['aws_vpc', 'vpc'],
];

/**
 * Extract the AWS service name from a terraform resource type.
 * e.g. "aws_route53_record" → "route53"
 */
function extractServiceName(tfType: string): string {
  const stripped = tfType.replace(/^aws_/, '');
  const firstSeg = stripped.split('_')[0];
  return firstSeg || 'unknown';
}

/** Count shared underscore-delimited prefix segments between two type strings. */
function sharedPrefixSegments(a: string, b: string): number {
  const sa = a.split('_');
  const sb = b.split('_');
  let n = 0;
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    if (sa[i] === sb[i]) n++;
    else break;
  }
  return n;
}

type IdEntry = { address: string; type: string };

/** Attributes to skip when scanning for parent references (self-identifiers). */
const SKIP_ATTRS = new Set(['id', 'arn', 'tags', 'tags_all']);

export class StateSync {
  parseState(tfstate: any): TerraformState {
    const rawResources = tfstate.resources || [];
    const idLookup = this.buildIdLookup(rawResources);
    const resources = this.normalizeResources(rawResources, idLookup);
    const connections = this.buildConnections(resources, idLookup);
    return { resources, connections };
  }

  /** Build a multimap: attribute value → all resources that have that value as id or arn. */
  private buildIdLookup(rawResources: any[]): Map<string, IdEntry[]> {
    const lookup = new Map<string, IdEntry[]>();

    const add = (key: string, entry: IdEntry) => {
      const list = lookup.get(key);
      if (list) list.push(entry);
      else lookup.set(key, [entry]);
    };

    for (const r of rawResources) {
      const baseAddress = r.address || r.name;
      const rtype = r.type || '';
      const instances = r.instances || [{ attributes: r.attributes || {} }];
      for (const instance of instances) {
        const attrs = instance.attributes || {};
        const indexKey = instance.index_key;
        const address = indexKey != null ? `${baseAddress}[${JSON.stringify(indexKey)}]` : baseAddress;
        const entry = { address, type: rtype };
        if (attrs.id) add(attrs.id, entry);
        if (attrs.arn && attrs.arn !== attrs.id) add(attrs.arn, entry);
      }
    }
    return lookup;
  }

  private normalizeResources(rawResources: any[], idLookup: Map<string, IdEntry[]>): Resource[] {
    const resources: Resource[] = [];
    const seen = new Map<string, number>();
    for (const r of rawResources) {
      const baseAddress = r.address || r.name;
      const instances = r.instances || [{ attributes: r.attributes || {} }];
      for (const instance of instances) {
        const indexKey = instance.index_key;
        let id = indexKey != null ? `${baseAddress}[${JSON.stringify(indexKey)}]` : baseAddress;

        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count > 0) id = `${id}#${count}`;

        resources.push({
          id,
          type: this.normalizeType(r.type),
          name: r.name,
          attributes: instance.attributes || {},
          state: 'applied' as const,
          parentId: this.findParent(r.type, id, instance.attributes || {}, idLookup),
        });
      }
    }
    return resources;
  }

  private normalizeType(tfType: string): Resource['type'] {
    for (const [prefix, type] of TYPE_PREFIXES) {
      if (tfType.startsWith(prefix)) return type;
    }
    return extractServiceName(tfType);
  }

  /**
   * Find the best parent for a resource by scanning its attributes for values
   * that match known resource IDs, then picking the candidate whose type shares
   * the longest prefix with the child type.
   */
  private findParent(
    childType: string,
    childAddress: string,
    attrs: Record<string, any>,
    idLookup: Map<string, IdEntry[]>,
  ): string | undefined {
    let bestScore = 1; // minimum 2 shared segments
    let bestParent: { address: string; type: string } | undefined;

    for (const [key, value] of Object.entries(attrs)) {
      if (SKIP_ATTRS.has(key)) continue;
      if (typeof value !== 'string' || !value) continue;

      const entries = idLookup.get(value);
      if (!entries) continue;

      for (const entry of entries) {
        if (entry.address === childAddress) continue; // skip self
        if (entry.type === childType) continue; // skip same-type

        const score = sharedPrefixSegments(childType, entry.type);
        if (score < 2) continue;

        if (score > bestScore) {
          bestScore = score;
          bestParent = entry;
        } else if (score === bestScore && bestParent && entry.type.length < bestParent.type.length) {
          // Tiebreak: shorter type (more general) wins
          bestParent = entry;
        }
      }
    }

    return bestParent?.address;
  }

  /** Build connections from resource attribute references. */
  private buildConnections(resources: Resource[], idLookup: Map<string, IdEntry[]>): Connection[] {
    const connections: Connection[] = [];
    for (const resource of resources) {
      for (const [attr, value] of Object.entries(resource.attributes)) {
        if (SKIP_ATTRS.has(attr)) continue;
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (typeof v !== 'string' || !v) continue;
          const entries = idLookup.get(v);
          if (!entries) continue;
          for (const entry of entries) {
            if (entry.address !== resource.id) {
              connections.push({ from: resource.id, to: entry.address, type: 'reference', label: attr });
            }
          }
        }
      }
    }
    return connections;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/visualization && bun test src/state/StateSync.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add packages/visualization/src/state/StateSync.ts packages/visualization/src/state/StateSync.test.ts
git commit -m "feat: procedural parent detection via shared type prefix"
```

---

### Task 2: Update `hierarchyLayout` to grid orphan roots by service type

**Files:**
- Modify: `packages/visualization/src/layout/hierarchyLayout.ts`
- Modify: `packages/visualization/src/layout/hierarchyLayout.test.ts`

**Step 1: Write the failing test**

Add to `packages/visualization/src/layout/hierarchyLayout.test.ts`:

```typescript
test('orphan roots grouped by type in 2D grid, not a single line', () => {
  // 12 resources across 3 types, no parent relationships
  const resources = [
    r('aws_s3_bucket.a', 's3_bucket'),
    r('aws_s3_bucket.b', 's3_bucket'),
    r('aws_s3_bucket.c', 's3_bucket'),
    r('aws_s3_bucket.d', 's3_bucket'),
    r('aws_iam_role.a', 'iam_role'),
    r('aws_iam_role.b', 'iam_role'),
    r('aws_iam_role.c', 'iam_role'),
    r('aws_iam_role.d', 'iam_role'),
    r('aws_lambda_function.a', 'lambda_function'),
    r('aws_lambda_function.b', 'lambda_function'),
    r('aws_lambda_function.c', 'lambda_function'),
    r('aws_lambda_function.d', 'lambda_function'),
  ];
  const pos = hierarchyLayout(resources, []);
  expect(pos.size).toBe(12);

  // Collect unique Z values — a single line would have 1 unique Z
  const zValues = new Set<number>();
  for (const [, , z] of pos.values()) {
    zValues.add(Math.round(z * 100) / 100);
  }
  // With 3 groups in a grid, we need at least 2 different Z rows
  expect(zValues.size).toBeGreaterThanOrEqual(2);
});

test('parented resources still nest under their parent in grouped layout', () => {
  const resources = [
    r('aws_vpc.main', 'vpc'),
    r('aws_subnet.a', 'subnet', 'aws_vpc.main'),
    r('aws_s3_bucket.data', 's3_bucket'),
    r('aws_s3_bucket.logs', 's3_bucket'),
  ];
  const pos = hierarchyLayout(resources, []);
  expect(pos.size).toBe(4);

  // Subnet should still be near VPC (child relationship preserved)
  const vpc = pos.get('aws_vpc.main')!;
  const subnet = pos.get('aws_subnet.a')!;
  const dist = Math.hypot(vpc[0] - subnet[0], vpc[2] - subnet[2]);
  expect(dist).toBeLessThan(8);
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/visualization && bun test src/layout/hierarchyLayout.test.ts`
Expected: "orphan roots grouped by type" FAILS — current layout puts all in one row

**Step 3: Rewrite hierarchyLayout**

Replace the contents of `packages/visualization/src/layout/hierarchyLayout.ts`:

```typescript
import type { Resource, Connection } from '../types';

type Vec3 = [number, number, number];

const SPACING = 2.5;
const CHILD_OFFSET_Z = 3.0;
const GROUP_GAP = 4.0;

export function hierarchyLayout(resources: Resource[], _connections: Connection[]): Map<string, Vec3> {
  const map = new Map<string, Vec3>();
  if (resources.length === 0) return map;

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

    const childWidths = children.map(c => measureTree(c));
    const totalWidth = childWidths.reduce((a, b) => a + b, 0);

    let childX = cx - totalWidth / 2;
    for (let i = 0; i < children.length; i++) {
      const w = childWidths[i];
      placeTree(children[i], childX + w / 2, cz + CHILD_OFFSET_Z);
      childX += w;
    }
  }

  // Group roots by type for 2D grid layout
  const rootGroups = new Map<string, Resource[]>();
  for (const root of roots) {
    const list = rootGroups.get(root.type) ?? [];
    list.push(root);
    rootGroups.set(root.type, list);
  }

  const sortedTypes = [...rootGroups.keys()].sort();

  // Measure each group's bounding box (width × depth)
  type GroupLayout = { type: string; roots: Resource[]; width: number; depth: number };
  const groupLayouts: GroupLayout[] = [];

  for (const type of sortedTypes) {
    const groupRoots = rootGroups.get(type)!;
    // Sub-grid for this group's roots
    const subCols = Math.ceil(Math.sqrt(groupRoots.length));
    let totalWidth = 0;
    let maxDepth = 0;

    for (const root of groupRoots) {
      const treeWidth = measureTree(root);
      totalWidth += treeWidth;

      // Measure tree depth (levels × CHILD_OFFSET_Z)
      let depth = 0;
      const stack: { node: Resource; level: number }[] = [{ node: root, level: 0 }];
      while (stack.length > 0) {
        const { node, level } = stack.pop()!;
        depth = Math.max(depth, level);
        for (const child of childrenOf.get(node.id) ?? []) {
          stack.push({ node: child, level: level + 1 });
        }
      }
      maxDepth = Math.max(maxDepth, depth);
    }

    // Arrange roots in rows of subCols
    const rowCount = Math.ceil(groupRoots.length / subCols);
    const widthPerRow = groupRoots.slice(0, subCols).reduce((sum, root) => sum + measureTree(root), 0);
    const groupWidth = Math.max(widthPerRow, SPACING);
    const groupDepth = rowCount * (maxDepth + 1) * CHILD_OFFSET_Z + SPACING;

    groupLayouts.push({ type, roots: groupRoots, width: groupWidth, depth: groupDepth });
  }

  // Arrange groups in a 2D grid
  const groupCols = Math.ceil(Math.sqrt(groupLayouts.length));

  // Compute column widths and row depths
  const colWidths: number[] = new Array(groupCols).fill(0);
  const rowDepths: number[] = [];
  for (let i = 0; i < groupLayouts.length; i++) {
    const col = i % groupCols;
    const row = Math.floor(i / groupCols);
    colWidths[col] = Math.max(colWidths[col], groupLayouts[i].width);
    while (rowDepths.length <= row) rowDepths.push(0);
    rowDepths[row] = Math.max(rowDepths[row], groupLayouts[i].depth);
  }

  // Place each group
  for (let i = 0; i < groupLayouts.length; i++) {
    const { roots: groupRoots } = groupLayouts[i];
    const col = i % groupCols;
    const row = Math.floor(i / groupCols);

    // Group origin = cumulative column/row offsets
    let groupX = 0;
    for (let c = 0; c < col; c++) groupX += colWidths[c] + GROUP_GAP;
    let groupZ = 0;
    for (let r = 0; r < row; r++) groupZ += rowDepths[r] + GROUP_GAP;

    // Layout roots in a sub-grid within this group
    const subCols = Math.ceil(Math.sqrt(groupRoots.length));

    // Measure each root's tree width
    const treeWidths = groupRoots.map(r => measureTree(r));

    // Place roots row by row
    let rootIdx = 0;
    let currentZ = groupZ;
    while (rootIdx < groupRoots.length) {
      const rowEnd = Math.min(rootIdx + subCols, groupRoots.length);
      const rowWidths = treeWidths.slice(rootIdx, rowEnd);
      const rowTotalWidth = rowWidths.reduce((a, b) => a + b, 0);

      let rx = groupX + (colWidths[col] - rowTotalWidth) / 2;
      let maxTreeDepth = 0;

      for (let j = rootIdx; j < rowEnd; j++) {
        const w = treeWidths[j];
        placeTree(groupRoots[j], rx + w / 2, currentZ);
        rx += w;

        // Find max depth of trees in this row
        const stack: { node: Resource; level: number }[] = [{ node: groupRoots[j], level: 0 }];
        let depth = 0;
        while (stack.length > 0) {
          const { node, level } = stack.pop()!;
          depth = Math.max(depth, level);
          for (const child of childrenOf.get(node.id) ?? []) {
            stack.push({ node: child, level: level + 1 });
          }
        }
        maxTreeDepth = Math.max(maxTreeDepth, depth);
      }

      currentZ += (maxTreeDepth + 1) * CHILD_OFFSET_Z + SPACING;
      rootIdx = rowEnd;
    }
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
```

**Step 4: Run tests to verify all pass**

Run: `cd packages/visualization && bun test src/layout/hierarchyLayout.test.ts`
Expected: All 5 tests PASS (3 existing + 2 new)

**Step 5: Commit**

```bash
git add packages/visualization/src/layout/hierarchyLayout.ts packages/visualization/src/layout/hierarchyLayout.test.ts
git commit -m "feat: hierarchy layout groups orphan roots by service type in 2D grid"
```

---

### Task 3: Manual verification with real tfstate

**Step 1: Start the dev server**

Run: `cd packages/visualization && bun run dev`

**Step 2: Import the real tfstate and switch to hierarchy layout**

Open the browser, import `~/Sazabi/monorepo/terraform/main/terraform.tfstate`, switch to "Hierarchy" layout. Verify:
- Resources are arranged in a 2D grid of service clusters, not a single line
- Cluster labels appear over each group
- Zooming/panning works correctly with the new layout
- The layout is navigable and clusters are visually distinct

**Step 3: Compare with other layouts**

Switch between Grid, Type Clusters, Hierarchy, and Graph. Verify hierarchy looks distinct and provides useful grouping.

**Step 4: Commit design doc update if needed**

```bash
git add docs/plans/
git commit -m "docs: procedural hierarchy design and implementation plan"
```
