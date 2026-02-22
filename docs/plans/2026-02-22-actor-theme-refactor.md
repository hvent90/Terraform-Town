# Actor + Theme Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Break the 1532-line `src/glowing-cube.tsx` monolith into an actor-based, theme-driven architecture with ~40 focused files.

**Architecture:** Three layers: resources (data assets), theme (all visuals), actors (thin orchestrators). ThemeProvider context lets actors resolve meshes/effects/UI from the active theme. Effects are state-driven (idle/hover/selected). UI has component interfaces (types) and theme implementations (styling), composed by features (zero styling).

**Tech Stack:** React 19, React Three Fiber, Three.js r171, @react-three/postprocessing, Bun, TypeScript strict

**Design doc:** `docs/plans/2026-02-22-actor-theme-architecture-design.md`

**Verification strategy:** Since this is a visual R3F app with no automated tests, each checkpoint runs `bun run typecheck` and `bun run dev` to visually confirm the scene renders identically.

---

## Task List

- [ ] **Task 1:** Foundation — shared types, constants, context (`src/shared/`)
- [ ] **Task 2:** Theme system — types, ThemeProvider, GLSL declarations (`src/theme/`, `src/glsl.d.ts`)
- [ ] **Task 3:** Extract Tron shaders to `.glsl` files (`src/theme/tron/shaders/`)
- [ ] **Task 4:** Extract Tron colors + UI tokens (`src/theme/tron/colors.ts`)
- [ ] **Task 5:** Extract Tron meshes — CubeMesh, ReflectiveGround (`src/theme/tron/meshes/`)
- [ ] **Task 6:** Extract Tron effects — all 7 components (`src/theme/tron/effects/`)
- [ ] **Task 7:** Extract Tron scene — SceneLights, PostProcessing (`src/theme/tron/`)
- [ ] **Task 8:** UI component interfaces — prop type contracts (`src/ui/components/`)
- [ ] **Task 9:** Tron UI components — themed implementations (`src/theme/tron/ui/`)
- [ ] **Task 10:** UI features — zero-styling compositions (`src/ui/features/`)
- [ ] **Task 11:** Resource data asset + Tron theme manifest (`src/resources/`, `src/theme/tron/index.ts`)
- [ ] **Task 12:** Actors — ResourceActor, GroundActor (`src/actors/`)
- [ ] **Task 13:** App.tsx + main.tsx — wire everything, update index.html
- [ ] **Task 14:** Delete monolith, move assets, full verification

> See detailed steps, file lists, and code for each task below.

---

### Task 1: Foundation — Shared Types, Constants, Context

Create the shared layer that everything else imports from.

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/geometry.ts`
- Create: `src/shared/context.ts`

**Step 1: Create `src/shared/types.ts`**

```ts
export type ActorState = 'idle' | 'hover' | 'selected' | (string & {});

export type EffectKey = 'edgeIntensify' | 'faceOpacity' | 'breathingAmp' | 'haloBloom' | 'lift' | 'particleAttract' | 'faceSeparation' | 'tracePulse' | 'colorTemp';

export type SelectEffectKey = 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker' | 'edgePulse' | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';

export const EFFECT_LABELS: Record<EffectKey, string> = {
  edgeIntensify: 'Edge Intensify',
  faceOpacity: 'Face Opacity',
  breathingAmp: 'Breathing Amp',
  haloBloom: 'Halo Bloom',
  lift: 'Lift',
  particleAttract: 'Particle Attract',
  faceSeparation: 'Face Separation',
  tracePulse: 'Trace Pulse',
  colorTemp: 'Color Temp Shift',
};

export const SELECT_EFFECT_LABELS: Record<SelectEffectKey, string> = {
  orbitRing: 'Orbit Ring',
  dataStream: 'Data Stream',
  groundBeam: 'Ground Beam',
  holoFlicker: 'Holo Flicker',
  edgePulse: 'Edge Pulse',
  faceDataOverlay: 'Face Data Overlay',
  statusGlow: 'Status Glow',
  traceActivation: 'Trace Activation',
};

export const ALL_EFFECTS: EffectKey[] = Object.keys(EFFECT_LABELS) as EffectKey[];
export const ALL_SELECT_EFFECTS: SelectEffectKey[] = Object.keys(SELECT_EFFECT_LABELS) as SelectEffectKey[];

