# Layout Modes Design

## Problem

The current visualization uses a flat square grid for all resource nodes. There is no spatial grouping — VPCs, subnets, instances, and other resources are interleaved sequentially with no visual hierarchy or relationship awareness.

## Solution

Four selectable layout modes exposed via a new Layout panel in the top-right corner.

## Layout Algorithms

Each layout is a pure function: `(resources, connections) → Map<id, [x, y, z]>`

### 1. Flat Grid (existing)

Sequential square grid. Columns = `ceil(sqrt(total))`, spacing = 2.5 units, centered at origin. No grouping.

### 2. Type Clusters

- Group resources by `resource.type`
- Each group arranged in its own sub-grid (same square-grid logic)
- Groups themselves placed in a larger grid with extra spacing between groups
- Groups sorted alphabetically by type name

### 3. Hierarchy (Parent Containment)

- Build tree from `parentId` relationships
- Top-level resources (no parent) placed in a row
- Children placed in sub-grids near their parent, offset in Z
- Requires `parseHcl` to detect `parentId` from attributes like `vpc_id`, `subnet_id`

### 4. Graph (Connection Proximity)

- Force-directed layout: connected nodes attract, all nodes repel
- 50 iterations computed at layout time (no runtime physics)
- Seeded from flat grid initial positions
- Stabilizes into clusters of connected resources

## parseHcl Changes

Add `parentId` detection:

- Scan attributes for references to known container types (`vpc`, `subnet`)
- Priority: most specific container wins (`subnet_id` > `vpc_id`)
- Set `parentId` on the resource to the referenced resource's address

## Layout Panel UI

- New `LayoutPanel` in `src/ui/features/LayoutPanel.tsx`
- Position: fixed top-right corner (`top: 16, right: 16`)
- Radio-style selection between four modes
- Collapsible, defaults expanded
- Uses existing themed `Panel` component

## File Structure

```
src/layout/
  gridLayout.ts        — extract existing gridPosition
  typeClusterLayout.ts — group-by-type layout
  hierarchyLayout.ts   — parent containment layout
  graphLayout.ts       — force-directed layout
  index.ts             — LayoutMode type + dispatcher
src/ui/features/
  LayoutPanel.tsx      — new panel component
```

## Wiring

- `App.tsx` adds `layoutMode` state: `'grid' | 'type' | 'hierarchy' | 'graph'`
- `positions` useMemo switches on layout mode, calling the appropriate layout function
- Manhattan connection routing unchanged — reads from the positions map
- No animation on layout switch initially (snap); animation deferred to follow-up

## Transitions

Snap (instant position update) for now. Smooth lerp animation is a planned follow-up.
