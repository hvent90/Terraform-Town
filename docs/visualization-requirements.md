# Terraform Town Visualization Requirements

## Overview

3D visualization component for Terraform Town using Three.js. Renders AWS infrastructure in real-time as users write and apply HCL configurations.

---

## 1. Architecture

### Component Structure

```
src/visualization/
├── index.ts                 # Entry point, exports Visualization class
├── core/
│   ├── Scene.ts             # Three.js scene setup
│   ├── Camera.ts            # Camera + OrbitControls
│   ├── Renderer.ts          # WebGL renderer config
│   └── Lighting.ts          # Lights (ambient, point, spot)
├── resources/
│   ├── ResourceFactory.ts   # Creates resource meshes by type
│   ├── primitives/          # Base shape generators
│   │   ├── Cube.ts
│   │   ├── Sphere.ts
│   │   ├── Cylinder.ts
│   │   └── Shield.ts
│   └── types/               # Resource-specific meshes
│       ├── VPC.ts
│       ├── Subnet.ts
│       ├── SecurityGroup.ts
│       ├── Instance.ts
│       ├── S3Bucket.ts
│       ├── IAMRole.ts
│       └── Lambda.ts
├── connections/
│   ├── ConnectionLine.ts    # Reference lines between resources
│   └── Containment.ts       # Parent-child containment logic
├── layout/
│   └── ForceLayout.ts       # Automatic positioning
├── interactions/
│   ├── Selection.ts         # Click/hover handling
│   ├── Tooltip.ts           # Hover tooltips
│   └── DetailPanel.ts       # Floating detail panel
├── animations/
│   ├── Animator.ts          # Animation orchestrator
│   └── transitions/         # Individual animations
│       ├── FadeIn.ts
│       ├── FadeOut.ts
│       ├── Pulse.ts
│       └── Scale.ts
├── themes/
│   ├── ThemeManager.ts      # Theme loader/applier
│   ├── Theme.ts             # Theme interface
│   └── default.ts           # TRON-style default theme
├── performance/
│   ├── InstancedRenderer.ts # Instancing for 100+ resources
│   ├── LODManager.ts        # Level of detail
│   └── Culling.ts           # Frustum culling
└── state/
    └── StateSync.ts         # Sync with Terraform state
```

### Data Flow

```
Terraform State (JSON)
        │
        ▼
   StateSync.ts
        │ normalizeState()
        ▼
   Visualization.update(state)
        │
        ├─► ResourceFactory.create(type, attrs)
        │         │
        │         ▼
        │   Mesh (positioned by ForceLayout)
        │
        ├─► ConnectionLine.create(from, to)
        │
        └─► Animator.play(transition)
                  │
                  ▼
            Renderer.render()
```

---

## 2. Primitives Catalog

### Base Shapes

| Primitive | Geometry | Use Case |
|-----------|----------|----------|
| Cube | BoxGeometry | Containers, compute |
| Sphere | SphereGeometry | Functions, security |
| Cylinder | CylinderGeometry | Storage |
| Shield | Custom (badge shape) | IAM |
| Plane | PlaneGeometry | Ground |
| Wireframe | EdgesGeometry | Security groups |

### Resource Mappings

| Resource Type | Primitive | Size | Notes |
|---------------|-----------|------|-------|
| VPC | Cube | 10x10x10 units | Transparent, contains children |
| Subnet | Cube | 4x4x4 units | Positioned inside VPC |
| Security Group | Sphere (wireframe) | 3 unit radius | Encompasses attached resources |
| EC2 Instance | Cube | 2x2x2 units | Server-style |
| S3 Bucket | Cylinder | 2x1.5x2 units | Bucket shape |
| IAM Role | Shield | 1.5x2x0.3 units | Badge/shield |
| Lambda Function | Sphere | 1 unit radius | Small, with glow rings |

### Materials (Default Theme)

```typescript
interface MaterialConfig {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  wireframe?: boolean;
}

// Default: TRON-style
const defaultMaterial: MaterialConfig = {
  color: '#00FFFF',
  emissive: '#00FFFF',
  emissiveIntensity: 0.3,
  transparent: true,
  opacity: 0.9,
};
```

---

## 3. Theme System

### Theme Interface

