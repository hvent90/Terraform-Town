# Visualization WebGPU + TSL — Design Document

**Date**: 2026-02-21
**Status**: Approved
**Supersedes**: Existing visualization implementation (clean slate rebuild)
**Reference**: `docs/plans/2026-02-21-scene-implementation-handbook-design.md` (Sections 1-6, 8-11)

## Purpose

Fresh implementation of Terraform Town's 3D visualization using WebGPU renderer and Three Shading Language (TSL) for all materials. Replaces the existing WebGL-based implementation with the modern Three.js WebGPU path.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Renderer | WebGPURenderer (auto WebGL2 fallback) | Modern GPU API, higher light limits, TSL support |
| Materials | Full TSL (MeshPhysicalNodeMaterial) | Node-based materials with per-pixel control, future-proof |
| Post-processing | RenderPipeline + TSL bloom() | Native node-based pipeline, no legacy EffectComposer |
| Tests | None | Visual system, verify by running |
| Scope | Handbook Sections 1-6, 8-11 | Core rendering + interactions. Skip GPU particles (7), performance optimization (12), platform (13) |
| Architecture | Same modular structure | Proven module split, rewrite internals |
| Three.js version | r171+ (r183 recommended) | Minimum for three/webgpu and three/tsl imports |

## Architecture

### File Structure

```
packages/visualization/src/
├── Visualization.ts        # Main class: scene, cameras, lights, post-processing, render loop
├── types.ts                # TypeScript interfaces
├── index.ts                # Package exports
├── demo.ts                 # Demo scene with sample EC2 stack
├── resources/
│   └── ResourceFactory.ts  # TSL material creation + PointLights + geometry cache
├── interactions/
│   └── Selection.ts        # Hover tooltips, click panels, double-click focus
├── animations/
│   └── Animator.ts         # Create/destroy/pulse/modify animations with easing
├── layout/
│   └── ForceLayout.ts      # D3-force graph positioning
├── state/
│   └── StateSync.ts        # Terraform state JSON parser
└── themes/
    └── default.ts          # TRON dark theme configuration
```

### Import Pattern

```typescript
import * as THREE from 'three/webgpu'
import { color, float, vec3, uniform, texture, uv, pass, bloom } from 'three/tsl'
```

### Initialization (Async)

```typescript
const renderer = new THREE.WebGPURenderer({ antialias: true })
await renderer.init()  // MANDATORY for WebGPU
```

## Scene Foundation (Handbook Sections 1-2)

### Aesthetic

