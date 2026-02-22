# Actor + Theme Architecture Design

Date: 2026-02-22

## Problem

`src/glowing-cube.tsx` is a 1532-line monolith containing all types, constants, shaders, 3D components, DOM UI, and app composition. It needs to be broken apart into a modern, extensible folder structure.

## Key Insight

This isn't just a "cube app" - it's a Terraform resource visualizer. An EC2 instance happens to render as a cube in the current "Tron" theme, but:

- Different resource types (EC2, RDS, S3) should have different shapes
- A different theme ("Warcraft") would render the same resources with completely different meshes, effects, shaders, and UI
- Effects are state-driven (idle, hover, selected, and extensible future states)

## Architecture

Three layers:

1. **Resources** - data assets defining *what* things are (label, data fields)
2. **Theme** - *how* things look (meshes, effects, shaders, colors, UI components)
3. **Actors** - thin orchestrators that compose theme pieces with state management

### Folder Structure

```
src/
├── index.ts                              # Bun.serve()
├── index.html
├── main.tsx                              # createRoot
├── App.tsx                               # Canvas + ThemeProvider + SceneContext
│
├── actors/
│   ├── ResourceActor.tsx                 # useTheme() → resolves mesh + state-driven effects
│   └── GroundActor.tsx                   # useTheme() → resolves ground mesh + effects
│
├── theme/
│   ├── ThemeProvider.tsx                 # ThemeContext + useTheme() + useThemedComponents()
│   ├── types.ts                          # Theme type definition
│   └── tron/                             # Current theme
│       ├── index.ts                      # Theme manifest
│       ├── colors.ts                     # Color constants
│       ├── meshes/
│       │   ├── CubeMesh.tsx              # EC2's shape in Tron
│       │   └── ReflectiveGround.tsx
│       ├── effects/
│       │   ├── HoverDetector.tsx
│       │   ├── OrbitRing.tsx
│       │   ├── DataStreamParticles.tsx
│       │   ├── GroundConnectionBeam.tsx
│       │   ├── TraceLines.tsx
│       │   ├── GroundParticles.tsx
│       │   └── GroundLightPool.tsx
│       ├── shaders/
│       │   ├── face.vert.glsl
│       │   ├── face.frag.glsl
│       │   ├── edge.vert.glsl
│       │   ├── edge.frag.glsl
│       │   ├── water.vert.glsl
│       │   ├── water.frag.glsl
│       │   ├── trace.vert.glsl
│       │   ├── trace.frag.glsl
│       │   ├── orbit-ring.vert.glsl
│       │   ├── orbit-ring.frag.glsl
│       │   ├── data-stream.vert.glsl
│       │   ├── data-stream.frag.glsl
│       │   ├── ground-beam.vert.glsl
│       │   ├── ground-beam.frag.glsl
│       │   ├── ground-particles.vert.glsl
│       │   ├── ground-particles.frag.glsl
│       │   ├── ground-light-pool.vert.glsl
│       │   └── ground-light-pool.frag.glsl
│       ├── ui/
│       │   ├── ToggleSwitch.tsx
│       │   ├── Panel.tsx
│       │   ├── Badge.tsx
│       │   ├── KeyHint.tsx
│       │   ├── Tooltip.tsx
│       │   ├── SlidePanel.tsx
│       │   ├── DataTable.tsx
│       │   └── SectionHeader.tsx
│       ├── PostProcessing.tsx
│       └── SceneLights.tsx
│
├── resources/
│   └── ec2.ts                            # Data asset: label, info card fields
│
├── shared/
│   ├── context.ts                        # SceneContext: state refs, callbacks
│   ├── types.ts                          # ActorState, shared types
│   └── geometry.ts                       # createHaloTexture, faceConfigs
│
├── ui/
│   ├── components/                       # Interface definitions (prop types)
│   │   ├── ToggleSwitch.types.ts
│   │   ├── Panel.types.ts
│   │   ├── Badge.types.ts
│   │   ├── KeyHint.types.ts
│   │   ├── Tooltip.types.ts
│   │   ├── SlidePanel.types.ts
│   │   ├── DataTable.types.ts
│   │   └── SectionHeader.types.ts
│   └── features/                         # Compositions - zero styling
│       ├── EffectsPanel.tsx              # Panel + ToggleSwitches for effect toggles
│       ├── ResourceInspector.tsx         # SlidePanel + Badge + DataTable + SectionHeader
│       ├── ResourceTooltip.tsx           # Tooltip + Badge
│       └── CameraToggle.tsx             # KeyHint for camera mode
│
└── assets/
    └── fonts/
        └── GeistPixel-Grid.ttf
```