export const DEFAULT_TOGGLES: Record<EffectKey, boolean> = Object.fromEntries(
  ALL_EFFECTS.map(k => [k, false])
) as Record<EffectKey, boolean>;

export const DEFAULT_SELECT_TOGGLES: Record<SelectEffectKey, boolean> = Object.fromEntries(
  ALL_SELECT_EFFECTS.map(k => [k, false])
) as Record<SelectEffectKey, boolean>;
```

**Step 2: Create `src/shared/geometry.ts`**

```ts
import * as THREE from 'three';

export const CUBE_SIZE = 0.6;
export const CUBE_Y = CUBE_SIZE / 2;

export const faceConfigs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
  { rot: [0, 0, 0],             pos: [0, 0, CUBE_SIZE / 2] },
  { rot: [0, Math.PI, 0],       pos: [0, 0, -CUBE_SIZE / 2] },
  { rot: [0, Math.PI / 2, 0],   pos: [CUBE_SIZE / 2, 0, 0] },
  { rot: [0, -Math.PI / 2, 0],  pos: [-CUBE_SIZE / 2, 0, 0] },
  { rot: [-Math.PI / 2, 0, 0],  pos: [0, CUBE_SIZE / 2, 0] },
  { rot: [Math.PI / 2, 0, 0],   pos: [0, -CUBE_SIZE / 2, 0] },
];