- 95% darkness, 5% light — light is precious, intentional
- Near-black background (#000000), no skybox, no fog
- Ground plane only visible where resource light touches it
- Orthographic/isometric camera — flat, god-view, like a motherboard under magnification

### Renderer

- WebGPURenderer with antialias, SRGB color space
- Shadow maps enabled (PCFSoftShadowMap)
- Pixel ratio capped at 2

### Cameras

- **Primary**: OrthographicCamera (isometric god-view)
  - Frustum sized to viewport aspect ratio
  - OrbitControls: pan, zoom (clamped), limited rotation
- **Secondary**: PerspectiveCamera (toggle with 'C' key)
  - 60 degree FOV, same position/target

### Ground Plane

- Large PlaneGeometry (200x200, scales dynamically)
- Dark material with dot-grid pattern (canvas-rendered repeating texture)
- `receiveShadow: true`
- Barely visible until lit by resource glow

### Ambient Lighting (5-layer system)

| Layer | Type | Color | Intensity | Purpose |
|-------|------|-------|-----------|---------|
| 1 | AmbientLight | #050510 | 0.1 | Near-invisible base |
| 2 | HemisphereLight | sky #001122, ground #000005 | 0.2 | Subtle gradient |
| 3 | DirectionalLight | #6688cc | 0.3 | Shadow-casting, from (5,10,5) |
| 4 | PointLight (rim) | #0088ff | 0.4 | Edge separation, from (-5,3,-5) |
| 5 | Per-resource PointLights | varies | varies | Internal glow (via ResourceFactory) |

## Frosted Glass Materials (Handbook Section 3)

### TSL Node Materials

All resource materials use `MeshPhysicalNodeMaterial` with TSL nodes:

```typescript
const material = new THREE.MeshPhysicalNodeMaterial()
material.colorNode = color(resourceColor)
material.transmissionNode = uniform(0.7 - 0.9)
material.roughnessNode = uniform(0.4 - 0.5)
material.thicknessNode = uniform(0.2 - 0.5)
material.metalnessNode = uniform(0.0)
material.emissiveNode = color(resourceColor).mul(float(emissiveIntensity))
material.opacityNode = uniform(resourceOpacity)
material.transparent = true
material.toneMapped = false  // preserve HDR for bloom detection
```

### Exception: Security Group

```typescript
// Wireframe sphere — uses MeshStandardNodeMaterial
const material = new THREE.MeshStandardNodeMaterial()
material.wireframe = true
material.colorNode = color(0xFF8C00)
material.emissiveNode = color(0xFF8C00).mul(float(0.6))
```

## Internal Lighting (Handbook Section 4)

Every resource mesh contains a `PointLight` positioned at its center:
- Color matches resource type
- Intensity range: 20-80 (varies by type)
- Distance falloff configured per type
- `castShadow: false` (only directional light casts shadows)

Light color semantics:
- Cyan = networking (VPC, subnet)
- Green = compute (instance)
- Violet/Magenta = storage/serverless (S3, Lambda)
- Gold = identity (IAM)
- Orange = security (security group)

## Shadows (Handbook Section 5)

- Single shadow-casting DirectionalLight (from layer 3)
- `PCFSoftShadowMap` type for soft edges
- Shadow map size: 512x512
- Ground plane receives shadows
- Resource meshes cast shadows
- Internal PointLights do NOT cast shadows (performance)

## Post-Processing & Bloom (Handbook Section 6)

### TSL-based Pipeline

```typescript
const renderPipeline = new THREE.RenderPipeline(renderer)
const scenePass = pass(scene, camera)
const scenePassColor = scenePass.getTextureNode('output')
const bloomEffect = bloom(scenePassColor, 0.4, 0.3, 0.6)
renderPipeline.outputNode = scenePassColor.add(bloomEffect)
```

### Bloom Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| strength | 0.4 | Gentle luminance, not overwhelming |
| radius | 0.3 | Soft halo spread |
| threshold | 0.6 | Only bright emissive objects bloom |

Resources bloom via `emissiveNode` values pushed above threshold with `toneMapped: false`. Ground and background never bloom.

## Resource Primitives (Handbook Section 8)

### Type Catalog

| Type | Geometry | Size | Color | Opacity | PointLight Intensity |
|------|----------|------|-------|---------|---------------------|
| vpc | BoxGeometry | 10x10x10 | #00FFFF (cyan) | 0.2 | 20 |
| subnet | BoxGeometry | 4x4x4 | #0066FF (blue) | 0.85 | 40 |
| security_group | SphereGeometry (wireframe) | r=3 | #FF8C00 (orange) | 0.5 | 30 |
| instance | BoxGeometry | 2x2x2 | #39FF14 (green) | 0.9 | 60 |
| s3_bucket | CylinderGeometry | r=1.5, h=2 | #B026FF (magenta) | 0.9 | 50 |
| iam_role | BoxGeometry | 1.5x2x0.3 | #FFD700 (gold) | 0.9 | 40 |
| lambda_function | SphereGeometry | r=1 | #FF00FF (magenta) | 0.9 | 80 |

### Geometry Caching

One geometry instance per type, reused across all resources of that type. 7 geometries total.

### Containment Hierarchy

VPC > Subnet > Instance. Parent containers rendered at low opacity (0.2) so children are visible inside.

## PCB Trace Connections (Handbook Section 9)

- `BufferGeometry` with 2 points per line
- `LineBasicMaterial` — cyan `#00FFFF` @ 30% opacity
- Positions update each frame from current mesh positions
- Connections stored in Map keyed by `"from->to"`
- Missing endpoints gracefully skipped

## State Visualization & Animation (Handbook Section 10)

### Resource States

| State | Opacity | Effect |
|-------|---------|--------|
| planned | 50% | Pulsing sine-wave opacity |
| applied | 100% | Stable, full brightness |
| modified | 100% | Yellow glow flash, then settle |
| destroyed | Fading | Red tint, scale to 0 |
| error | 100% | Red pulse |

### Animations

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Create | 300ms | easeOutQuad | scale 0→1, opacity 0→target |
| Destroy | 300ms | easeInQuad | scale 1→0, opacity→0, then remove |
| Pulse | 1000ms | sine | opacity ±0.15 around target (indefinite) |
| Focus | 600ms | easeInOutCubic | camera position to offset above/behind target |

All animations are frame-independent (use delta milliseconds), interruptible.

### Easing Functions

- linear, easeIn, easeOut, easeInOut (cubic)
- easeOutQuad for create (fast start, soft landing)
- Sine wave for pulse

## Interaction Model (Handbook Section 11)

### Mouse

- **Hover**: Raycasting from camera through mouse → tooltip with resource name + type, follows cursor
- **Click**: Select resource → detail panel (fixed position, top-right) showing all attributes recursively
- **Double-click**: Animate camera to offset position (20 units above, 40 units behind target, 600ms)
- **Drag**: Pan (via OrbitControls)
- **Scroll**: Zoom (via OrbitControls, clamped)

### Keyboard

- **Escape**: Deselect, close detail panel
- **C**: Toggle orthographic ↔ perspective camera

### DOM Overlays

- Tooltip: follows mouse, shows name + type
- Detail panel: fixed position, shows attributes hierarchically

## State Parsing (from Handbook Section 13)

Parses `terraform.tfstate` JSON format:
- Extracts resources from `state.resources[].type`, `.name`, `.instances[].attributes`
- Maps Terraform types to visualization types (e.g., `aws_vpc` → `vpc`)
- Builds connection graph from reference attributes: `vpc_id`, `subnet_id`, `vpc_security_group_ids`
- Detects parent-child hierarchy
- Silently ignores references to resources not in state

## Layout (D3-Force)

- Charge repulsion: strength -200
- Collision avoidance: radius 8
- Link forces: distance 20, strength 1 (connections + parent-child)
- Center attraction
- Maps 2D simulation positions to 3D (x, y=0, z)

## Technology Stack

| Tool | Purpose |
|------|---------|
| Three.js (r183+) | 3D rendering engine |
| three/webgpu | WebGPU renderer with WebGL2 fallback |
| three/tsl | Three Shading Language for node-based materials |
| d3-force | Force-directed graph layout |
| Vite | Build tooling |
| Bun | Runtime & package manager |
