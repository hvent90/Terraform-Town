# Scene Implementation Handbook — Design Document

**Date**: 2026-02-21
**Status**: Approved
**Supersedes**: `docs/visualization-requirements.md` (aesthetic/visual sections)

## Purpose

A single holistic reference for implementing Terraform Town's 3D visualization. Combines aesthetic direction ("what it should look like") with practical Three.js implementation ("how to build it") so a single implementer can build the entire scene end-to-end.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audience | Single implementer (AI agent or person) | Self-contained reference, no cross-doc bouncing |
| Document structure | Vision-first per section | Each section opens with aesthetic direction, then drills into code |
| Rendering framework | Raw Three.js + thin React wrapper | Full control over custom shaders, GPU particles, selective bloom pipeline. R3F would be a thin shell with constant imperative escapes. |
| Fog/atmosphere | Removed | Depth fog doesn't work well with orthographic camera and selective bloom pipeline |
| Particle effects | GPU-accelerated | Ambient life, data flow visualization, state transition bursts |
| Relationship to existing docs | Absorbs and supersedes visualization-requirements.md | One doc to rule them all |
| Visual references | Descriptive text only | No external image links; precise enough for an implementer to build to spec |

## Aesthetic Pillars

**TRON Legacy** — the visual language: dark voids, neon edge-lit geometry, frosted translucent surfaces, light bleeding through glass, monochromatic color islands in vast darkness.

**Factorio** — the spatial language: top-down isometric, dense component fields, trace connections between nodes, the feeling of a living circuit board being assembled piece by piece.

**The merge**: TRON's lighting and materials applied to Factorio's spatial layout and gameplay density.

---

## Document Structure

### 1. Aesthetic Identity

#### 1.1 The Two Pillars: TRON x Factorio
- TRON Legacy visual language (dark voids, neon edge-lit geometry, frosted translucent surfaces, light bleeding through glass, monochromatic color islands in vast darkness)
- Factorio spatial language (top-down isometric, dense component fields, trace connections between nodes, a living circuit board assembled piece by piece)
- How they merge: TRON's lighting/materials on Factorio's spatial layout

#### 1.2 Mood & Atmosphere
- Dominant feeling: quiet power — a dark operations floor where infrastructure hums
- Light ratio: 95% darkness, 5% light (light is precious, intentional)
- Silence vs activity: idle scenes are nearly black; as resources appear, the board comes alive

#### 1.3 Color Philosophy
- The palette: muted neons against deep void
- Color semantics: each resource type owns a color (cyan=networking, green=compute, violet=storage, gold=identity, magenta=serverless)
- Color temperature: cool ambient (blue-black), warm accents only from resource internals
- Contrast rule: colors never compete — each resource is an island of light in darkness

#### 1.4 Spatial Language
- Camera: orthographic/isometric — flat, god-view, like looking at a motherboard under magnification
- Scale: primitives are small, the void is vast — infrastructure feels like precision components on an infinite dark plane
- Density: starts sparse, grows dense as the user builds — the "town" fills in
- Depth cues: light falloff and bloom, not perspective

---

### 2. Scene Foundation

#### 2.1 Aesthetic Direction
- The void: background is near-black, not pure black (subtle depth)
- The ground plane: exists only where light touches it — dark surface with faint grid/checkerboard that appears under resource glow
- No skybox, no horizon — infinite dark in all directions

#### 2.2 Renderer Setup
- WebGL renderer config (tone mapping, color space, output encoding)
- Pixel ratio, antialiasing, alpha settings
- Code: complete renderer initialization

#### 2.3 Orthographic Camera Configuration
- Frustum sizing, zoom range
- OrbitControls constraints (pan, zoom, limited rotation)
- Code: camera + controls setup

#### 2.4 Ground Plane
- Geometry and material for the dark ground
- Subtle checkerboard pattern (barely visible until lit)
- Shadow-receiving configuration
- Code: ground plane with shadow receiver

#### 2.5 Scene-Level Ambient Light
- Very dim ambient (just enough to hint at geometry edges)
- HemisphereLight for subtle sky/ground color separation
- Code: ambient lighting setup

---

### 3. Frosted Glass Materials

#### 3.1 Aesthetic Direction
- The signature look: small translucent objects that glow from within
- Frosted glass = light scatters through the surface, soft halos
- Each primitive is a lantern — the glass is the shade, the light is inside
- Surface quality: not crystal clear, not fully opaque — milky, diffused, like sea glass or frosted acrylic

#### 3.2 MeshPhysicalMaterial Transmission Config
- transmission, roughness, IOR, thickness configuration
- Exact property values for the frosted glass look
- Code: complete material setup per resource type

#### 3.3 Emissive as Complement
- Emissive properties on the glass material itself
- How emissive + transmission interact
- Tuning emissiveIntensity per resource type

#### 3.4 TSL / WebGPU Future Path
- Node-based material system for future-proofing
- When this becomes relevant (WebGPU adoption)

