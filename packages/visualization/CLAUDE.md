# @terraform-town/visualization

3D visualization of Terraform infrastructure using React Three Fiber.

## Structure

- `src/main.tsx` — React entry point
- `src/App.tsx` — Root component with R3F Canvas
- `src/Visualization.ts` — Core visualization logic
- `src/types.ts` — Resource, Connection, Theme, Animation types
- `src/camera/` — Camera modes: Orbit, Map, Focus controllers
- `src/layout/` — Layout algorithms: grid, graph, hierarchy, typeCluster
- `src/resources/` — Per-resource 3D components (e.g. ec2)
- `src/routing/` — Manhattan routing algorithm for connections
- `src/ui/` — 2D overlay components and features
- `src/theme/` — Theme definitions
- `src/state/`, `src/actors/`, `src/shared/` — State management, actor machines, shared utilities

## Commands

```bash
bun run dev       # Dev server
bun run build     # Production build
bun run serve     # Serve built output
bun run typecheck # tsc --noEmit
```

## Key patterns

- Layout tests are colocated: `layout/*.test.ts`
- Camera system has 3 modes: orbit (free), map (top-down), focus (animate to target)
- Resources have states: planned, applied, modified, destroyed, error
- Theme system controls colors, lighting, bloom, and per-resource materials

## Gotchas

- R3F components must be children of `<Canvas>` — hooks like `useThree` fail outside that context
- Layout algorithms return positions but don't animate — animation is handled by the camera/transition system

## Docs

- `docs/lighting/README.md` — Index of 28 lighting/shader reference articles
- `docs/lighting/scene-implementation-handbook.md` — Complete guide to scene setup
- `docs/lighting/lighting-implementation-guide.md` — Practical lighting patterns for this project
- `docs/lighting/lighting-implementation-guide-2.md` — Extended lighting patterns
