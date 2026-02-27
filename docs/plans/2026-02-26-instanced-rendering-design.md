# Instanced Rendering & Frustum Culling

**Date**: 2026-02-26
**Problem**: 818 terraform resources × ~15 draw calls each = ~12,000 draw calls per frame. The 3D visualization is unusable at this scale.
**Goal**: Reduce draw calls to ~200-300 while preserving per-resource hover/select interaction.

## Current Architecture

Each resource renders individually via `ResourceActor` → `CubeMesh` + effects:

| Component | Meshes per resource | Total (818 resources) |
|-----------|--------------------|-----------------------|
| Face planes (6 per cube) | 6 | 4,908 |
| Edge wireframe | 1 | 818 |
| Halo sprite | 1 | 818 |
| Trace borders (4 per cube) | 4 | 3,272 |
| Ground particles | 1 (3000 instanced) | 818 |
| Resource label | 1 | 818 |
| Hover detector | 1 | 818 |
| **Subtotal** | **~15** | **~12,270** |

Selection effects (OrbitRing, DataStreamParticles, GroundConnectionBeam) only apply to 1 resource at a time — negligible.

## Design

### 1. InstancedCubeRenderer (Scene-Level)

A new component `InstancedCubeRenderer` replaces per-resource `<CubeMesh />` and `<TraceBorders />`. Rendered once at the Scene level as a sibling to `GroundActor` and `ConnectionActor`.

Creates 4 `InstancedMesh` objects:

**Faces** (1 draw call for all resources):
- Merged geometry: all 6 face planes baked into one geometry with rotations/offsets in vertex positions
- Per-instance attributes: `instanceWorldPos` (vec3), `instanceColorInner` (vec3), `instanceColorEdge` (vec3), `instanceHover` (float), `instanceSeparation` (float), `instanceHoloFlicker` (float), `instanceDataOverlay` (float), `instanceLift` (float)

**Edges** (1 draw call):
- `EdgesGeometry` from `BoxGeometry` instanced N times
- Per-instance: `instanceWorldPos`, `instanceColorBot`, `instanceHover`, `instanceEdgeIntensify`, `instanceLift`

**Halos** (1 draw call):
- Single quad instanced N times
- Per-instance: `instanceWorldPos`, `instanceColor`, `instanceScale`, `instanceOpacity`, `instanceLift`

**Trace borders** (1 draw call):
- Merged 4-border geometry instanced N times
- Per-instance: `instanceWorldPos`, `instanceColor`, `instancePulseAlpha`, `instancePulseTime`

A single `useFrame` loop iterates all resources, reads `hoverTMapRef`/`selectedTMapRef`, computes per-instance values, and writes into instance attribute buffers with `needsUpdate = true`.

### 2. TSL Shader Migration

Face/edge/trace shaders currently use `uniform(...)` for per-resource values (`uHover`, `uColorInner`, etc.). These become per-instance attributes read via `attribute(...)` in the TSL shader graph.

The shader math stays identical — only the data source changes. The face shader's vertex displacement (`normalLocal.mul(uSeparation)`) works naturally since each instance reads its own separation value.

### 3. Frustum Culling for Per-Resource Effects

Components that remain per-resource (`GroundParticles`, `ResourceLabel`, `HoverDetector`) get frustum culling:

- Each frame, test each resource's world position against the camera frustum using `THREE.Frustum` with a bounding sphere (~3 unit radius)
- Set `mesh.visible = false` for off-screen resources — Three.js skips the draw call
- ~818 frustum tests per frame is cheap

### 4. No Changes

- `HoverDetector` stays per-resource (needs individual meshes for R3F raycasting events). Frustum culled.
- `OrbitRing`, `DataStreamParticles`, `GroundConnectionBeam` stay as-is (only 1 selected resource at a time).
- `ResourceLabel` stays per-resource (canvas-rendered text texture). Frustum culled.

## Draw Call Impact

| Component | Before | After |
|-----------|--------|-------|
| Face planes | 4,908 | 1 |
| Edge wireframes | 818 | 1 |
| Halos | 818 | 1 |
| Trace borders | 3,272 | 1 |
| Ground particles | 818 | ~50-100 (culled) |
| Labels | 818 | ~50-100 (culled) |
| HoverDetectors | 818 | ~50-100 (culled) |
| Selection effects | 3 | 3 |
| **Total** | **~12,273** | **~154-304** |

## Files Changed

- `packages/visualization/src/theme/tron/meshes/CubeMesh.tsx` — Replaced by InstancedCubeRenderer
- `packages/visualization/src/theme/tron/meshes/InstancedCubeRenderer.tsx` — New
- `packages/visualization/src/theme/tron/shaders/face.tsl.ts` — Uniforms → instance attributes
- `packages/visualization/src/theme/tron/shaders/edge.tsl.ts` — Uniforms → instance attributes
- `packages/visualization/src/theme/tron/shaders/trace.tsl.ts` — Uniforms → instance attributes
- `packages/visualization/src/theme/tron/effects/TraceBorders.tsx` — Absorbed into InstancedCubeRenderer
- `packages/visualization/src/theme/tron/effects/GroundParticles.tsx` — Add frustum culling
- `packages/visualization/src/theme/tron/effects/HoverDetector.tsx` — Add frustum culling
- `packages/visualization/src/App.tsx` — Add InstancedCubeRenderer to Scene, remove CubeMesh from ResourceActor
- `packages/visualization/src/actors/ResourceActor.tsx` — Remove Mesh rendering (handled by instancer)
- `packages/visualization/src/theme/tron/index.ts` — Update theme config
- `packages/visualization/src/shared/frustum.ts` — New: shared frustum culling utility
