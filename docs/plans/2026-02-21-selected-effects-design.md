# Selected Effects System Design

## Overview

Add a toggleable selected effects system mirroring the existing hover effects panel. When the cube is clicked (selected), a separate set of 8 visual effects can be individually toggled on/off via a UI panel. Selected effects are fully independent from hover effects — both can coexist without interaction.

## Data Model & Context

New type:

```ts
type SelectEffectKey = 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker'
                     | 'edgePulse' | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';
```

- `selectedTRef` — `useRef<number>` smoothly interpolating 0→1 when selected, 1→0 when deselected. Same lerp as `hoverTRef`.
- `selectTogglesRef` — `useRef<Record<SelectEffectKey, boolean>>` added to context.
- Rename `HoverContext` to `CubeContext` to reflect broader scope.

## Effects

1. **Orbit Ring** — `THREE.TorusGeometry` orbiting the cube at a tilted angle. Continuous rotation, additive blending, amber glow. Fades in/out with `selectedTRef`.

2. **Data Stream Particles** — ~200 point particles rising vertically from the cube's top face, fading out as they ascend. Suggests data transmission.

3. **Ground Connection Beam** — Vertical rectangular plane with gradient shader beneath the cube connecting to ground. Subtle pulsing opacity.

4. **Holographic Flicker** — Scanline/interference uniform added to existing face shader. Horizontal lines scroll across faces with occasional flicker.

5. **Edge Highlight Pulse** — Bright pulse along edges on selection transition (one-shot), then settles to brighter steady state.

6. **Face Data Overlay** — Scrolling grid/text pattern in face shader. Subtle matrix-rain style, amber-tinted.

7. **Status Glow Shift** — Cube color shifts toward EC2 state color (green for "running"). Affects face inner color and edge colors.

8. **Trace Activation** — Radial pulse expanding outward from cube along ground trace lines on selection. Plays on transition, then subtle continuous pulse.

## UI

Second control panel positioned below the existing Hover Effects panel. Same styling (dark glass, monospace, amber theme). Header: "Selected Effects" with collapse toggle. 8 toggle switches matching hover panel style.

## Component Structure

New standalone components:
- `OrbitRing` — reads `selectedTRef` + `selectTogglesRef.orbitRing`
- `DataStreamParticles` — same pattern
- `GroundConnectionBeam` — same pattern

Modified existing components:
- `GlowingCube` — gains uniforms for `holoFlicker`, `edgePulse`, `faceDataOverlay`, `statusGlow`
- `TraceLines` — gains uniform for `traceActivation`

## Architecture

Mirrors existing hover system exactly:
- Independent toggle state, independent interpolation ref
- Each component reads both hover and selected refs
- No coupling between the two systems