## Theme System

### Theme Type

```ts
type ActorState = 'idle' | 'hover' | 'selected' | (string & {});

type Theme = {
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

### ThemeProvider

```tsx
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

### Theme Manifest (Tron)

```ts
// theme/tron/index.ts
import { CubeMesh } from './meshes/CubeMesh';
import { ReflectiveGround } from './meshes/ReflectiveGround';
import { HoverDetector } from './effects/HoverDetector';
import { OrbitRing } from './effects/OrbitRing';
// ...

export const tronTheme: Theme = {
  resources: {
    ec2: {
      Mesh: CubeMesh,
      effects: {
        idle:     [TraceLines],
        hover:    [HoverDetector],
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
  Lights: TronSceneLights,
  PostProcessing: TronPostProcessing,
  ui: {
    components: {
      ToggleSwitch: TronToggleSwitch,
      Panel: TronPanel,
      // ...
    },
  },
};
```

### Theme-internal Imports

Theme components import their own theme's modules directly - they know what theme they are:

```tsx
// theme/tron/ui/ToggleSwitch.tsx
import { colors } from '../colors';

function ToggleSwitch({ value, onChange, label }: ToggleSwitchProps) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      ...
    </div>
  );
}
```

`useTheme()` is only used by code outside the theme (actors, features) to resolve which theme's components to use.

## Actor Composition

Actors are thin orchestrators. They manage state and compose theme pieces:

```tsx
// actors/ResourceActor.tsx
function ResourceActor({ type }: { type: string }) {
  const theme = useTheme();
  const { Mesh, effects } = theme.resources[type];

  return (
    <group>
      <Mesh />
      {Object.entries(effects).map(([state, fxList]) =>
        fxList.map((Fx, i) => <Fx key={`${state}-${i}`} />)
      )}
    </group>
  );
}
```

## UI Architecture

### Components (Primitives)

Defined as interfaces in `ui/components/*.types.ts`. Each theme provides its own visual implementation that adheres to the interface.

| Component       | Props                                         | Variants      |
|-----------------|-----------------------------------------------|---------------|
| ToggleSwitch    | value, onChange, label                         | -             |
| Panel           | title, collapsible, children                  | -             |
| Badge           | label, color                                  | status, info  |
| KeyHint         | keyName, label                                | -             |
| Tooltip         | position, children                            | -             |
| SlidePanel      | open, onClose, children                       | left, right   |
| DataTable       | rows: {key, value}[]                          | -             |
| SectionHeader   | title                                         | -             |

### Features (Compositions)

Features live in `ui/features/`. They compose themed components via `useThemedComponents()`. Zero styling - all visual decisions are in the component implementations.

```tsx
// ui/features/EffectsPanel.tsx
function EffectsPanel({ title, effects, toggles, onToggle }) {
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

## State-Driven Effects

Effects respond to actor states. The set of states is extensible:

```ts
type ActorState = 'idle' | 'hover' | 'selected' | (string & {});
```

The theme maps states to effect components. The actor interpolates state transitions and passes state refs via SceneContext. Effects read from context to animate.

## Resource Data Assets

Resources define identity and data, not visuals:

```ts
// resources/ec2.ts
export const ec2Resource = {
  type: 'ec2',
  label: 'EC2',
  data: {
    resource: 'aws_instance.main',
    instance_id: 'i-0a3b8f29d4e6c1072',
    instance_type: 't3.medium',
    // ...
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

## App Composition

```tsx
// App.tsx
import { tronTheme } from './theme/tron';

export default function App() {
  return (
    <ThemeProvider theme={tronTheme}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas>
          <SceneContext.Provider value={sceneCtx}>
            <theme.Lights />
            <ResourceActor type="ec2" />
            <GroundActor />
            <theme.PostProcessing />
          </SceneContext.Provider>
        </Canvas>

        {/* DOM overlays */}
        <EffectsPanel ... />
        <ResourceInspector ... />
        <ResourceTooltip ... />
        <CameraToggle ... />
      </div>
    </ThemeProvider>
  );
}
```