export function createHaloTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 190, 100, 0.06)');
  g.addColorStop(0.15, 'rgba(255, 150, 60, 0.03)');
  g.addColorStop(0.35, 'rgba(255, 120, 30, 0.005)');
  g.addColorStop(0.6, 'rgba(255, 80, 10, 0.0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
```

**Step 3: Create `src/shared/context.ts`**

```ts
import { createContext, useContext } from 'react';
import type { EffectKey, SelectEffectKey } from './types';

export type SceneContextType = {
  togglesRef: React.MutableRefObject<Record<EffectKey, boolean>>;
  hoverTRef: React.MutableRefObject<number>;
  selectTogglesRef: React.MutableRefObject<Record<SelectEffectKey, boolean>>;
  selectedTRef: React.MutableRefObject<number>;
  onSelect: () => void;
  onDeselect: () => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
};

export const SceneContext = createContext<SceneContextType>(null!);

export function useSceneContext() {
  return useContext(SceneContext);
}
```

**Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS (no files import these yet, so no errors)

**Step 5: Commit**

```bash
git add src/shared/
git commit -m "refactor: extract shared types, geometry, and context"
```

---

### Task 2: Theme System — Types, Provider, GLSL Setup

Create the theme type definition and provider, plus TypeScript support for `.glsl` imports.

**Files:**
- Create: `src/theme/types.ts`
- Create: `src/theme/ThemeProvider.tsx`
- Create: `src/glsl.d.ts`

**Step 1: Create `src/theme/types.ts`**

Import types for all UI component props (we'll create these in Task 8, for now use `any`):

```ts
import type { ActorState } from '../shared/types';

export type Theme = {
  resources: Record<string, {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  }>;
  ground: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  Lights: React.ComponentType;
  PostProcessing: React.ComponentType;
  ui: {
    components: {
      ToggleSwitch: React.ComponentType<any>;
      Panel: React.ComponentType<any>;
      Badge: React.ComponentType<any>;
      KeyHint: React.ComponentType<any>;
      Tooltip: React.ComponentType<any>;
      SlidePanel: React.ComponentType<any>;
      DataTable: React.ComponentType<any>;
      SectionHeader: React.ComponentType<any>;
    };
  };
};
```

**Step 2: Create `src/theme/ThemeProvider.tsx`**

```tsx
import { createContext, useContext } from 'react';
import type { Theme } from './types';

const ThemeContext = createContext<Theme>(null!);

export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemedComponents() {
  return useTheme().ui.components;
}
```

**Step 3: Create `src/glsl.d.ts`**

```ts
declare module '*.glsl' {
  const value: string;
  export default value;
}
```

**Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/ src/glsl.d.ts
git commit -m "refactor: add theme system types, provider, and GLSL declarations"
```

---

### Task 3: Extract Tron Shaders to .glsl Files

Extract all 18 shader strings from the monolith into `.glsl` files.

**Files:**
- Create: `src/theme/tron/shaders/face.vert.glsl`
- Create: `src/theme/tron/shaders/face.frag.glsl`
- Create: `src/theme/tron/shaders/edge.vert.glsl`
- Create: `src/theme/tron/shaders/edge.frag.glsl`
- Create: `src/theme/tron/shaders/trace.vert.glsl`
- Create: `src/theme/tron/shaders/trace.frag.glsl`
- Create: `src/theme/tron/shaders/water.vert.glsl`
- Create: `src/theme/tron/shaders/water.frag.glsl`
- Create: `src/theme/tron/shaders/orbit-ring.vert.glsl`
- Create: `src/theme/tron/shaders/orbit-ring.frag.glsl`
- Create: `src/theme/tron/shaders/data-stream.vert.glsl`
- Create: `src/theme/tron/shaders/data-stream.frag.glsl`
- Create: `src/theme/tron/shaders/ground-beam.vert.glsl`
- Create: `src/theme/tron/shaders/ground-beam.frag.glsl`
- Create: `src/theme/tron/shaders/ground-particles.vert.glsl`
- Create: `src/theme/tron/shaders/ground-particles.frag.glsl`
- Create: `src/theme/tron/shaders/ground-light-pool.vert.glsl`
- Create: `src/theme/tron/shaders/ground-light-pool.frag.glsl`

**Step 1: Extract each shader**

Copy the shader strings from `src/glowing-cube.tsx` into individual `.glsl` files. Each vertex/fragment shader gets its own file. Reference the source file line numbers:

- Face vertex: lines 195-207
- Face fragment: lines 209-258
- Edge vertex: lines 278-285
- Edge fragment: lines 288-303
- Trace vertex: lines 428-433
- Trace fragment: lines 436-459
- Water vertex: lines 553-560
- Water fragment: lines 562-629
- Orbit ring vertex: lines 1053-1057
- Orbit ring fragment: lines 1060-1068
- Data stream vertex: lines 1117-1129
- Data stream fragment: lines 1132-1137
- Ground beam vertex: lines 1172-1176
- Ground beam fragment: lines 1179-1190
- Ground particles vertex: lines 724-740
- Ground particles fragment: lines 743-749
- Ground light pool vertex: lines 797-798
- Ground light pool fragment: lines 801-815

Strip the backtick template literal wrappers and leading/trailing whitespace. Keep only the raw GLSL.

**Step 2: Commit**

```bash
git add src/theme/tron/shaders/
git commit -m "refactor: extract all shaders to .glsl files"
```

---

### Task 4: Extract Tron Colors

**Files:**
- Create: `src/theme/tron/colors.ts`

**Step 1: Create `src/theme/tron/colors.ts`**

```ts
import * as THREE from 'three';

export const TRACE_COLOR = '#ff8800';

// Warm palette
export const AMBER = new THREE.Color(0xff8822);
export const AMBER_WARM = new THREE.Color(0xffaa44);
export const WHITE_HOT = new THREE.Color(0xffeedd);
export const FACE_INNER_WARM = new THREE.Color(0xffbb55);
export const TRACE_WARM = new THREE.Color(TRACE_COLOR);
export const HALO_WARM = new THREE.Color(0xffaa55);
export const LIGHT_POOL_BRIGHT = new THREE.Color(0xffcc88);

// Cool palette (color temp shift targets)
export const COOL_BLUE = new THREE.Color(0x4488ff);
export const COOL_BLUE_BRIGHT = new THREE.Color(0x88bbff);
export const COOL_WHITE = new THREE.Color(0xddeeff);
export const FACE_INNER_COOL = new THREE.Color(0x88bbff);
export const TRACE_COOL = new THREE.Color(0x4488ff);

// Status
export const STATUS_GREEN = new THREE.Color(0x44ff88);
export const STATUS_GREEN_BRIGHT = new THREE.Color(0x88ffbb);

// UI tokens
export const ui = {
  surface: 'rgba(10, 8, 5, 0.85)',
  surfaceDense: 'rgba(8, 6, 4, 0.92)',
  border: 'rgba(255, 150, 50, 0.25)',
  borderSubtle: 'rgba(255, 150, 50, 0.15)',
  borderFaint: 'rgba(255, 150, 50, 0.1)',
  text: 'rgba(255, 200, 140, 0.7)',
  textBright: 'rgba(255, 200, 140, 0.9)',
  textDim: 'rgba(255, 200, 140, 0.45)',
  textFaint: 'rgba(255, 200, 140, 0.4)',
  textMuted: 'rgba(255, 200, 140, 0.35)',
  textGhost: 'rgba(255, 200, 140, 0.25)',
  heading: 'rgba(255, 180, 100, 0.95)',
  accent: '#ff8800',
  accentBg: 'rgba(255, 136, 0, 0.4)',
  accentBorder: 'rgba(255, 136, 0, 0.6)',
  accentGlow: 'rgba(255, 136, 0, 0.5)',
  statusOk: '#44ff88',
  statusOkGlow: 'rgba(68, 255, 136, 0.4)',
  inactiveBg: 'rgba(255, 255, 255, 0.08)',
  inactiveBorder: 'rgba(255, 255, 255, 0.15)',
  inactiveKnob: 'rgba(255, 255, 255, 0.25)',
  font: 'monospace',
  blur: '10px',
  blurHeavy: '16px',
  radiusSm: 6,
  radiusMd: 8,
};
```

**Step 2: Commit**

```bash
git add src/theme/tron/colors.ts
git commit -m "refactor: extract Tron color constants and UI tokens"
```

---

### Task 5: Extract Tron Meshes

Move CubeMesh (CubeFace + GlowingCube) and ReflectiveGround into theme.

**Files:**
- Create: `src/theme/tron/meshes/CubeMesh.tsx`
- Create: `src/theme/tron/meshes/ReflectiveGround.tsx`

**Step 1: Create `src/theme/tron/meshes/CubeMesh.tsx`**

This contains CubeFace (inner component) and GlowingCube (exported as CubeMesh). Import shaders from `../shaders/`, colors from `../colors`, geometry from `../../../shared/geometry`, context from `../../../shared/context`.

Copy lines 114-408 from `src/glowing-cube.tsx`. Replace:
- Inline shader strings → `import faceVert from '../shaders/face.vert.glsl'` etc.
- Color constants → `import { ... } from '../colors'`
- `CUBE_SIZE`, `CUBE_Y`, `faceConfigs`, `createHaloTexture` → `import { ... } from '../../../shared/geometry'`
- `CubeContext` → `import { useSceneContext } from '../../../shared/context'`

Export: `export function CubeMesh() { ... }` (renamed from GlowingCube)

**Step 2: Create `src/theme/tron/meshes/ReflectiveGround.tsx`**

Copy `waterShader` (lines 544-630) and `ReflectiveGround` function (lines 633-688) from `src/glowing-cube.tsx`. Replace:
- Inline shader strings → imports from `../shaders/water.vert.glsl` and `../shaders/water.frag.glsl`

Export: `export function ReflectiveGround() { ... }`

**Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS (nothing imports these yet)

**Step 4: Commit**

```bash
git add src/theme/tron/meshes/
git commit -m "refactor: extract Tron CubeMesh and ReflectiveGround"
```

---

### Task 6: Extract Tron Effects

Move all 7 effect components into `theme/tron/effects/`.

**Files:**
- Create: `src/theme/tron/effects/HoverDetector.tsx`
- Create: `src/theme/tron/effects/TraceLines.tsx`
- Create: `src/theme/tron/effects/OrbitRing.tsx`
- Create: `src/theme/tron/effects/DataStreamParticles.tsx`
- Create: `src/theme/tron/effects/GroundConnectionBeam.tsx`
- Create: `src/theme/tron/effects/GroundParticles.tsx`
- Create: `src/theme/tron/effects/GroundLightPool.tsx`

**Step 1: Extract each effect**

For each component, copy from `src/glowing-cube.tsx` and update imports:
- `HoverDetector` (lines 124-163) → uses `useSceneContext()` instead of `useContext(CubeContext)`, geometry from shared
- `TraceLines` (lines 411-541) → shader imports, color imports, geometry imports, context import, font import from `../../../assets/fonts/GeistPixel-Grid.ttf`
- `OrbitRing` (lines 1039-1089) → shader imports, context import, geometry imports
- `DataStreamParticles` (lines 1092-1156) → shader imports, context import, geometry imports
- `GroundConnectionBeam` (lines 1159-1208) → shader imports, context import, geometry imports
- `GroundParticles` (lines 691-780) → shader imports, color imports, context import
- `GroundLightPool` (lines 783-831) → shader imports, color imports, context import

Each file exports a single named component.

**Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/theme/tron/effects/
git commit -m "refactor: extract all Tron effects"
```

---

### Task 7: Extract Tron Scene — Lights + PostProcessing

**Files:**
- Create: `src/theme/tron/SceneLights.tsx`
- Create: `src/theme/tron/PostProcessing.tsx`

**Step 1: Create `src/theme/tron/SceneLights.tsx`**

Copy lines 834-853 from `src/glowing-cube.tsx`. Import colors from `./colors`, context from `../../shared/context`. Include the `ambientLight` that's currently inline in App (line 1446).

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneContext } from '../../shared/context';
import { AMBER, COOL_BLUE } from './colors';

export function SceneLights() {
  const { togglesRef, hoverTRef } = useSceneContext();
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const colorT = togglesRef.current.colorTemp ? hoverTRef.current : 0;
    tmpColor.copy(AMBER).lerp(COOL_BLUE, colorT);
    light1.current?.color.copy(tmpColor);
    light2.current?.color.copy(tmpColor);
  });

  return (
    <>
      <ambientLight color={0x0a0a18} intensity={0.15} />
      <pointLight ref={light1} color={AMBER} intensity={0.5} distance={3} decay={2} position={[0, 0.45, 0]} />
      <pointLight ref={light2} color={AMBER} intensity={0.2} distance={2} decay={2} position={[0, 0.05, 0]} />
    </>
  );
}
```

**Step 2: Create `src/theme/tron/PostProcessing.tsx`**

```tsx
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
      <Noise opacity={0.03} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
```

**Step 3: Commit**

```bash
git add src/theme/tron/SceneLights.tsx src/theme/tron/PostProcessing.tsx
git commit -m "refactor: extract Tron scene lights and post-processing"
```

---

### Task 8: UI Component Interfaces

Define the prop type contracts that all theme UI implementations must follow.

**Files:**
- Create: `src/ui/components/ToggleSwitch.types.ts`
- Create: `src/ui/components/Panel.types.ts`
- Create: `src/ui/components/Badge.types.ts`
- Create: `src/ui/components/KeyHint.types.ts`
- Create: `src/ui/components/Tooltip.types.ts`
- Create: `src/ui/components/SlidePanel.types.ts`
- Create: `src/ui/components/DataTable.types.ts`
- Create: `src/ui/components/SectionHeader.types.ts`
- Create: `src/ui/components/index.ts`

**Step 1: Create each type file**

```ts
// ToggleSwitch.types.ts
export type ToggleSwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

// Panel.types.ts
export type PanelProps = {
  title: string;
  collapsible?: boolean;
  children: React.ReactNode;
};

// Badge.types.ts
export type BadgeVariant = 'status' | 'info';
export type BadgeProps = {
  label: string;
  color?: string;
  variant?: BadgeVariant;
};

// KeyHint.types.ts
export type KeyHintProps = {
  keyName: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

// Tooltip.types.ts
export type TooltipProps = {
  children: React.ReactNode;
};

// SlidePanel.types.ts
export type SlidePanelSide = 'left' | 'right';
export type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  side?: SlidePanelSide;
  width?: number;
  children: React.ReactNode;
};

// DataTable.types.ts
export type DataTableRow = { key: string; value: string | string[] };
export type DataTableProps = {
  rows: DataTableRow[];
};

// SectionHeader.types.ts
export type SectionHeaderProps = {
  title: string;
};
```

**Step 2: Create barrel export `src/ui/components/index.ts`**

```ts
export type { ToggleSwitchProps } from './ToggleSwitch.types';
export type { PanelProps } from './Panel.types';
export type { BadgeProps, BadgeVariant } from './Badge.types';
export type { KeyHintProps } from './KeyHint.types';
export type { TooltipProps } from './Tooltip.types';
export type { SlidePanelProps, SlidePanelSide } from './SlidePanel.types';
export type { DataTableProps, DataTableRow } from './DataTable.types';
export type { SectionHeaderProps } from './SectionHeader.types';
```

**Step 3: Update `src/theme/types.ts` to use real prop types**

Replace the `any` types with the actual imports:

```ts
import type { ActorState } from '../shared/types';
import type {
  ToggleSwitchProps,
  PanelProps,
  BadgeProps,
  KeyHintProps,
  TooltipProps,
  SlidePanelProps,
  DataTableProps,
  SectionHeaderProps,
} from '../ui/components';

export type Theme = {
  resources: Record<string, {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  }>;
  ground: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  Lights: React.ComponentType;
  PostProcessing: React.ComponentType;
  ui: {
    components: {
      ToggleSwitch: React.ComponentType<ToggleSwitchProps>;
      Panel: React.ComponentType<PanelProps>;
      Badge: React.ComponentType<BadgeProps>;
      KeyHint: React.ComponentType<KeyHintProps>;
      Tooltip: React.ComponentType<TooltipProps>;
      SlidePanel: React.ComponentType<SlidePanelProps>;
      DataTable: React.ComponentType<DataTableProps>;
      SectionHeader: React.ComponentType<SectionHeaderProps>;
    };
  };
};
```

**Step 4: Typecheck + commit**

Run: `bun run typecheck`

```bash
git add src/ui/components/ src/theme/types.ts
git commit -m "refactor: add UI component type interfaces"
```

---

### Task 9: Tron UI Components

Create the Tron theme's visual implementation of each UI component. Import colors directly from `../colors` (theme-internal).

**Files:**
- Create: `src/theme/tron/ui/ToggleSwitch.tsx`
- Create: `src/theme/tron/ui/Panel.tsx`
- Create: `src/theme/tron/ui/Badge.tsx`
- Create: `src/theme/tron/ui/KeyHint.tsx`
- Create: `src/theme/tron/ui/Tooltip.tsx`
- Create: `src/theme/tron/ui/SlidePanel.tsx`
- Create: `src/theme/tron/ui/DataTable.tsx`
- Create: `src/theme/tron/ui/SectionHeader.tsx`

**Step 1: Create each component**

Extract the visual styling from the monolith's ControlPanel, SelectedControlPanel, ServiceInfoCard, and CameraButton. Each component:
- Imports its prop type from `../../../ui/components`
- Imports `ui` tokens from `../colors`
- Owns ALL its styling
- Is a named export

Key extraction mapping:
- `ToggleSwitch` ← toggle switch markup from ControlPanel (lines 1272-1291)
- `Panel` ← collapsible container from ControlPanel (lines 1230-1297)
- `Badge` ← status dot+label from ServiceInfoCard (lines 963-968)
- `KeyHint` ← [C] Camera button from App (lines 1509-1527)
- `Tooltip` ← forwarded ref wrapper, styling from tooltip div (lines 1465-1498)
- `SlidePanel` ← slide container from ServiceInfoCard (lines 894-908)
- `DataTable` ← key-value table from ServiceInfoCard (lines 983-990)
- `SectionHeader` ← uppercase label from ServiceInfoCard (lines 977-981)

**Step 2: Typecheck + commit**

Run: `bun run typecheck`

```bash
git add src/theme/tron/ui/
git commit -m "refactor: add Tron UI component implementations"
```

---

### Task 10: UI Features

Create feature compositions that use `useThemedComponents()` and contain zero styling.

**Files:**
- Create: `src/ui/features/EffectsPanel.tsx`
- Create: `src/ui/features/ResourceInspector.tsx`
- Create: `src/ui/features/ResourceTooltip.tsx`
- Create: `src/ui/features/CameraToggle.tsx`

**Step 1: Create `src/ui/features/EffectsPanel.tsx`**

```tsx
import { useThemedComponents } from '../../theme/ThemeProvider';

type EffectsPanelProps = {
  title: string;
  effects: string[];
  labels: Record<string, string>;
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export function EffectsPanel({ title, effects, labels, toggles, onToggle }: EffectsPanelProps) {
  const { Panel, ToggleSwitch } = useThemedComponents();
  return (
    <Panel title={title} collapsible>
      {effects.map(key => (
        <ToggleSwitch
          key={key}
          label={labels[key]}
          value={toggles[key]}
          onChange={() => onToggle(key)}
        />
      ))}
    </Panel>
  );
}
```

**Step 2: Create `src/ui/features/ResourceInspector.tsx`**

Composes SlidePanel + Badge + SectionHeader + DataTable. Takes resource data as props. Zero styling.

**Step 3: Create `src/ui/features/ResourceTooltip.tsx`**

Composes Tooltip + Badge. Takes resource summary as props. Positioned by ref from HoverDetector.

**Step 4: Create `src/ui/features/CameraToggle.tsx`**

Composes KeyHint. Takes `isOrtho` and `onToggle` as props.

**Step 5: Typecheck + commit**

Run: `bun run typecheck`

```bash
git add src/ui/features/
git commit -m "refactor: add UI feature compositions"
```

---

### Task 11: Resource Data Asset + Tron Theme Manifest

**Files:**
- Create: `src/resources/ec2.ts`
- Create: `src/theme/tron/index.ts`

**Step 1: Create `src/resources/ec2.ts`**

```ts
export const ec2Resource = {
  type: 'ec2',
  label: 'EC2',
  data: {
    resource: 'aws_instance.main',
    instance_id: 'i-0a3b8f29d4e6c1072',
    instance_type: 't3.medium',
    ami: 'ami-0c55b159cbfafe1f0',
    availability_zone: 'us-east-1a',
    state: 'running',
    public_ip: '54.210.167.89',
    private_ip: '10.0.1.42',
    vpc_id: 'vpc-0a1b2c3d4e5f6g7h8',
    security_groups: ['sg-web-prod'],
    key_name: 'prod-ssh-key',
    tags: {
      Name: 'web-server-prod',
      Environment: 'production',
      Team: 'platform',
    },
  },
  infoCard: {
    sections: [
      { title: 'Instance', fields: ['instance_id', 'instance_type', 'ami', 'key_name'] },
      { title: 'Network', fields: ['public_ip', 'private_ip', 'vpc_id', 'security_groups'] },
      { title: 'Tags', fields: ['tags'] },
    ],
  },
};
```

**Step 2: Create `src/theme/tron/index.ts`**

Wire up all Tron components into the theme manifest:

```ts
import type { Theme } from '../types';
import { CubeMesh } from './meshes/CubeMesh';
import { ReflectiveGround } from './meshes/ReflectiveGround';
import { HoverDetector } from './effects/HoverDetector';
import { TraceLines } from './effects/TraceLines';
import { OrbitRing } from './effects/OrbitRing';
import { DataStreamParticles } from './effects/DataStreamParticles';
import { GroundConnectionBeam } from './effects/GroundConnectionBeam';
import { GroundParticles } from './effects/GroundParticles';
import { GroundLightPool } from './effects/GroundLightPool';
import { SceneLights } from './SceneLights';
import { PostProcessing } from './PostProcessing';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { Panel } from './ui/Panel';
import { Badge } from './ui/Badge';
import { KeyHint } from './ui/KeyHint';
import { Tooltip } from './ui/Tooltip';
import { SlidePanel } from './ui/SlidePanel';
import { DataTable } from './ui/DataTable';
import { SectionHeader } from './ui/SectionHeader';

export const tronTheme: Theme = {
  resources: {
    ec2: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
  },
  ground: {
    Mesh: ReflectiveGround,
    effects: {
      idle: [GroundParticles, GroundLightPool],
    },
  },
  Lights: SceneLights,
  PostProcessing: PostProcessing,
  ui: {
    components: {
      ToggleSwitch,
      Panel,
      Badge,
      KeyHint,
      Tooltip,
      SlidePanel,
      DataTable,
      SectionHeader,
    },
  },
};
```

**Step 3: Typecheck + commit**

Run: `bun run typecheck`

```bash
git add src/resources/ src/theme/tron/index.ts
git commit -m "refactor: add EC2 resource data asset and Tron theme manifest"
```

---

### Task 12: Actors

Create the thin actor orchestrators.

**Files:**
- Create: `src/actors/ResourceActor.tsx`
- Create: `src/actors/GroundActor.tsx`

**Step 1: Create `src/actors/ResourceActor.tsx`**

```tsx
import { useTheme } from '../theme/ThemeProvider';

export function ResourceActor({ type }: { type: string }) {
  const theme = useTheme();
  const config = theme.resources[type];
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

**Step 2: Create `src/actors/GroundActor.tsx`**

```tsx
import { useTheme } from '../theme/ThemeProvider';

export function GroundActor() {
  const theme = useTheme();
  const { Mesh, effects } = theme.ground;

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

**Step 3: Typecheck + commit**

Run: `bun run typecheck`

```bash
git add src/actors/
git commit -m "refactor: add ResourceActor and GroundActor"
```

---

### Task 13: App.tsx + main.tsx — Wire Everything Together

Create the new entry points that compose the full scene.

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Modify: `src/index.html` (script src → `./main.tsx`)

**Step 1: Create `src/App.tsx`**

Port lines 1379-1529 from the monolith. Replace:
- All inline components → imported actors, features, themed components
- `CubeContext` → `SceneContext` from shared/context
- `CubeContextType` → `SceneContextType`
- Inline `<Ground>`, `<GlowingCube>`, etc. → `<ResourceActor type="ec2" />`, `<GroundActor />`
- Inline `<SceneLights>`, `<EffectComposer>` → `theme.Lights`, `theme.PostProcessing` resolved via `useTheme()`
- Inline ControlPanel/SelectedControlPanel → `<EffectsPanel>` feature
- Inline ServiceInfoCard → `<ResourceInspector>` feature
- Inline tooltip div → `<ResourceTooltip>` feature
- Inline camera button → `<CameraToggle>` feature
- Wrap everything in `<ThemeProvider theme={tronTheme}>`

**Step 2: Create `src/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

**Step 3: Update `src/index.html`**

Change script src from `./glowing-cube.tsx` to `./main.tsx`.

**Step 4: Typecheck + run dev**

Run: `bun run typecheck`
Expected: PASS

Run: `bun run dev`
Expected: Scene renders identically to before — cube, ground, effects, UI panels all work.

**Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/index.html
git commit -m "refactor: wire up new App entry point with actor/theme architecture"
```

---

### Task 14: Delete Monolith + Move Assets + Final Verify

**Files:**
- Delete: `src/glowing-cube.tsx`
- Move: `src/fonts/` → `src/assets/fonts/`

**Step 1: Move font asset**

```bash
git mv src/fonts src/assets/fonts
```

Update the font import path in `src/theme/tron/effects/TraceLines.tsx` from `./fonts/GeistPixel-Grid.ttf` to `../../../assets/fonts/GeistPixel-Grid.ttf`.

**Step 2: Delete the monolith**

```bash
git rm src/glowing-cube.tsx
```

**Step 3: Full verification**

Run: `bun run typecheck`
Expected: PASS, zero errors

Run: `bun run dev`
Expected: Scene renders identically:
- Cube with frosted glass faces, glowing edges, halo
- Reflective ground with water ripple, particles, light pool
- Trace lines with EC2 label
- Hover effects toggle panel works
- Selected effects toggle panel works
- Click cube → info card slides in, selected effects activate
- [C] toggles camera, Escape deselects
- All effects (orbit ring, data stream, ground beam, etc.) work when toggled

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete monolith, complete actor/theme architecture migration"
```

---

### Final File Count

```
src/
├── index.ts                    (existing, unchanged)
├── index.html                  (modified: script src)
├── main.tsx                    (new)
├── App.tsx                     (new)
├── glsl.d.ts                   (new)
├── shared/
│   ├── types.ts                (new)
│   ├── geometry.ts             (new)
│   └── context.ts              (new)
├── theme/
│   ├── types.ts                (new)
│   ├── ThemeProvider.tsx        (new)
│   └── tron/
│       ├── index.ts            (new)
│       ├── colors.ts           (new)
│       ├── SceneLights.tsx     (new)
│       ├── PostProcessing.tsx  (new)
│       ├── meshes/
│       │   ├── CubeMesh.tsx    (new)
│       │   └── ReflectiveGround.tsx (new)
│       ├── effects/
│       │   ├── HoverDetector.tsx    (new)
│       │   ├── TraceLines.tsx       (new)
│       │   ├── OrbitRing.tsx        (new)
│       │   ├── DataStreamParticles.tsx (new)
│       │   ├── GroundConnectionBeam.tsx (new)
│       │   ├── GroundParticles.tsx   (new)
│       │   └── GroundLightPool.tsx   (new)
│       ├── shaders/                  (18 .glsl files)
│       └── ui/
│           ├── ToggleSwitch.tsx (new)
│           ├── Panel.tsx       (new)
│           ├── Badge.tsx       (new)
│           ├── KeyHint.tsx     (new)
│           ├── Tooltip.tsx     (new)
│           ├── SlidePanel.tsx  (new)
│           ├── DataTable.tsx   (new)
│           └── SectionHeader.tsx (new)
├── resources/
│   └── ec2.ts                  (new)
├── actors/
│   ├── ResourceActor.tsx       (new)
│   └── GroundActor.tsx         (new)
├── ui/
│   ├── components/
│   │   ├── index.ts            (new)
│   │   └── *.types.ts          (8 files, new)
│   └── features/
│       ├── EffectsPanel.tsx    (new)
│       ├── ResourceInspector.tsx (new)
│       ├── ResourceTooltip.tsx  (new)
│       └── CameraToggle.tsx    (new)
└── assets/
    └── fonts/
        └── GeistPixel-Grid.ttf (moved)

Total: ~45 files (from 1 monolith)
```
