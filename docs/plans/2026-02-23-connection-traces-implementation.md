# Connection Traces Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render Terraform resource connections as TRON-styled Manhattan-routed ground-plane traces with dim-until-active highlighting and configurable pulse/particle animations.

**Architecture:** Scene-level `ConnectionActor` (same pattern as `ResourceActor`/`GroundActor`) reads theme-provided Mesh + effects. Theme type extended with `connections?`. Data flows through `SceneContext` refs. Pure-function Manhattan routing tested via TDD.

**Tech Stack:** React Three Fiber, Three.js WebGPU, TSL shaders, Bun test runner

---

### Task 1: Manhattan Routing Pure Function

Extract the routing algorithm as a pure, testable function before touching any React/Three.js code.

**Files:**
- Create: `packages/visualization/src/routing/manhattanRoute.ts`
- Create: `packages/visualization/src/routing/manhattanRoute.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/visualization/src/routing/manhattanRoute.test.ts
import { describe, test, expect } from 'bun:test';
import { manhattanRoute } from './manhattanRoute';

describe('manhattanRoute', () => {
  test('routes L-shaped path between two positions on different row and column', () => {
    const path = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 0);
    // Should produce: start -> turn on Z -> move on X -> end
    expect(path.length).toBeGreaterThanOrEqual(3);
    expect(path[0]).toEqual([0, 0, 0]);
    expect(path[path.length - 1]).toEqual([2.5, 0, 2.5]);
    // All intermediate points should have right angles (either X or Z changes, not both)
    for (let i = 1; i < path.length; i++) {
      const dx = Math.abs(path[i][0] - path[i - 1][0]);
      const dz = Math.abs(path[i][2] - path[i - 1][2]);
      expect(dx === 0 || dz === 0).toBe(true);
    }
  });

  test('produces straight line for same-row nodes (same Z)', () => {
    const path = manhattanRoute([0, 0, 0], [5, 0, 0], 0);
    expect(path).toEqual([[0, 0, 0], [5, 0, 0]]);
  });

  test('produces straight line for same-column nodes (same X)', () => {
    const path = manhattanRoute([0, 0, 0], [0, 0, 5], 0);
    expect(path).toEqual([[0, 0, 0], [0, 0, 5]]);
  });

  test('offsets midpoint for parallel trace spreading', () => {
    const path0 = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 0);
    const path1 = manhattanRoute([0, 0, 0], [2.5, 0, 2.5], 1);
    // Midpoints should differ due to offset
    const mid0z = path0[1][2];
    const mid1z = path1[1][2];
    expect(mid0z).not.toEqual(mid1z);
  });

  test('returns empty array when source equals target', () => {
    const path = manhattanRoute([1, 0, 1], [1, 0, 1], 0);
    expect(path).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test packages/visualization/src/routing/manhattanRoute.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// packages/visualization/src/routing/manhattanRoute.ts
type Vec3 = [number, number, number];

const SPREAD_OFFSET = 0.15;

/**
 * Compute a Manhattan (right-angle) route between two ground-plane positions.
 * All points are at y=0. The `index` parameter offsets the midpoint Z
 * to spread parallel traces apart.
 */
export function manhattanRoute(from: Vec3, to: Vec3, index: number): Vec3[] {
  const [fx, fy, fz] = from;
  const [tx, ty, tz] = to;

  // Same position - skip
  if (fx === tx && fz === tz) return [];

  const y = 0;

  // Same X - straight vertical line
  if (fx === tx) return [[fx, y, fz], [tx, y, tz]];

  // Same Z - straight horizontal line
  if (fz === tz) return [[fx, y, fz], [tx, y, tz]];

  // L-shaped route: go Z first to midpoint, then X, then Z to target
  // Midpoint Z is halfway between source and target, offset by index for spreading
  const midZ = (fz + tz) / 2 + index * SPREAD_OFFSET;

  return [
    [fx, y, fz],
    [fx, y, midZ],
    [tx, y, midZ],
    [tx, y, tz],
  ];
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test packages/visualization/src/routing/manhattanRoute.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add packages/visualization/src/routing/manhattanRoute.ts packages/visualization/src/routing/manhattanRoute.test.ts
git commit -m "feat(viz): Manhattan routing pure function with tests"
```

