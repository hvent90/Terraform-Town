# Visualization Bugs & Ideas

## Bugs

### 1. EC2 label hardcoded on every node

When generating a scene from terraform code with multiple resource types (VPC, subnet, security group, etc.), every node displays "EC2" as its label.

**Root cause:** `TraceLines.tsx:72` hardcodes the label text:
```ts
const { texture, aspect } = createTextTexture('EC2', TRACE_COLOR, 64);
```

`TraceLines` is registered as an idle effect for ALL resource types in `tron/index.ts`, but it has no way to know which resource type it belongs to. The `ResourceActor` renders effects without passing down the type.

**Fix direction:** Pass the resource type into `TraceLines` so it can render the correct label. Options:
- Add a `ResourceTypeContext` and read it in `TraceLines`
- Change the effect rendering in `ResourceActor` to pass the type as a prop

### 2. Trace lines cross through neighboring nodes in multi-resource scenes

Works fine in the default single-node scene. When generating a terraform scene with multiple resources, each node's axial trace lines extend 7.5 units outward (`TraceLines.tsx:115-129`) with 2.5 unit grid spacing (`App.tsx:59`). The axial lines are long enough to reach neighboring nodes, where they cross through that node's border square and pass directly underneath its cube.

**Root cause:** Each node's `TraceLines` draws its axial lines independently with no awareness of neighboring nodes. The lines are 7.5 units long on each axis but the grid spacing is only 2.5 units, so they easily overlap into adjacent node territory. Once there, they cross through the border trace lines and go under the neighboring cube.

**Status:** Deferred - will be resolved naturally when implementing node connections, since the trace/line geometry will be reworked as part of that effort.

---

## Ideas

### Connecting nodes together

Brainstorm: how should we visually connect nodes in the scene?

Things to consider:
- Terraform resources have dependency relationships (e.g., an EC2 instance references a subnet, a subnet belongs to a VPC)
- The `parseHcl` function already detects connections by parsing terraform references
- `TerraformState` has a `connections` array but it's not currently rendered
- Connections should fit the TRON visual theme (glowing lines, data flow particles)

Possible approaches:
- **Trace-style connection lines:** Extend the existing trace line aesthetic between connected nodes on the ground plane. Lines could pulse with data flow direction.
- **Elevated arcs:** Curved lines above the ground connecting cube centers, like circuit traces on a PCB
- **Data stream particles:** Reuse the `DataStreamParticles` effect to show particles flowing between connected nodes along a path
- **Ground-level circuit paths:** Right-angle connections on the ground plane (Manhattan routing), fitting the grid/TRON aesthetic
- **Hierarchical containment:** VPCs could visually contain subnets (larger boundary boxes) rather than connecting via lines
- **Connection types:** Different visual styles for different relationship types (belongs-to vs references vs depends-on)