```typescript
interface Theme {
  name: string;
  
  // Environment
  background: string;          // Background color
  fog?: {
    color: string;
    near: number;
    far: number;
  };
  
  // Ground
  ground: {
    color: string;
    checkerboard?: {
      color1: string;
      color2: string;
      size: number;
    };
  };
  
  // Lighting
  ambientLight: {
    color: string;
    intensity: number;
  };
  
  // Resource colors by type
  resources: Record<ResourceType, {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    opacity: number;
    wireframe?: boolean;
  }>;
  
  // State colors
  states: {
    planned: { opacity: number; pulse: boolean };
    applied: { opacity: number; pulse: boolean };
    modified: { opacity: number; glow: string };
    destroyed: { opacity: number; color: string };
    error: { opacity: number; color: string; icon: string };
  };
  
  // Animation timings (ms)
  animations: {
    createDuration: number;
    destroyDuration: number;
    hoverScale: number;
    selectionGlow: number;
  };
}
```

### Default Theme (TRON-style)

```typescript
const defaultTheme: Theme = {
  name: 'tron',
  
  background: '#0a0a0a',
  fog: {
    color: '#0a0a0a',
    near: 50,
    far: 200,
  },
  
  ground: {
    color: '#111111',
    checkerboard: {
      color1: '#1a1a1a',
      color2: '#0f0f0f',
      size: 10,
    },
  },
  
  ambientLight: {
    color: '#222222',
    intensity: 0.5,
  },
  
  resources: {
    vpc: {
      color: '#00FFFF',
      emissive: '#00FFFF',
      emissiveIntensity: 0.3,
      opacity: 0.2,  // Container - mostly transparent
    },
    subnet: {
      color: '#4169E1',
      emissive: '#4169E1',
      emissiveIntensity: 0.4,
      opacity: 0.85,
    },
    security_group: {
      color: '#FF8C00',
      emissive: '#FF8C00',
      emissiveIntensity: 0.2,
      opacity: 0.5,
      wireframe: true,
    },
    instance: {
      color: '#00FF00',
      emissive: '#00FF00',
      emissiveIntensity: 0.5,
      opacity: 0.9,
    },
    s3_bucket: {
      color: '#9B59B6',
      emissive: '#9B59B6',
      emissiveIntensity: 0.4,
      opacity: 0.9,
    },
    iam_role: {
      color: '#FFD700',
      emissive: '#FFD700',
      emissiveIntensity: 0.5,
      opacity: 0.9,
    },
    lambda_function: {
      color: '#FF00FF',
      emissive: '#FF00FF',
      emissiveIntensity: 0.6,
      opacity: 0.9,
    },
  },
  
  states: {
    planned: { opacity: 0.5, pulse: true },
    applied: { opacity: 1.0, pulse: false },
    modified: { opacity: 1.0, glow: '#FFFF00' },
    destroyed: { opacity: 0.3, color: '#FF0000' },
    error: { opacity: 1.0, color: '#FF0000', icon: 'error' },
  },
  
  animations: {
    createDuration: 300,
    destroyDuration: 300,
    hoverScale: 1.05,
    selectionGlow: 1.2,
  },
};
```

---

## 4. API Contract

### Input State Format

```typescript
interface TerraformState {
  resources: Resource[];
  connections: Connection[];
}

interface Resource {
  id: string;                  // Resource address
  type: ResourceType;          // aws_vpc, aws_instance, etc.
  name: string;                // Resource name from HCL
  attributes: Record<string, any>;
  state: 'planned' | 'applied' | 'modified' | 'destroyed' | 'error';
  parentId?: string;           // For containment
  position?: { x: number; y: number; z: number }; // Optional override
}

interface Connection {
  from: string;                // Resource ID
  to: string;                  // Resource ID
  type: 'reference' | 'attachment' | 'dataflow';
  label?: string;              // e.g., "subnet_id", "vpc_security_group_ids"
}

type ResourceType =
  | 'vpc'
  | 'subnet'
  | 'security_group'
  | 'instance'
  | 's3_bucket'
  | 'iam_role'
  | 'lambda_function';
```

### Visualization API

```typescript
class Visualization {
  constructor(container: HTMLElement, theme?: Theme);
  
  // Lifecycle
  init(): void;
  dispose(): void;
  
  // State management
  update(state: TerraformState): void;
  
  // Camera
  focus(resourceId: string): void;
  resetCamera(): void;
  
  // Interactions
  on(event: 'select' | 'hover' | 'deselect', callback: Function): void;
  
  // Theme
  setTheme(theme: Theme): void;
  
  // Render loop
  render(): void;
}
```

---

## 5. Interaction Model

### Mouse Interactions