---

### Task 2: Extract Position Map & Add to SceneContext

Compute resource positions as a map and thread connections + positions through context.

**Files:**
- Modify: `packages/visualization/src/shared/context.ts:3-14` (add fields to SceneContextType)
- Modify: `packages/visualization/src/App.tsx:93-131` (compute positions map, pass to context)

**Step 1: Add new fields to SceneContextType**

In `packages/visualization/src/shared/context.ts`, add three new ref fields to `SceneContextType`:

```typescript
// Add these imports at top
import type { Connection } from '../types';

export type SceneContextType = {
  // ... existing fields ...
  connectionsRef: React.MutableRefObject<Connection[]>;
  resourcePositionsRef: React.MutableRefObject<Map<string, [number, number, number]>>;
  connectionTogglesRef: React.MutableRefObject<Record<string, boolean>>;
};
```

**Step 2: Compute positions map in Scene component**

In `packages/visualization/src/App.tsx`, in the `Scene` function (line 93), add a `useMemo` that builds the positions map. Then use it for both resource positioning and pass it to context.

Replace the inline `gridPosition` call in the JSX map (lines 115-126) with a lookup from the positions map.

In `App` (line 138), add state for connection toggles, create refs, and include them in `sceneCtx`.

Wire `state.connections` into `connectionsRef`.

**Step 3: Run the dev server to verify nothing broke**

Run: `bun run dev` (in packages/visualization)
Expected: Scene renders identically to before - no visual change

**Step 4: Commit**

```bash
git add packages/visualization/src/shared/context.ts packages/visualization/src/App.tsx
git commit -m "feat(viz): extract position map and add connection refs to SceneContext"
```

---

### Task 3: Extend Theme Type & Create ConnectionActor

Add `connections` to the `Theme` type and create the actor component.

**Files:**
- Modify: `packages/visualization/src/theme/types.ts:15-40` (add connections field)
- Create: `packages/visualization/src/actors/ConnectionActor.tsx`
- Modify: `packages/visualization/src/App.tsx:93-131` (add ConnectionActor to Scene)

**Step 1: Extend Theme type**

In `packages/visualization/src/theme/types.ts`, add `connections?` field to `Theme`:

```typescript
export type Theme = {
  resources: Record<string, {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  }>;
  ground: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  connections?: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  Lights: React.ComponentType;
  PostProcessing: React.ComponentType;
  ui: { components: { /* ... existing ... */ } };
};
```

**Step 2: Create ConnectionActor**

```typescript
// packages/visualization/src/actors/ConnectionActor.tsx
import { useTheme } from '../theme/ThemeProvider';

export function ConnectionActor() {
  const theme = useTheme();
  const config = theme.connections;
  if (!config) return null;

  const { Mesh, effects } = config;

  return (
    <group>
      <Mesh />
      {Object.entries(effects).map(([state, fxList]) =>
        fxList!.map((Fx, i) => <Fx key={`${state}-${i}`} />)
      )}
    </group>
  );
}
```

**Step 3: Add ConnectionActor to Scene**

In `packages/visualization/src/App.tsx`, import `ConnectionActor` and add it to the Scene JSX between `GroundActor` and `Lights`:

```tsx
<ConnectionActor />
```

**Step 4: Verify dev server still works**

