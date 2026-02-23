# Connection Traces Design

Render Terraform resource connections as TRON-styled ground-plane traces with Manhattan routing, directional animation, and interactive highlighting.

## Requirements

- Three relationship types with distinct visual treatments: dependency (reference), attachment, data flow
- Ground-plane traces with Manhattan (right-angle) routing
- Dim until active: all connections visible at ~15% opacity, brighten when source or target is hovered/selected
- Configurable animation: traveling pulse and particle flow, toggled via UI panel

## Architecture

### Theme Extension

Add `connections` to the `Theme` type, same shape as `ground`:

```typescript
connections?: {
  Mesh: React.ComponentType;
  effects: Partial<Record<ActorState, React.ComponentType[]>>;
};
```

### ConnectionActor

New actor in `actors/ConnectionActor.tsx`. Same pattern as `ResourceActor` and `GroundActor` - reads theme config, composes Mesh + effects:

```typescript
function ConnectionActor() {
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

### TRON Theme Provides

- `Mesh` -> `ConnectionTraces` - renders all Manhattan-routed traces on ground plane
- `effects.active` -> `[TracePulse, TraceParticles]` - configurable pulse/particle animations on highlighted connections

### Scene Placement

```
Scene
  ResourceActors...
  GroundActor
  ConnectionActor        <- NEW
  Lights
  PostProcessing
```

## Data Flow

### SceneContext Additions

- `connectionsRef` - `Ref<Connection[]>` - parsed connections array
- `resourcePositionsRef` - `Ref<Map<string, [number, number, number]>>` - resource ID to grid position
- `connectionTogglesRef` - `Ref<Record<string, boolean>>` - toggle state for pulse, particles, labels

### Position Map

Computed in `Scene()` as a `useMemo` over resources. Used for both `ResourceActor` group positioning (replacing inline `gridPosition` calls) and by `ConnectionActor` for trace endpoints.

### Manhattan Routing

Computed inside the theme's `ConnectionTraces` mesh (routing is a visual concern, theme-specific). Takes source/target positions from context, produces waypoint arrays. Midpoint Z offset spreads parallel traces to avoid overlap.

### Activation

Reads `hoveredResourceId` / `selectedResourceId` from existing `SceneContext`. A connection is active when its `from` or `to` matches the hovered/selected resource. No new activation concept needed.

## TSL Shaders

### connection-trace.tsl.ts

Line segments on ground plane (y ~ 0.01). Per-segment uniforms:

- `uConnectionType` - color selection (cyan/amber/green)
- `uActive` - 0.0 (dim) to 1.0 (bright), smoothly interpolated
- `uDashScale` - dash pattern density by type
- `uTime` - global clock

Fragment: base color from type, opacity `mix(0.15, 1.0, uActive)`, dash pattern via `step(fract(vDistance * uDashScale), 0.5)`, soft glow falloff from line center.

### trace-pulse.tsl.ts

Bright spot traveling source-to-target along trace path. Position: `fract(uTime * speed)` mapped to path length. Additive blend, gaussian intensity falloff. Only renders on active connections.

### trace-particles.tsl.ts

Instanced billboards constrained to trace path (same approach as DataStreamParticles). Per-particle `pathOffset` advances over time. 10-20 particles per active connection.

## Visual Differentiation

| Type        | Color | Dash    |
|-------------|-------|---------|
| `reference` | Cyan  | Solid   |
| `attachment`| Amber | Dashed  |
| `dataflow`  | Green | Dotted  |

All three animation modes (base trace, pulse, particles) work with each type's color.

## UI Panel

`ConnectionsPanel` in left sidebar, below existing panels. Only renders when connections exist.

| Key                | Label     | Default |
|--------------------|-----------|---------|
| `connectionTraces` | Traces    | ON      |
| `tracePulse`       | Pulse     | ON      |
| `traceParticles`   | Particles | OFF     |
| `traceLabels`      | Labels    | OFF     |

Constants added to `theme/tron/effects.ts` alongside existing effect definitions.

## Testing

TDD, no mocks, quiet success/loud failure.

**Manhattan routing** (pure function):
- L-shaped path between two positions
- Parallel connections offset to avoid overlap
- Same-row/same-column nodes produce straight lines
- Missing resource ID in positions map: skip, don't crash

**Position map computation:**
- Single resource centered at origin
- Multiple resources in correct grid layout
- Custom position field overrides grid

**Activation logic:**
- Hover/select resource: its connections become active
- No interaction: all connections inactive (dim)
- Resource with no connections: nothing activates

**Integration with parseHcl:**
- HCL with `vpc_id = aws_vpc.main.id` -> connection in state -> traces render between correct nodes