| Input | Action | Result |
|-------|--------|--------|
| Hover | Raycast to mesh | Tooltip appears, mesh scales up 1.05x |
| Click | Select mesh | Detail panel opens, outline glow |
| Double-click | Focus | Camera animates to center on resource |
| Drag | Pan | Move camera (OrbitControls) |
| Scroll | Zoom | Zoom in/out |
| Right-click drag | Rotate | Orbit camera |

### Keyboard Interactions

| Key | Action |
|-----|--------|
| Escape | Deselect, close panel |
| Delete | Show destroy preview |
| Tab | Cycle through resources |
| R | Reset camera |
| F | Fit all resources in view |

### Touch Interactions

| Gesture | Action |
|---------|--------|
| Tap | Select |
| Double-tap | Focus |
| Pinch | Zoom |
| Rotate | Orbit |
| Swipe | Pan |

### Tooltip Content

```
┌─────────────────────────┐
│ aws_instance.web        │
│ Type: EC2 Instance      │
│ State: applied          │
│ ─────────────────────── │
│ Click for details       │
└─────────────────────────┘
```

### Detail Panel Content

```
┌─────────────────────────────────────┐
│ aws_instance.web                 ✕  │
├─────────────────────────────────────┤
│ Type: aws_instance                  │
│ State: applied                      │
├─────────────────────────────────────┤
│ Attributes:                         │
│   id: i-0abc123def456               │
│   arn: arn:aws:ec2:us-east-1:...    │
│   instance_type: t3.micro           │
│   private_ip: 10.0.1.42             │
│   public_ip: 54.123.45.67           │
│   subnet_id: subnet-abc123          │
│   vpc_security_group_ids:           │
│     - sg-xyz789                     │
├─────────────────────────────────────┤
│ Connections:                        │
│   → aws_subnet.main (subnet_id)     │
│   → aws_security_group.web          │
└─────────────────────────────────────┘
```

---

## 6. Animation Spec

### Animation Types

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Create | 300ms | easeOut | opacity 0→1, scale 0→1 |
| Destroy | 300ms | easeIn | opacity 1→0, scale 1→0 |
| Modify | 500ms | easeInOut | pulse glow intensity |
| State change | 400ms | linear | opacity transition |
| Hover enter | 150ms | easeOut | scale 1→1.05 |
| Hover exit | 150ms | easeIn | scale 1.05→1 |
| Select | 200ms | easeOut | outline glow appears |
| Deselect | 200ms | easeIn | outline glow fades |
| Camera focus | 600ms | easeInOut | position + lookAt |
| Connection draw | 400ms | linear | line progress 0→1 |

### Animation Queue

```typescript
interface Animation {
  id: string;
  type: AnimationType;
  target: string | string[];  // Resource ID(s)
  duration: number;
  easing: EasingFunction;
  onStart?: () => void;
  onComplete?: () => void;
  interruptible: boolean;
}

class Animator {
  queue: Animation[];
  running: Animation | null;
  
  play(animation: Animation): void;
  stop(id: string): void;
  stopAll(): void;
  update(delta: number): void;
}
```

### Easing Functions

```typescript
type EasingFunction = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';
```

---

## 7. Performance Optimizations

### Instanced Rendering

For 100+ resources of the same type:

```typescript
class InstancedRenderer {
  geometry: BufferGeometry;
  material: InstancedMeshMaterial;
  mesh: InstancedMesh;
  maxCount: number;
  
  updateMatrix(index: number, matrix: Matrix4): void;
  updateColor(index: number, color: Color): void;
  updateVisibility(index: number, visible: boolean): void;
}
```

### Level of Detail (LOD)

```typescript
class LODManager {
  levels: [
    { distance: 0, detail: 'full' },      // Full geometry
    { distance: 100, detail: 'medium' },  // Simplified
    { distance: 200, detail: 'low' },     // Bounding box
  ];
  
  update(camera: Camera): void;
}
```

### Frustum Culling

```typescript
class Culling {
  frustum: Frustum;
  
  update(camera: Camera): void;
  isVisible(mesh: Mesh): boolean;
}
```

### Performance Targets

| Count | Technique | FPS Target |
|-------|-----------|------------|
| 1-100 | Standard meshes | 60 |
| 100-1,000 | Instanced geometry | 60 |
| 1,000-10,000 | Instancing + LOD + culling | 30 |
| 10,000+ | Cluster/heatmap | 30 |

### Optimization Strategies