Run: `bun run dev`
Expected: No visual change (theme doesn't provide connections yet, so ConnectionActor returns null)

**Step 5: Commit**

```bash
git add packages/visualization/src/theme/types.ts packages/visualization/src/actors/ConnectionActor.tsx packages/visualization/src/App.tsx
git commit -m "feat(viz): Theme connections type and ConnectionActor"
```

---

### Task 4: Connection Trace TSL Shader

Create the shader for rendering connection traces on the ground plane.

**Files:**
- Create: `packages/visualization/src/theme/tron/shaders/connection-trace.tsl.ts`

**Step 1: Write the shader**

Follow the pattern from `trace.tsl.ts` and `ground-beam.tsl.ts`. The connection trace shader needs:
- `uColor` (vec3) - trace color, set per connection type
- `uActive` (float) - 0.0 dim, 1.0 bright
- `uTime` (float) - for pulse animation
- `uDashScale` (float) - 0 for solid, >0 for dashed/dotted
- `uPulseSpeed` (float) - traveling pulse speed

```typescript
// packages/visualization/src/theme/tron/shaders/connection-trace.tsl.ts
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, float, abs, max, smoothstep, fract, exp, mix, step,
  uv, Fn,
} from 'three/tsl';
import * as THREE from 'three';

export function createConnectionTraceMaterial() {
  const uColor = uniform(new THREE.Color(1, 0.55, 0.1));
  const uActive = uniform(0);
  const uTime = uniform(0);
  const uDashScale = uniform(0); // 0 = solid, >0 = dashed
  const uPulseSpeed = uniform(1.5);
  const uPathLength = uniform(1); // total path length for pulse mapping

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  material.colorNode = Fn(() => {
    const brightness = mix(float(1.5), float(4.0), uActive);
    // Pulse: bright spot traveling along the path (UV.y = along-path coordinate)
    const vuv = uv();
    const pulsePos = fract(uTime.mul(uPulseSpeed).negate());
    const pulseDist = abs(vuv.y.sub(pulsePos));
    const pulse = exp(pulseDist.mul(pulseDist).negate().mul(80.0)).mul(uActive).mul(6.0);
    return uColor.mul(brightness.add(pulse));
  })();

  material.opacityNode = Fn(() => {
    const vuv = uv();
    // Cross-section fade: thin line with soft edges
    const crossDist = abs(vuv.x.sub(0.5)).mul(2.0);
    const crossFade = smoothstep(1.0, 0.2, crossDist);

    // Dash pattern (along path = UV.y)
    const dashMask = uDashScale.greaterThan(0.0).select(
      step(0.5, fract(vuv.y.mul(uDashScale))),
      float(1.0),
    );

    // Base opacity: dim when inactive, bright when active
    const baseAlpha = mix(float(0.15), float(0.8), uActive);

    return crossFade.mul(dashMask).mul(baseAlpha);
  })();

  return {
    material,
    uniforms: { uColor, uActive, uTime, uDashScale, uPulseSpeed, uPathLength },
  };
}
```

**Step 2: Verify it compiles**

Run: `bun run dev`
Expected: No errors (shader isn't used yet)

**Step 3: Commit**

```bash
git add packages/visualization/src/theme/tron/shaders/connection-trace.tsl.ts
git commit -m "feat(viz): connection trace TSL shader"
```

---

### Task 5: ConnectionTraces Mesh Component

The main Mesh component that renders all connection traces using the routing function and shader.

**Files:**
- Create: `packages/visualization/src/theme/tron/effects/ConnectionTraces.tsx`

**Step 1: Write the ConnectionTraces component**

This component:
1. Reads `connectionsRef`, `resourcePositionsRef`, `connectionTogglesRef` from SceneContext
2. For each connection, computes a Manhattan route
3. Creates a plane geometry per segment, positioned/rotated on the ground plane
4. Applies the connection trace material with per-type color/dash settings
5. On each frame, updates `uActive` based on hovered/selected resource matching `from`/`to`

```typescript
// packages/visualization/src/theme/tron/effects/ConnectionTraces.tsx
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useSceneContext, ResourceIdContext } from '../../../shared/context';
import { manhattanRoute } from '../../../routing/manhattanRoute';
import { createConnectionTraceMaterial } from '../shaders/connection-trace.tsl';
import { TRACE_WARM, COOL_BLUE, STATUS_GREEN } from '../colors';
import type { Connection, ConnectionType } from '../../../types';

const CONNECTION_COLORS: Record<ConnectionType, THREE.Color> = {
  reference: new THREE.Color().copy(TRACE_WARM),
  attachment: new THREE.Color(0xffaa44),
  dataflow: new THREE.Color().copy(STATUS_GREEN),
};

const CONNECTION_DASH: Record<ConnectionType, number> = {
  reference: 0,    // solid
  attachment: 8,   // dashed
  dataflow: 16,    // dotted
};

const LINE_WIDTH = 0.06;
const GROUND_Y = 0.015;

type SegmentData = {
  connectionIndex: number;
  from: [number, number, number];
  to: [number, number, number];
  pathFraction: number; // 0-1 where this segment sits along the total path
  pathFractionEnd: number;
};

export function ConnectionTraces() {
  const ctx = useSceneContext();
  const groupRef = useRef<THREE.Group>(null);

  // Build segment geometries from connections
  const { segments, materials } = useMemo(() => {
    const connections = ctx.connectionsRef.current;
    const positions = ctx.resourcePositionsRef.current;
    if (!connections.length || !positions.size) return { segments: [] as SegmentData[], materials: [] as ReturnType<typeof createConnectionTraceMaterial>[] };

    const segs: SegmentData[] = [];
    const mats: ReturnType<typeof createConnectionTraceMaterial>[] = [];

    connections.forEach((conn, ci) => {
      const fromPos = positions.get(conn.from);
      const toPos = positions.get(conn.to);
      if (!fromPos || !toPos) return;

      const route = manhattanRoute(fromPos, toPos, ci);
      if (route.length < 2) return;

      // Compute total path length
      let totalLen = 0;
      for (let i = 1; i < route.length; i++) {
        const dx = route[i][0] - route[i - 1][0];
        const dz = route[i][2] - route[i - 1][2];
        totalLen += Math.sqrt(dx * dx + dz * dz);
      }

      let cumLen = 0;
      for (let i = 1; i < route.length; i++) {
        const dx = route[i][0] - route[i - 1][0];
        const dz = route[i][2] - route[i - 1][2];
        const segLen = Math.sqrt(dx * dx + dz * dz);
        const fracStart = cumLen / totalLen;
        cumLen += segLen;
        const fracEnd = cumLen / totalLen;

        segs.push({
          connectionIndex: ci,
          from: route[i - 1],
          to: route[i],
          pathFraction: fracStart,
          pathFractionEnd: fracEnd,
        });
      }

      const mat = createConnectionTraceMaterial();
      mat.uniforms.uColor.value.copy(CONNECTION_COLORS[conn.type] ?? TRACE_WARM);
      mat.uniforms.uDashScale.value = CONNECTION_DASH[conn.type] ?? 0;
      mats.push(mat);
    });

    return { segments: segs, materials: mats };
  }, [ctx.connectionsRef.current, ctx.resourcePositionsRef.current]);

  // Per-frame: update activation + time
  useFrame(({ clock }) => {
    if (!materials.length) return;
    const connections = ctx.connectionsRef.current;
    const toggles = ctx.connectionTogglesRef.current;
    const tracesOn = toggles.connectionTraces !== false;
    const pulseOn = toggles.tracePulse !== false;
    const t = clock.getElapsedTime();

    // Determine which connections are active
    // Read hovered/selected from the parent - we check the refs that App sets
    // We need hoveredResourceId and selectedResourceId - these are set via
    // setHoveredResourceId and onSelect in SceneContext
    // For now, use a simple approach: check if any resource is selected/hovered
    // by reading from a ref we'll add
    connections.forEach((conn, ci) => {
      if (ci >= materials.length) return;
      const mat = materials[ci];
      // Active if hovered or selected resource matches from or to
      // We'll read these from a ref on the context
      const hovId = (ctx as any).hoveredResourceIdRef?.current ?? null;
      const selId = (ctx as any).selectedResourceIdRef?.current ?? null;
      const isActive = hovId === conn.from || hovId === conn.to || selId === conn.from || selId === conn.to;

      mat.uniforms.uActive.value += ((isActive && tracesOn ? 1 : 0) - mat.uniforms.uActive.value) * 0.08;
      mat.uniforms.uTime.value = pulseOn ? t : 0;
    });
  });

  if (!segments.length) return null;

  return (
    <group ref={groupRef}>
      {segments.map((seg, i) => {
        const dx = seg.to[0] - seg.from[0];
        const dz = seg.to[2] - seg.from[2];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const cx = (seg.from[0] + seg.to[0]) / 2;
        const cz = (seg.from[2] + seg.to[2]) / 2;
        const mat = materials[seg.connectionIndex];
        if (!mat) return null;

        return (
          <mesh
            key={i}
            material={mat.material}
            position={[cx, GROUND_Y, cz]}
            rotation={[-Math.PI / 2, 0, -angle]}
          >
            <planeGeometry args={[LINE_WIDTH, length]} />
          </mesh>
        );
      })}
    </group>
  );
}
```

**Step 2: Verify it compiles**

Run: `bun run dev`
Expected: No errors (component not wired into theme yet)

**Step 3: Commit**

```bash
git add packages/visualization/src/theme/tron/effects/ConnectionTraces.tsx
git commit -m "feat(viz): ConnectionTraces mesh component"
```

---

### Task 6: Add hoveredResourceIdRef and selectedResourceIdRef to SceneContext

The ConnectionTraces component needs to read which resource is hovered/selected. Currently this is managed as React state in App but not exposed as refs on SceneContext.

**Files:**
- Modify: `packages/visualization/src/shared/context.ts:3-14` (add ref fields)
- Modify: `packages/visualization/src/App.tsx` (create and wire the refs)

**Step 1: Add refs to SceneContextType**

```typescript
// Add to SceneContextType
hoveredResourceIdRef: React.MutableRefObject<string | null>;
selectedResourceIdRef: React.MutableRefObject<string | null>;
```

**Step 2: Create refs in App and sync them**

In `App`, create `hoveredResourceIdRef` and `selectedResourceIdRef` using `useRef`, and sync them with the state values:

```typescript
const hoveredResourceIdRef = useRef<string | null>(null);
hoveredResourceIdRef.current = hoveredResourceId;
const selectedResourceIdRef = useRef<string | null>(null);
selectedResourceIdRef.current = selectedResourceId;
```

Add both to the `sceneCtx` useMemo.

**Step 3: Remove the `(ctx as any)` cast from ConnectionTraces**

Update `ConnectionTraces.tsx` to use the proper typed refs instead of `(ctx as any)`.

**Step 4: Verify dev server**

Run: `bun run dev`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/visualization/src/shared/context.ts packages/visualization/src/App.tsx packages/visualization/src/theme/tron/effects/ConnectionTraces.tsx
git commit -m "feat(viz): expose hovered/selected resource ID refs on SceneContext"
```

---

### Task 7: Wire ConnectionTraces into TRON Theme

Register ConnectionTraces as the connections Mesh in the TRON theme config.

**Files:**
- Modify: `packages/visualization/src/theme/tron/index.ts` (add connections config)
- Modify: `packages/visualization/src/theme/tron/effects.ts` (add connection effect constants)

**Step 1: Add connection effect constants**

In `packages/visualization/src/theme/tron/effects.ts`, add:

```typescript
// Connection effect keys
export type ConnectionEffectKey = 'connectionTraces' | 'tracePulse' | 'traceParticles' | 'traceLabels';

export const CONNECTION_LABELS: Record<ConnectionEffectKey, string> = {
  connectionTraces: 'Traces',
  tracePulse: 'Pulse',
  traceParticles: 'Particles',
  traceLabels: 'Labels',
};

export const ALL_CONNECTION_EFFECTS: ConnectionEffectKey[] = Object.keys(CONNECTION_LABELS) as ConnectionEffectKey[];

export const DEFAULT_CONNECTION_TOGGLES: Record<ConnectionEffectKey, boolean> = {
  connectionTraces: true,
  tracePulse: true,
  traceParticles: false,
  traceLabels: false,
};
```

**Step 2: Add connections to tronTheme**

In `packages/visualization/src/theme/tron/index.ts`:

```typescript
import { ConnectionTraces } from './effects/ConnectionTraces';

export const tronTheme: Theme = {
  // ... existing ...
  connections: {
    Mesh: ConnectionTraces,
    effects: {},  // TracePulse and TraceParticles added in later tasks
  },
  // ... rest ...
};
```

**Step 3: Wire connection toggle state in App.tsx**

In `App.tsx`, add state for connection toggles using the new constants:

```typescript
import { DEFAULT_CONNECTION_TOGGLES } from './theme/tron/effects';

// In App component:
const [connectionToggles, setConnectionToggles] = useState<Record<string, boolean>>({ ...DEFAULT_CONNECTION_TOGGLES });
const connectionTogglesRef = useRef(connectionToggles);
connectionTogglesRef.current = connectionToggles;
```

Wire `connectionsRef` with `state.connections`, `resourcePositionsRef` with the positions map (computed in Scene, so pass it up or compute in App), and `connectionTogglesRef` into the sceneCtx.

**Step 4: Test with multi-resource HCL**

Run: `bun run dev`

Enter this HCL in the TerraformInput:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.main.id
  ami       = "ami-12345678"
}
```

Expected: Three resource cubes appear. Dim traces on the ground connect vpc→subnet and subnet→instance. Hovering over a node brightens its connection traces.

**Step 5: Commit**

```bash
git add packages/visualization/src/theme/tron/index.ts packages/visualization/src/theme/tron/effects.ts packages/visualization/src/App.tsx
git commit -m "feat(viz): wire ConnectionTraces into TRON theme with toggle state"
```

---

### Task 8: ConnectionsPanel UI

Add the UI panel for toggling connection effects.

**Files:**
- Create: `packages/visualization/src/ui/features/ConnectionsPanel.tsx`
- Modify: `packages/visualization/src/App.tsx` (add panel to sidebar)

**Step 1: Create ConnectionsPanel**

Follow the pattern from `EffectsPanel.tsx` - simple toggle panel:

```typescript
// packages/visualization/src/ui/features/ConnectionsPanel.tsx
import { useThemedComponents } from '../../theme/ThemeProvider';

type ConnectionsPanelProps = {
  effects: string[];
  labels: Record<string, string>;
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export function ConnectionsPanel({ effects, labels, toggles, onToggle }: ConnectionsPanelProps) {
  const { Panel, ToggleSwitch, SectionHeader } = useThemedComponents();
  return (
    <Panel title="Connections" collapsible defaultCollapsed>
      {effects.map(key => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>{labels[key]}</span>
          <ToggleSwitch checked={toggles[key]} onChange={() => onToggle(key)} />
        </div>
      ))}
    </Panel>
  );
}
```

**Step 2: Add to App sidebar**

In `App.tsx`, import and render `ConnectionsPanel` below the Water panel. Only render when `state.connections.length > 0`:

```tsx
import { ConnectionsPanel } from './ui/features/ConnectionsPanel';
import { ALL_CONNECTION_EFFECTS, CONNECTION_LABELS } from './theme/tron/effects';

// In the sidebar div:
{state.connections.length > 0 && (
  <ConnectionsPanel
    effects={ALL_CONNECTION_EFFECTS}
    labels={CONNECTION_LABELS}
    toggles={connectionToggles}
    onToggle={(key) => setConnectionToggles(prev => ({ ...prev, [key]: !prev[key] }))}
  />
)}
```

**Step 3: Verify panel appears with multi-resource HCL**

Run: `bun run dev`
Expected: After entering HCL with references, a "Connections" panel appears in the sidebar with Traces/Pulse/Particles/Labels toggles. Toggling "Traces" off hides all connection traces.

**Step 4: Commit**

```bash
git add packages/visualization/src/ui/features/ConnectionsPanel.tsx packages/visualization/src/App.tsx
git commit -m "feat(viz): ConnectionsPanel UI with toggle controls"
```

---

### Task 9: TracePulse Effect Component

Animated bright pulse traveling along active connection traces.

**Files:**
- Create: `packages/visualization/src/theme/tron/effects/TracePulse.tsx`
- Modify: `packages/visualization/src/theme/tron/index.ts` (add to connections.effects)

**Step 1: Create TracePulse component**

This is simpler than ConnectionTraces - it reuses the same segment geometry but with an additive pulse-only shader. It only renders segments for active connections.

```typescript
// packages/visualization/src/theme/tron/effects/TracePulse.tsx
// Renders a traveling pulse effect on active connection traces.
// Reads connection data and positions from SceneContext.
// Uses a TSL shader with gaussian falloff around a time-driven position.
```

The pulse is already built into the `connection-trace.tsl.ts` shader via the `uTime` + `uPulseSpeed` uniforms. The `ConnectionTraces` component already drives `uTime` when `tracePulse` toggle is on.

So TracePulse as a separate component is **not needed** - the pulse is integrated into the base shader. Remove it from the plan and verify the existing pulse works via the toggle.

**Step 2: Verify pulse works**

Run: `bun run dev`, enter multi-resource HCL, hover a node, check that the pulse animation appears on the brightened traces when "Pulse" toggle is ON.

**Step 3: Commit (if any changes needed)**

```bash
git commit -m "feat(viz): verify pulse animation in connection traces"
```

---

### Task 10: TraceParticles Effect Component

Instanced particles flowing along active connection paths.

**Files:**
- Create: `packages/visualization/src/theme/tron/shaders/trace-particles.tsl.ts`
- Create: `packages/visualization/src/theme/tron/effects/TraceParticles.tsx`
- Modify: `packages/visualization/src/theme/tron/index.ts` (add to connections.effects.active)

**Step 1: Create trace particles shader**

Follow the `data-stream.tsl.ts` pattern - instanced billboarded quads. Per-particle attributes:
- `instancePathOffset` (float) - position along the path (0-1), advances with time
- `instanceSpeed` (float) - speed variation
- `instanceConnectionIndex` (float) - which connection this particle belongs to

```typescript
// packages/visualization/src/theme/tron/shaders/trace-particles.tsl.ts
// Instanced billboarded particles that follow connection trace paths.
// Similar to data-stream.tsl.ts but positions are along a path rather than in a volume.
```

The shader computes world position by mapping `pathOffset` to the actual waypoint path. The `uActive` uniform per connection controls visibility.

**Step 2: Create TraceParticles component**

```typescript
// packages/visualization/src/theme/tron/effects/TraceParticles.tsx
// Reads connections and positions from SceneContext.
// For each active connection, spawns 10-15 instanced particles along the trace path.
// Only visible when connectionToggles.traceParticles is true.
```

Key details:
- Uses `InstancedBufferGeometry` with billboarded quads (same pattern as DataStreamParticles)
- Per-particle `instancePathOffset` attribute cycles via `fract(offset + time * speed)`
- Maps path offset to world position by interpolating along the Manhattan route waypoints
- Reads `traceParticles` toggle from `connectionTogglesRef`

**Step 3: Register in theme**

In `packages/visualization/src/theme/tron/index.ts`:

```typescript
import { TraceParticles } from './effects/TraceParticles';

connections: {
  Mesh: ConnectionTraces,
  effects: {
    active: [TraceParticles],
  },
},
```

**Step 4: Test visually**

Run: `bun run dev`, enter multi-resource HCL, enable "Particles" toggle, hover a node.
Expected: Small glowing particles flow along the trace path from source to target.

**Step 5: Commit**

```bash
git add packages/visualization/src/theme/tron/shaders/trace-particles.tsl.ts packages/visualization/src/theme/tron/effects/TraceParticles.tsx packages/visualization/src/theme/tron/index.ts
git commit -m "feat(viz): TraceParticles effect for connection traces"
```

---

### Task 11: Integration Test - parseHcl to Connections

Verify the full pipeline: HCL input → parseHcl → connections → routing.

**Files:**
- Create: `packages/visualization/src/routing/connections.test.ts`

**Step 1: Write integration test**

```typescript
// packages/visualization/src/routing/connections.test.ts
import { describe, test, expect } from 'bun:test';
import { parseHcl } from '../state/parseHcl';
import { manhattanRoute } from './manhattanRoute';

describe('parseHcl → manhattanRoute integration', () => {
  const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.main.id
  ami       = "ami-12345678"
}
`;

  test('parseHcl extracts connections from references', () => {
    const state = parseHcl(hcl);
    expect(state.connections.length).toBe(2);
    expect(state.connections).toContainEqual({
      from: 'aws_subnet.main',
      to: 'aws_vpc.main',
      type: 'reference',
    });
    expect(state.connections).toContainEqual({
      from: 'aws_instance.web',
      to: 'aws_subnet.main',
      type: 'reference',
    });
  });

  test('connections produce valid Manhattan routes', () => {
    const state = parseHcl(hcl);
    // Simulate grid positions for 3 resources
    const positions = new Map<string, [number, number, number]>();
    positions.set('aws_vpc.main', [-1.25, 0, -1.25]);
    positions.set('aws_subnet.main', [1.25, 0, -1.25]);
    positions.set('aws_instance.web', [-1.25, 0, 1.25]);

    for (const [i, conn] of state.connections.entries()) {
      const from = positions.get(conn.from)!;
      const to = positions.get(conn.to)!;
      const route = manhattanRoute(from, to, i);
      expect(route.length).toBeGreaterThanOrEqual(2);
      expect(route[0]).toEqual(from);
      expect(route[route.length - 1]).toEqual(to);
    }
  });

  test('missing resource in positions map produces empty route', () => {
    const positions = new Map<string, [number, number, number]>();
    positions.set('aws_vpc.main', [0, 0, 0]);
    // aws_subnet.main missing
    const route = manhattanRoute([0, 0, 0], [0, 0, 0], 0);
    expect(route).toEqual([]);
  });
});
```

**Step 2: Run tests**

Run: `bun test packages/visualization/src/routing/`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/visualization/src/routing/connections.test.ts
git commit -m "test(viz): integration tests for parseHcl → manhattanRoute pipeline"
```