---

### 4. Internal Lighting System

#### 4.1 Aesthetic Direction
- Every resource has a light source inside — THE defining visual feature
- Light bleeds outward through frosted glass, casting soft colored pools on the ground
- Idle resources glow steadily; active/modified resources pulse
- The ground plane comes alive with overlapping color halos

#### 4.2 PointLight Per Primitive
- Color, intensity, distance, decay per resource type
- Positioning inside the mesh geometry
- Code: PointLight creation and attachment

#### 4.3 Managing Many Point Lights
- Performance budget: practical limits (WebGL ~16-32 active lights)
- Strategies: LOD lights, distance culling, instanced alternatives
- When to fake it with emissive-only (no real light)

#### 4.4 RectAreaLight for Flat Panels
- For resources that read as flat screens or panels
- Configuration and use cases

#### 4.5 Light Color Semantics
- Resource type -> light color mapping (matches material emissive)
- Color intensity variations by resource state (planned=dim, applied=full, error=red override)

---

### 5. Shadows

#### 5.1 Aesthetic Direction
- Soft shadows on the ground — light pools have soft edges
- Shadows reinforce the "light from within" illusion
- No hard shadows — everything is diffused

#### 5.2 Shadow Map Configuration
- Shadow map type (VSM for softness), size, bias
- Code: shadow setup on renderer and lights

#### 5.3 Selective Shadow Casting
- Which lights cast shadows (budget: 2-4 shadow-casting lights max)
- Strategy: nearest/most important lights cast shadows, rest don't
- Code: selective shadow configuration

#### 5.4 Contact Shadows Alternative
- Lightweight approach for ground-contact shadows
- When to use instead of real shadow maps

---

### 6. Post-Processing & Bloom

#### 6.1 Aesthetic Direction
- Selective bloom is what makes this TRON — neon glow halos around each primitive, soft light bleeding into the darkness
- Bloom should be subtle, not overwhelming — "gentle luminance" not "lens flare"
- Only resources and connections bloom, never the ground or background

#### 6.2 Selective Bloom via Layers
- UnrealBloomPass with Three.js layer system
- Bloom layer assignment (which objects glow)
- Code: complete EffectComposer pipeline setup

#### 6.3 Bloom Tuning
- strength, radius, threshold — starting values for the aesthetic
- Per-resource bloom intensity via emissive tuning
- The ShaderPass merge approach (bloom scene + base scene)

#### 6.4 EffectComposer Pipeline
- Full render pipeline: RenderPass -> UnrealBloomPass -> ShaderPass merge
- Code: complete pipeline from setup to render loop integration

---

### 7. GPU Particle Effects

#### 7.1 Aesthetic Direction
- Particles as ambient life — the board hums, light motes drift around active resources
- Dust/ember particles rising from active resources (like heat shimmer from a circuit)
- Data flow particles along PCB trace connections
- Creation/destruction bursts — resource appears in a scatter of sparks, dissolves into drifting particles
- Idle ambient: sparse, slow-moving luminous specks floating across the dark void

#### 7.2 GPU-Accelerated Particle System
- Approach: BufferGeometry + custom ShaderMaterial with vertex animation (positions computed in vertex shader)
- Alternative: THREE.Points with PointsMaterial for simple cases
- TSL/WebGPU compute shader path for future
- Transform feedback or texture-based state for stateful particles

#### 7.3 Particle Archetypes
- **Ambient motes**: slow drift, low count, subtle bloom — always present
- **Resource aura**: small particles orbiting/rising from active resources — tied to resource state
- **Connection flow**: particles streaming along trace lines — indicates data flow direction
- **Burst effects**: creation spark burst, destruction dissolve scatter — tied to state transitions
- **Error sparks**: erratic red particles for error state

#### 7.4 Performance Considerations
- GPU instancing for particles (no CPU position updates)
- Particle budget per effect type
- LOD: fewer particles at distance, none when off-screen
- Texture atlas for particle sprites vs point primitives

#### 7.5 Particle + Bloom Integration
- Particles on the bloom layer for soft glow
- Emissive particle material tuning

---

### 8. Resource Primitives Catalog

#### 8.1 Aesthetic Direction
- Primitives are small, precise, jewel-like — circuit board components
- Each type has a distinct silhouette readable from isometric view
- Size hierarchy: containers (VPC) > groups > individual resources

#### 8.2 Base Shapes & Geometry
- Table: resource type -> primitive shape -> dimensions
- BoxGeometry, SphereGeometry, CylinderGeometry, custom Shield
- Code: geometry creation per type

#### 8.3 Resource Type Mappings
- VPC (transparent cube, contains children)
- Subnet (smaller cube, nested in VPC)
- Security Group (wireframe sphere, encompasses resources)
- EC2 Instance (solid cube, server-like)
- S3 Bucket (cylinder, bucket shape)
- IAM Role (shield/badge)
- Lambda Function (sphere with glow rings)