1. **Object pooling** - Reuse meshes instead of create/destroy
2. **Batch updates** - Group state changes, render once
3. **Debounced resize** - Limit resize events
4. **RequestAnimationFrame** - Sync with display refresh
5. **Web Workers** - Offload layout calculations

---

## 8. Integration

### State Sync

```typescript
class StateSync {
  private ws?: WebSocket;
  private pollInterval?: number;
  
  // Connect to backend
  connect(url: string): void;
  
  // Poll for state changes
  startPolling(interval: number): void;
  
  // Parse terraform state JSON
  parseState(tfstate: any): TerraformState;
  
  // Normalize to visualization format
  normalize(resources: any[]): Resource[];
  normalizeConnections(resources: any[]): Connection[];
}
```

### Backend Events

| Event | Payload | Visualization Action |
|-------|---------|---------------------|
| `state:changed` | TerraformState | Update scene |
| `resource:created` | Resource | Animate create |
| `resource:destroyed` | id | Animate destroy |
| `resource:modified` | Resource | Animate modify |
| `plan:preview` | TerraformState | Show ghosted preview |

### File Watcher Integration

```typescript
// Watch terraform.tfstate for changes
fs.watch('terraform.tfstate', (event) => {
  if (event === 'change') {
    const state = JSON.parse(fs.readFileSync('terraform.tfstate'));
    visualization.update(stateSync.parseState(state));
  }
});
```

---

## 9. Component Hierarchy

### Scene Graph

```
Scene
├── Environment
│   ├── Ground (Plane)
│   └── Fog
├── Lighting
│   ├── AmbientLight
│   └── PointLight (per resource, for glow)
├── Resources
│   ├── VPCs (Group)
│   │   └── VPC
│   │       ├── Subnets (Group)
│   │       │   └── Subnet
│   │       │       └── Instances
│   │       └── SecurityGroups (wireframe spheres)
│   ├── S3Buckets (Group)
│   ├── IAMRoles (Group)
│   └── LambdaFunctions (Group)
├── Connections (Group)
│   └── ConnectionLine
└── UI (Group - orthographic overlay)
    ├── Tooltip
    └── SelectionGlow
```

### Detail Panel (DOM Overlay)

```
<div id="detail-panel">
  <header>
    <h2 class="resource-name">aws_instance.web</h2>
    <button class="close">×</button>
  </header>
  <section class="attributes">
    <table>...</table>
  </section>
  <section class="connections">
    <ul>...</ul>
  </section>
</div>
```

---

## 10. Test/Verification Criteria

### Unit Tests

| Test | Verification |
|------|--------------|
| ResourceFactory creates correct mesh | Mesh type matches resource type |
| Theme applies colors | Material colors match theme config |
| Layout positions correctly | No overlapping resources |
| Animations play correctly | Properties animate over duration |
| State sync parses correctly | TF state → Visualization state |

### Integration Tests

| Test | Verification |
|------|--------------|
| terraform apply updates visualization | Resources appear after apply |
| terraform destroy removes resources | Resources animate out |
| Hover shows tooltip | Tooltip visible on hover |
| Click shows detail panel | Panel opens with correct data |
| Camera focus works | Camera animates to resource |

### Visual Tests (Manual)

| Test | Verification |
|------|--------------|
| Theme renders correctly | TRON aesthetic matches spec |
| Emissive glow visible | Soft glow on all resources |
| Ground checkerboard visible | Subtle pattern on ground |
| Animations smooth | No jank, correct timing |
| Performance acceptable | 60fps with 100 resources |

### Acceptance Criteria

- [ ] Visualization renders VPC, Subnet, Security Group, Instance
- [ ] Resources show correct colors for type
- [ ] Hover displays tooltip
- [ ] Click displays detail panel
- [ ] terraform apply creates resources with animation
- [ ] terraform destroy removes resources with animation
- [ ] Camera orbit/zoom works
- [ ] Double-click focuses on resource
- [ ] TRON theme renders correctly
- [ ] 60fps with 100 resources
- [ ] 30fps with 1,000 resources

---

## Appendix: Technology Stack

| Component | Library |
|-----------|---------|
| 3D Engine | Three.js |
| Rendering | WebGL 2.0 |
| Animation | GSAP or Three.js AnimationMixer |
| Layout | d3-force (force-directed graph) |
| UI Overlay | React or vanilla DOM |
| State Management | Custom or Zustand |
| Build | Vite |
| Testing | Vitest + Playwright |