---

### Task 12: Polish & Visual Tuning

Final pass: tune colors, opacity levels, line widths, animation speeds to look great in the TRON theme.

**Files:**
- Modify: `packages/visualization/src/theme/tron/effects/ConnectionTraces.tsx` (tune constants)
- Modify: `packages/visualization/src/theme/tron/shaders/connection-trace.tsl.ts` (tune shader params)
- Modify: `packages/visualization/src/theme/tron/colors.ts` (add connection-specific colors if needed)

**Step 1: Visual tuning checklist**

Run `bun run dev` with a multi-resource HCL scene and adjust:

- [ ] Dim trace opacity (currently 0.15) - should be barely visible but present
- [ ] Active trace opacity (currently 0.8) - should be bright but not overwhelming
- [ ] Fade transition speed (currently 0.08 lerp) - should feel responsive but smooth
- [ ] Pulse speed (currently 1.5) - should be visible but not frantic
- [ ] Line width (currently 0.06) - should be thinner than the existing TraceLines
- [ ] Connection type colors harmonize with TRON warm palette
- [ ] Dash patterns visible at default zoom level
- [ ] Traces don't z-fight with ground reflections

**Step 2: Run full test suite**

Run: `bun test packages/visualization/src/routing/`
Expected: All tests pass

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(viz): visual tuning for connection traces"
```