#### 8.4 Material + Light Configuration Per Type
- Complete table: type -> color, emissive, emissiveIntensity, opacity, pointLight config
- Code: ResourceFactory creating mesh + material + internal light

#### 8.5 Containment & Hierarchy
- Parent-child nesting (VPC > Subnet > Instance)
- Transparent container rendering
- Z-ordering for overlapping containers

---

### 9. PCB Trace Connections

#### 9.1 Aesthetic Direction
- Connections are glowing traces — like copper traces on a circuit board lit from below
- Thin, precise, subtly pulsing with data flow
- Color: muted cyan or white, never competing with resource colors

#### 9.2 Line Geometry
- BufferGeometry with LineBasicMaterial + emissive
- Line width considerations (WebGL limitations)
- Code: connection line creation

#### 9.3 Animated Pulse / Flow
- Dash animation or gradient scroll along connections
- Direction indicates data flow / dependency direction

#### 9.4 Connection Bloom Integration
- Lines on the bloom layer for subtle glow
- Tuning so lines glow but don't overpower resources

---

### 10. State Visualization & Animation

#### 10.1 Aesthetic Direction
- State changes are events — the board reacts
- Creation: resource materializes (fade in + scale up), light turns on
- Destruction: light dims, resource dissolves into darkness
- Modification: pulse/flash, then settle to new state
- Planning: ghosted preview — translucent, flickering, "not yet real"

#### 10.2 Animation Types & Timing
- Table: animation -> duration -> easing -> properties
- Create, destroy, modify, hover, select, camera focus

#### 10.3 State-Driven Material Changes
- planned -> dim, pulsing, low opacity
- applied -> full brightness, stable
- modified -> yellow glow flash, then settle
- destroyed -> red, fading out
- error -> red pulse, icon overlay

#### 10.4 Animation Queue & Orchestration
- Animator class design
- Queuing, interruption, priority

---

### 11. Interaction Model

#### 11.1 Mouse / Touch / Keyboard
- Hover (raycast -> tooltip + scale), click (select -> detail panel), double-click (camera focus)
- Drag/pan, scroll/zoom, orbit
- Keyboard shortcuts (Escape, Tab, R, F)
- Touch: tap, double-tap, pinch, swipe

#### 11.2 Tooltip & Detail Panel
- Tooltip: resource name, type, state — appears on hover
- Detail panel: full attribute list, connections — appears on click
- DOM overlay approach

#### 11.3 Selection Visuals
- Outline glow on selected resource
- How selection interacts with bloom

---

### 12. Performance Guide

#### 12.1 Light Budget
- Max practical light count and when to fake with emissive
- Distance-based light culling

#### 12.2 Instanced Rendering
- InstancedMesh for repeated primitive types (100+ of same shape)
- Per-instance color and transform

#### 12.3 Level of Detail
- Distance tiers: full geometry -> simplified -> bounding box
- LOD for lights (real light -> emissive only -> flat color)

#### 12.4 Shadow Budget
- Max shadow-casting lights
- Shadow map size trade-offs

#### 12.5 Performance Targets
- Table: resource count -> technique -> FPS target
- 1-100: standard (60fps), 100-1000: instanced (60fps), 1000+: instancing + LOD + culling (30fps)

#### 12.6 WebGPU vs WebGL
- Current WebGL path
- WebGPU future considerations (TSL, higher light limits)

---

### 13. Data Contracts & Integration

#### 13.1 Input State Format
- TerraformState, Resource, Connection TypeScript interfaces
- ResourceType enum

#### 13.2 Visualization API
- Imperative Three.js engine class
- Thin React wrapper component (receives terraform state as props, emits events)
- Lifecycle: init, update, dispose

#### 13.3 State Sync
- WebSocket / polling for state changes
- Backend event types -> visualization actions
- File watcher integration

---

### 14. Putting It All Together

#### 14.1 Complete Minimal Scene Setup
- Full code: renderer -> camera -> ground -> ambient light -> one resource with frosted glass + internal light + bloom

#### 14.2 Step-by-Step Rendering Pipeline
- Init -> create scene -> add resources -> setup post-processing -> render loop

#### 14.3 Recommended Starting Values
- Quick-reference table of all tunable parameters with starting values

---

### Appendix A: Technology Stack

| Tool | Purpose |
|------|---------|
| Three.js | 3D rendering engine |
| WebGL 2.0 | Rendering backend |
| GSAP | Animation tweening |
| d3-force | Force-directed layout |
| React | Thin wrapper for integration |
| zustand | State management |
| Vite | Build tooling |
| Vitest + Playwright | Testing |

### Appendix B: Source Reference Table

Table mapping each technique to which lighting tutorial doc it was extracted from.

### Appendix C: Theme Interface

Complete TypeScript Theme interface definition with all configurable properties.
