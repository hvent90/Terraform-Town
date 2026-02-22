# Visualization Lighting Refactor Progress

Based on: `docs/lighting/scene-implementation-handbook.md`

## Summary

Refactored the visualization package to implement the handbook's TRON dark scene lighting techniques. All changes are based on the handbook's Section 14 "Putting It All Together" recommended setup plus Section 3 frosted glass materials.

## Steps

| # | Step | Status |
|---|------|--------|
| 1 | Update types.ts - frosted glass props, directional light, rim light, bloom, dotGrid, pointLight | Done |
| 2 | Update default theme - Section 14 recommended values + Section 3 frosted glass | Done |
| 3 | Update ResourceFactory.ts - MeshPhysicalMaterial for frosted glass, real PointLights | Done |
| 4 | Update Visualization.ts - dual cameras, lighting pipeline, shadows, post-processing, compass | Done |
| 5 | Delete FakeLight.ts | Done |
| 6 | Update tests (theme.test.ts, ResourceFactory.test.ts, setup.ts) | Done |
| 7 | Run tests and verify | Done (139 pass, 0 fail) |

## Changes Made

### types.ts
- Changed `fog` from `{ color, near, far }` (linear) to `{ color, density }` (exponential FogExp2)
- Added `hemisphereLight` config: skyColor, groundColor, intensity
- Added `directionalLight` config: color, intensity, position, castShadow, shadowMapSize
- Added `rimLight` config: color, intensity, position
- Added `bloom` config: strength, radius, threshold
- Added `dotGrid` to ground config: dotColor, spacing, dotSize
- Added frosted glass properties per resource: `transmission`, `roughness`, `thickness`, `metalness`
- Added `pointLight` config per resource: intensity, distance, decay

### themes/default.ts
- **Background**: `#000000` (was `#0a0a0a`) — pure black for TRON aesthetic
- **Ground**: Dot grid with white dots (was checkerboard) — cleaner dark scene floor
- **Ambient light**: `#050510` @ 0.1 (was `#222222` @ 0.5) — Section 14 Step 1
- **Hemisphere light**: NEW — sky `#001122`, ground `#000005` @ 0.2 — Section 14 Step 2
- **Directional light**: NEW — `#6688cc` @ 0.3, shadow-casting, position (5, 10, 5), 512px shadow map — Section 14 Step 4
- **Rim light**: NEW — `#0088ff` @ 0.4, position (-5, 3, -5) — Section 14 Step 5
- **Bloom**: NEW — strength 0.4, radius 0.3, threshold 0.6
- Added `transmission`, `roughness`, `thickness`, `metalness` to all non-wireframe resources — Section 3
- Added `pointLight` configs per resource type — Section 4

### ResourceFactory.ts
- Removed `createFakeLight` import and all fake light usage
- Resources with `transmission` (and not wireframe) now use `MeshPhysicalMaterial`
  - Properties: color, emissive, emissiveIntensity, transmission, roughness, thickness, metalness, toneMapped: false
  - This creates the frosted glass effect from Section 3
- Wireframe resources (security_group) remain `MeshStandardMaterial`
- Real `PointLight` inside each mesh for floor illumination (replaces fake light texture planes)
- `castShadow = false` on all internal PointLights — Section 12 performance guidance
- Mesh positioned so bottom sits on ground plane (Y = -1)

### Visualization.ts
- **Dual cameras**: Orthographic (default) + Perspective (toggle with 'C' key)
- **Compass**: Small axes overlay in bottom-left corner with labeled X/Y/Z
- **Renderer**: Shadow mapping enabled (PCFSoftShadowMap), SRGB color space, autoClear: false
- **Lighting**: Full Section 14 pipeline — ambient, hemisphere, directional (shadow), rim
- **Ground**: Dot grid pattern (canvas-rendered repeating texture), receives shadows
- **Post-processing**: EffectComposer with RenderPass + UnrealBloomPass + OutputPass
- **Controls**: Ortho = pan+zoom only; Perspective = rotate+pan+zoom

### FakeLight.ts
- Deleted — legacy radial gradient texture plane approach replaced by real PointLights

### tests/setup.ts
- Added 2D canvas context stub for jsdom (compass labels + dot grid ground need `getContext('2d')`)

### tests/theme.test.ts
- Updated background expectation (`#000000`)
- Added tests for Section 14 lighting values (ambient, hemisphere, directional, rim)
- Added tests for Section 3 frosted glass properties (transmission, roughness, metalness)

### tests/ResourceFactory.test.ts
- Updated material type assertions (MeshPhysicalMaterial for glass, MeshStandardMaterial for wireframe)
- Updated emissiveIntensity expectation (no longer doubled)
- Replaced fake light test with PointLight test
- Added frosted glass property tests (transmission, roughness, thickness)

### interactions/Selection.ts
- Added `setCamera()` method for camera toggle support

## Handbook Sections Implemented

| Handbook Section | What Was Implemented |
|-----------------|---------------------|
| Section 1: Aesthetic Identity | Cool neon color palette, three-point lighting adapted for dark scene |
| Section 2: Scene Foundation | Ambient + hemisphere light with handbook values, dark ground plane |
| Section 3: Frosted Glass | MeshPhysicalMaterial with transmission/roughness/thickness |
| Section 4: Internal Lighting | PointLights inside each mesh with neon emissive colors |
| Section 5: Shadows | DirectionalLight with castShadow, ground receiveShadow, PCFSoftShadowMap |
| Section 6: Post-Processing | UnrealBloomPass for neon glow, toneMapped:false for HDR detection |
| Section 12: Performance | Internal PointLights have castShadow=false, geometry caching |
| Section 14: Complete Setup | Full recommended TRON dark scene lighting pipeline |

## Verification

```
npx vitest run → 139 pass, 0 fail
npx vite build → 60 modules, 187ms
```
