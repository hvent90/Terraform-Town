# Visualization WebGPU + TSL Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fresh implementation of the 3D Terraform infrastructure visualization using Three.js WebGPURenderer and TSL node-based materials.

**Architecture:** WebGPURenderer with async init, MeshPhysicalNodeMaterial for frosted glass, PostProcessing with TSL bloom(), same modular file structure as before. No tests.

**Tech Stack:** Three.js r171+ (three/webgpu, three/tsl), d3-force, Vite, Bun

**Reference:** `docs/plans/2026-02-21-visualization-webgpu-tsl-design.md`

---

### Task 1: Clean Slate

Delete all existing source files, tests, and primitives directory. Update package.json and vite.config.ts.

**Step 1: Delete old source files and tests**

```bash
rm -rf packages/visualization/src/animations
rm -rf packages/visualization/src/interactions
rm -rf packages/visualization/src/layout
rm -rf packages/visualization/src/resources
rm -rf packages/visualization/src/state
rm -rf packages/visualization/src/themes
rm packages/visualization/src/Visualization.ts
rm packages/visualization/src/types.ts
rm packages/visualization/src/index.ts
rm packages/visualization/src/demo.ts
rm -rf packages/visualization/tests
```

**Step 2: Update package.json**

Remove test dependencies and update three.js version:

```json
{
  "name": "@terraform-town/visualization",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.171.0",
    "d3-force": "^3.0.0"
  },
  "devDependencies": {
    "@types/three": "^0.171.0",
    "@types/d3-force": "^3.0.0",
    "vite": "^6.0.0"
  }
}
```

**Step 3: Update vite.config.ts**

Remove test configuration:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  server: {
    allowedHosts: true,
    hmr: {
      host: '100.76.210.42',
    },
  },
});
```

**Step 4: Install dependencies**

```bash
cd packages/visualization && bun install
```

**Step 5: Recreate empty directories**

```bash
mkdir -p packages/visualization/src/{animations,interactions,layout,resources,state,themes}
```

**Step 6: Commit**

```bash
git add -A packages/visualization && git commit -m "chore: clean slate for WebGPU+TSL visualization rebuild"
```

---

### Task 2: Type Definitions

Create `packages/visualization/src/types.ts` — same interfaces, no changes needed. Types don't reference Three.js.

**Step 1: Write types.ts**

```typescript
export type ResourceType =
  | 'vpc'
  | 'subnet'
  | 'security_group'
  | 'instance'
  | 's3_bucket'
  | 'iam_role'
  | 'lambda_function';

export type ResourceState =
  | 'planned'
  | 'applied'
  | 'modified'
  | 'destroyed'
  | 'error';

export type ConnectionType =
  | 'reference'
  | 'attachment'
  | 'dataflow';

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  attributes: Record<string, any>;
  state: ResourceState;
  parentId?: string;
  position?: { x: number; y: number; z: number };
}

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
}

export interface TerraformState {
  resources: Resource[];
  connections: Connection[];
}

export interface Theme {
  name: string;
  background: string;
  ground: {
    color: string;
    dotGrid?: { dotColor: string; spacing: number; dotSize: number };
  };
  ambientLight: { color: string; intensity: number };
  hemisphereLight?: { skyColor: string; groundColor: string; intensity: number };
  directionalLight?: {
    color: string;
    intensity: number;
    position: [number, number, number];
    castShadow: boolean;
    shadowMapSize?: number;
  };
  rimLight?: { color: string; intensity: number; position: [number, number, number] };
  bloom?: { strength: number; radius: number; threshold: number };
  resources: Record<ResourceType, {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    opacity: number;
    wireframe?: boolean;
    pointLight?: { intensity: number; distance: number; decay: number };
    transmission?: number;
    roughness?: number;
    thickness?: number;
    metalness?: number;
  }>;
  states: {
    planned: { opacity: number; pulse: boolean };
    applied: { opacity: number; pulse: boolean };
    modified: { opacity: number; glow: string };
    destroyed: { opacity: number; color: string };
    error: { opacity: number; color: string; icon: string };
  };
  animations: {
    createDuration: number;
    destroyDuration: number;
    hoverScale: number;
    selectionGlow: number;
  };
}

export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutCubic';

export interface Animation {
  id: string;
  type: 'create' | 'destroy' | 'modify' | 'hover' | 'select' | 'focus' | 'pulse';
  target: string | string[];
  duration: number;
  easing: EasingFunction;
  interruptible: boolean;
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/types.ts && git commit -m "feat: type definitions for WebGPU visualization"
```

---

### Task 3: Theme Configuration

Create `packages/visualization/src/themes/default.ts` — TRON dark theme. Same values as before.

**Step 1: Write themes/default.ts**

```typescript
import type { Theme } from '../types';

export const defaultTheme: Theme = {
  name: 'tron',
  background: '#000000',
  ground: {
    color: '#000000',
    dotGrid: { dotColor: '#ffffff', spacing: 1.5, dotSize: 0.4 },
  },
  ambientLight: { color: '#050510', intensity: 0.1 },
  hemisphereLight: { skyColor: '#001122', groundColor: '#000005', intensity: 0.2 },
  directionalLight: {
    color: '#6688cc',
    intensity: 0.3,
    position: [5, 10, 5],
    castShadow: true,
    shadowMapSize: 512,
  },
  rimLight: { color: '#0088ff', intensity: 0.4, position: [-5, 3, -5] },
  bloom: { strength: 0.4, radius: 0.3, threshold: 0.6 },
  resources: {
    vpc: {
      color: '#00FFFF', emissive: '#00FFFF', emissiveIntensity: 0.6,
      opacity: 0.2, transmission: 0.9, roughness: 0.5, thickness: 0.5, metalness: 0,
      pointLight: { intensity: 80, distance: 40, decay: 2 },
    },
    subnet: {
      color: '#0066FF', emissive: '#0066FF', emissiveIntensity: 0.6,
      opacity: 0.85, transmission: 0.7, roughness: 0.4, thickness: 0.4, metalness: 0,
      pointLight: { intensity: 40, distance: 20, decay: 2 },
    },
    security_group: {
      color: '#FF8C00', emissive: '#FF8C00', emissiveIntensity: 0.5,
      opacity: 0.5, wireframe: true,
      pointLight: { intensity: 30, distance: 18, decay: 2 },
    },
    instance: {
      color: '#39FF14', emissive: '#39FF14', emissiveIntensity: 0.7,
      opacity: 0.9, transmission: 0.8, roughness: 0.45, thickness: 0.3, metalness: 0,
      pointLight: { intensity: 25, distance: 14, decay: 2 },
    },
    s3_bucket: {
      color: '#B026FF', emissive: '#B026FF', emissiveIntensity: 0.6,
      opacity: 0.9, transmission: 0.8, roughness: 0.5, thickness: 0.4, metalness: 0,
      pointLight: { intensity: 25, distance: 14, decay: 2 },
    },
    iam_role: {
      color: '#FFD700', emissive: '#FFD700', emissiveIntensity: 0.6,
      opacity: 0.9, transmission: 0.75, roughness: 0.4, thickness: 0.2, metalness: 0,
      pointLight: { intensity: 20, distance: 12, decay: 2 },
    },
    lambda_function: {
      color: '#FF00FF', emissive: '#FF00FF', emissiveIntensity: 0.7,
      opacity: 0.9, transmission: 0.85, roughness: 0.5, thickness: 0.3, metalness: 0,
      pointLight: { intensity: 30, distance: 14, decay: 2 },
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

**Step 2: Commit**

```bash
git add packages/visualization/src/themes/default.ts && git commit -m "feat: TRON dark theme configuration"
```

---

### Task 4: State Parsing

Create `packages/visualization/src/state/StateSync.ts` — pure data transformation, no Three.js dependency. Logic is identical to previous implementation.

**Step 1: Write state/StateSync.ts**

Copy the exact logic from the previous implementation. This module parses `terraform.tfstate` JSON into normalized `TerraformState` objects. It has no Three.js imports, so no WebGPU changes needed.

Key logic:
- `buildIdLookup()` — maps resource instance IDs to addresses
- `normalizeType()` — maps `aws_vpc` → `vpc`, etc.
- `findParent()` — uses `vpc_id`, `subnet_id` to find parent resources
- `normalizeConnections()` — extracts connections from `vpc_id`, `subnet_id`, `vpc_security_group_ids`

```typescript
import type { TerraformState, Resource, Connection } from '../types';

const PARENT_ATTRS: Record<string, string> = {
  vpc_id: 'aws_vpc',
  subnet_id: 'aws_subnet',
};

const REFERENCE_ATTRS = ['vpc_id', 'subnet_id', 'vpc_security_group_ids'];

export class StateSync {
  parseState(tfstate: any): TerraformState {
    const rawResources = tfstate.resources || [];
    const idToAddress = this.buildIdLookup(rawResources);
    const resources = this.normalizeResources(rawResources, idToAddress);
    const connections = this.normalizeConnections(resources, idToAddress);
    return { resources, connections };
  }

  private buildIdLookup(rawResources: any[]): Map<string, string> {
    const lookup = new Map<string, string>();
    for (const r of rawResources) {
      const attrs = r.instances?.[0]?.attributes || r.attributes || {};
      const address = r.address || r.name;
      if (attrs.id) lookup.set(attrs.id, address);
    }
    return lookup;
  }

  private normalizeResources(rawResources: any[], idToAddress: Map<string, string>): Resource[] {
    return rawResources.map(r => ({
      id: r.address || r.name,
      type: this.normalizeType(r.type),
      name: r.name,
      attributes: r.instances?.[0]?.attributes || r.attributes || {},
      state: 'applied' as const,
      parentId: this.findParent(r, idToAddress),
    }));
  }

  private normalizeType(tfType: string): Resource['type'] {
    const typeMap: Record<string, Resource['type']> = {
      aws_vpc: 'vpc', aws_subnet: 'subnet', aws_security_group: 'security_group',
      aws_instance: 'instance', aws_s3_bucket: 's3_bucket',
      aws_iam_role: 'iam_role', aws_lambda_function: 'lambda_function',
    };
    return typeMap[tfType] || 'instance';
  }

  private findParent(resource: any, idToAddress: Map<string, string>): string | undefined {
    const attrs = resource.instances?.[0]?.attributes || resource.attributes || {};
    for (const [attr] of Object.entries(PARENT_ATTRS)) {
      const refId = attrs[attr];
      if (refId && typeof refId === 'string') {
        const address = idToAddress.get(refId);
        if (address) return address;
      }
    }
    return undefined;
  }

  private normalizeConnections(resources: Resource[], idToAddress: Map<string, string>): Connection[] {
    const connections: Connection[] = [];
    for (const resource of resources) {
      for (const attr of REFERENCE_ATTRS) {
        const value = resource.attributes[attr];
        if (!value) continue;
        const ids = Array.isArray(value) ? value : [value];
        for (const id of ids) {
          const targetAddress = idToAddress.get(id);
          if (targetAddress) {
            connections.push({ from: resource.id, to: targetAddress, type: 'reference', label: attr });
          }
        }
      }
    }
    return connections;
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/state/StateSync.ts && git commit -m "feat: terraform state parser"
```

---

### Task 5: Force Layout

Create `packages/visualization/src/layout/ForceLayout.ts` — pure d3-force, no Three.js dependency. Logic is identical.

**Step 1: Write layout/ForceLayout.ts**

```typescript
import {
  forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter,
  type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force';
import type { Resource, Connection } from '../types';

interface LayoutNode extends SimulationNodeDatum {
  id: string;
}

export class ForceLayout {
  calculate(
    resources: Resource[],
    connections: Connection[] = [],
  ): Map<string, { x: number; y: number; z: number }> {
    const positions = new Map<string, { x: number; y: number; z: number }>();
    if (resources.length === 0) return positions;

    if (resources.length === 1) {
      positions.set(resources[0].id, { x: 0, y: 0, z: 0 });
      return positions;
    }

    const nodes: LayoutNode[] = resources.map(r => ({ id: r.id }));
    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

    const links: SimulationLinkDatum<LayoutNode>[] = [];
    const seenLinks = new Set<string>();

    const addLink = (source: string, target: string) => {
      const key = [source, target].sort().join(':');
      if (seenLinks.has(key)) return;
      if (!nodeIndex.has(source) || !nodeIndex.has(target)) return;
      seenLinks.add(key);
      links.push({ source: nodeIndex.get(source)!, target: nodeIndex.get(target)! });
    };

    for (const conn of connections) addLink(conn.from, conn.to);
    for (const resource of resources) {
      if (resource.parentId && nodeIndex.has(resource.parentId)) {
        addLink(resource.id, resource.parentId);
      }
    }

    const simulation = forceSimulation<LayoutNode>(nodes)
      .force('charge', forceManyBody().strength(-200))
      .force('collide', forceCollide(8))
      .force('center', forceCenter(0, 0))
      .force('link', forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(links).distance(20).strength(1))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    for (const node of nodes) {
      positions.set(node.id, { x: node.x ?? 0, y: 0, z: node.y ?? 0 });
    }
    return positions;
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/layout/ForceLayout.ts && git commit -m "feat: d3-force graph layout"
```

---

### Task 6: Resource Factory (TSL Materials)

Create `packages/visualization/src/resources/ResourceFactory.ts` — this is the main TSL change. Uses `MeshPhysicalNodeMaterial` with TSL node properties for frosted glass, `MeshStandardNodeMaterial` for wireframes.

**Key changes from old implementation:**
- `import * as THREE from 'three/webgpu'` instead of `'three'`
- `new THREE.MeshPhysicalNodeMaterial()` instead of `new THREE.MeshPhysicalMaterial()`
- `new THREE.MeshStandardNodeMaterial()` instead of `new THREE.MeshStandardMaterial()`
- Node materials accept scalar properties directly (same API as classic materials for static values)
- `toneMapped = false` preserved for bloom detection

**Step 1: Write resources/ResourceFactory.ts**

```typescript
import * as THREE from 'three/webgpu';
import type { Resource, Theme } from '../types';

export class ResourceFactory {
  private geometryCache = new Map<string, THREE.BufferGeometry>();

  constructor(private theme: Theme) {}

  private getGeometry(type: string): THREE.BufferGeometry {
    let geometry = this.geometryCache.get(type);
    if (geometry) return geometry;

    switch (type) {
      case 'vpc': geometry = new THREE.BoxGeometry(10, 10, 10); break;
      case 'subnet': geometry = new THREE.BoxGeometry(4, 4, 4); break;
      case 'security_group': geometry = new THREE.SphereGeometry(3, 16, 16); break;
      case 'instance': geometry = new THREE.BoxGeometry(2, 2, 2); break;
      case 's3_bucket': geometry = new THREE.CylinderGeometry(1, 1.5, 2, 16); break;
      case 'iam_role': geometry = new THREE.BoxGeometry(1.5, 2, 0.3); break;
      case 'lambda_function': geometry = new THREE.SphereGeometry(1, 16, 16); break;
      default: geometry = new THREE.BoxGeometry(2, 2, 2);
    }

    this.geometryCache.set(type, geometry);
    return geometry;
  }

  create(resource: Resource): THREE.Object3D {
    const config = this.theme.resources[resource.type] ?? {
      color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.3, opacity: 1,
    };

    const geometry = this.getGeometry(resource.type);

    const stateConfig = this.theme.states[resource.state];
    const targetOpacity = stateConfig && 'opacity' in stateConfig
      ? Math.min(config.opacity, stateConfig.opacity)
      : config.opacity;

    const useFrostedGlass = config.transmission !== undefined && !config.wireframe;

    // TSL: MeshPhysicalNodeMaterial for frosted glass, MeshStandardNodeMaterial for wireframe
    // Node materials accept scalar properties directly for static values
    const material = useFrostedGlass
      ? Object.assign(new THREE.MeshPhysicalNodeMaterial(), {
          color: new THREE.Color(config.color),
          emissive: new THREE.Color(config.emissive),
          emissiveIntensity: config.emissiveIntensity,
          transparent: true,
          opacity: targetOpacity,
          toneMapped: false,
          metalness: config.metalness ?? 0,
          roughness: config.roughness ?? 0.5,
          transmission: config.transmission!,
          thickness: config.thickness ?? 0.5,
        })
      : Object.assign(new THREE.MeshStandardNodeMaterial(), {
          color: new THREE.Color(config.color),
          emissive: new THREE.Color(config.emissive),
          emissiveIntensity: config.emissiveIntensity,
          transparent: targetOpacity < 1,
          opacity: targetOpacity,
          toneMapped: false,
          ...(config.wireframe !== undefined && { wireframe: config.wireframe }),
        });

    const mesh = new THREE.Mesh(geometry, material);

    geometry.computeBoundingBox();
    const halfHeight = geometry.boundingBox
      ? (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2
      : 1;
    mesh.position.y = halfHeight - 1;

    const group = new THREE.Group();
    group.add(mesh);

    if (config.pointLight) {
      const pointLight = new THREE.PointLight(
        config.emissive,
        config.pointLight.intensity,
        config.pointLight.distance,
        config.pointLight.decay,
      );
      pointLight.position.y = halfHeight - 1;
      pointLight.castShadow = false;
      group.add(pointLight);
    }

    group.userData = { id: resource.id, type: resource.type, resource, targetOpacity, mesh };
    return group;
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/resources/ResourceFactory.ts && git commit -m "feat: resource factory with TSL node materials"
```

---

### Task 7: Animator

Create `packages/visualization/src/animations/Animator.ts` — animation system. Import path changes to `three/webgpu`.

**Step 1: Write animations/Animator.ts**

```typescript
import * as THREE from 'three/webgpu';
import type { Animation, EasingFunction } from '../types';

interface RunningAnimation {
  animation: Animation;
  elapsed: number;
}

function applyEasing(t: number, easing: EasingFunction): number {
  switch (easing) {
    case 'linear': return t;
    case 'easeIn':
    case 'easeInQuad': return t * t;
    case 'easeOut':
    case 'easeOutQuad': return 1 - (1 - t) * (1 - t);
    case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    default: return t;
  }
}

export class Animator {
  private queue: Animation[] = [];
  private running: Map<string, RunningAnimation> = new Map();
  private meshLookup: (id: string) => THREE.Object3D | undefined;

  constructor(meshLookup: (id: string) => THREE.Object3D | undefined = () => undefined) {
    this.meshLookup = meshLookup;
  }

  play(animation: Animation): void {
    this.queue.push(animation);
    this.processQueue();
  }

  stop(id: string): void { this.running.delete(id); }
  stopAll(): void { this.queue = []; this.running.clear(); }
  isRunning(id: string): boolean { return this.running.has(id); }

  update(delta: number): void {
    const completed: string[] = [];

    const oneshotTargets = new Set<string>();
    for (const entry of this.running.values()) {
      if (entry.animation.type === 'create' || entry.animation.type === 'destroy') {
        const t = typeof entry.animation.target === 'string'
          ? entry.animation.target : entry.animation.target[0];
        oneshotTargets.add(t);
      }
    }

    for (const [id, entry] of this.running) {
      entry.elapsed += delta;
      const targetId = typeof entry.animation.target === 'string'
        ? entry.animation.target : entry.animation.target[0];

      if (entry.animation.type === 'pulse' && oneshotTargets.has(targetId)) continue;

      const progress = Math.min(entry.elapsed / entry.animation.duration, 1);
      const easedProgress = applyEasing(progress, entry.animation.easing);
      const mesh = this.meshLookup(targetId);

      if (mesh) this.applyAnimation(mesh, entry.animation.type, easedProgress, entry.elapsed);
      if (entry.animation.type === 'pulse') continue;

      if (progress >= 1) {
        if (entry.animation.type === 'destroy' && mesh) mesh.parent?.remove(mesh);
        completed.push(id);
      }
    }

    for (const id of completed) this.running.delete(id);
  }

  private getActualMesh(obj: THREE.Object3D): THREE.Mesh | undefined {
    if (obj instanceof THREE.Mesh) return obj;
    if (obj instanceof THREE.Group && obj.userData.mesh instanceof THREE.Mesh) return obj.userData.mesh;
    return undefined;
  }

  private applyAnimation(mesh: THREE.Object3D, type: Animation['type'], progress: number, elapsed: number): void {
    if (type === 'create') {
      const targetOpacity = mesh.userData.targetOpacity ?? 1;
      mesh.scale.setScalar(progress);
      const actualMesh = this.getActualMesh(mesh);
      if (actualMesh && actualMesh.material instanceof THREE.Material) {
        actualMesh.material.opacity = progress * targetOpacity;
        actualMesh.material.transparent = true;
      }
    } else if (type === 'destroy') {
      mesh.scale.setScalar(1 - progress);
      const actualMesh = this.getActualMesh(mesh);
      if (actualMesh && actualMesh.material instanceof THREE.Material) {
        actualMesh.material.opacity = 1 - progress;
        actualMesh.material.transparent = true;
      }
    } else if (type === 'pulse') {
      const actualMesh = this.getActualMesh(mesh);
      if (actualMesh && actualMesh.material instanceof THREE.Material) {
        const targetOpacity = mesh.userData.targetOpacity ?? 1;
        const pulse = Math.sin(elapsed * Math.PI * 2 / 1000) * 0.15;
        actualMesh.material.opacity = Math.max(0.1, targetOpacity + pulse);
        actualMesh.material.transparent = true;
      }
    }
  }

  private initAnimation(animation: Animation): void {
    const targetId = typeof animation.target === 'string'
      ? animation.target : animation.target[0];
    const mesh = this.meshLookup(targetId);
    if (!mesh) return;

    if (animation.type === 'create') {
      mesh.scale.setScalar(0);
      const actualMesh = this.getActualMesh(mesh);
      if (actualMesh && actualMesh.material instanceof THREE.Material) {
        actualMesh.material.opacity = 0;
        actualMesh.material.transparent = true;
      }
    }
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const anim = this.queue.shift()!;
      if (anim.interruptible || !this.running.has(anim.id)) {
        this.initAnimation(anim);
        this.running.set(anim.id, { animation: anim, elapsed: 0 });
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/animations/Animator.ts && git commit -m "feat: animation system"
```

---

### Task 8: Selection & Interactions

Create `packages/visualization/src/interactions/Selection.ts` — raycasting, tooltips, detail panel, focus camera. Same logic, import path change only.

**Step 1: Write interactions/Selection.ts**

```typescript
import * as THREE from 'three/webgpu';

type EventCallback = (...args: any[]) => void;

export class SelectionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hovered: string | null = null;
  private selected: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private domElement: HTMLElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private detailPanel: HTMLDivElement | null = null;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundDblClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  private focusAnim: {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    elapsed: number;
    duration: number;
    camera: THREE.Camera;
  } | null = null;

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.boundMouseMove = (e) => this.onMouseMove(e);
    this.boundClick = (e) => this.onClick(e);
    this.boundDblClick = (e) => this.onDoubleClick(e);
    this.boundKeyDown = (e) => this.onKeyDown(e);
  }

  setCamera(camera: THREE.Camera): void { this.camera = camera; }

  attach(domElement: HTMLElement): void {
    this.domElement = domElement;
    domElement.addEventListener('mousemove', this.boundMouseMove);
    domElement.addEventListener('click', this.boundClick);
    domElement.addEventListener('dblclick', this.boundDblClick);
    document.addEventListener('keydown', this.boundKeyDown);
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  protected emit(event: string, ...args: any[]): void {
    for (const cb of this.listeners.get(event) ?? []) cb(...args);
  }

  getTooltipElement(): HTMLDivElement {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      Object.assign(this.tooltip.style, {
        display: 'none', position: 'fixed', pointerEvents: 'none',
        padding: '6px 10px', borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.85)', color: '#00FFFF',
        fontSize: '12px', fontFamily: 'monospace',
        border: '1px solid rgba(0, 255, 255, 0.3)', zIndex: '1000',
      });
    }
    return this.tooltip;
  }

  getDetailPanel(): HTMLDivElement {
    if (!this.detailPanel) {
      this.detailPanel = document.createElement('div');
      Object.assign(this.detailPanel.style, {
        display: 'none', position: 'fixed', top: '16px', right: '16px',
        width: '320px', maxHeight: '80vh', overflow: 'auto', padding: '16px',
        borderRadius: '6px', background: 'rgba(0, 0, 0, 0.9)', color: '#00FFFF',
        fontSize: '12px', fontFamily: 'monospace',
        border: '1px solid rgba(0, 255, 255, 0.3)', zIndex: '999',
      });
    }
    return this.detailPanel;
  }

  private raycastHit(event: MouseEvent): { id: string; resource: any } | null {
    if (!this.domElement) return null;
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.id) return { id: obj.userData.id, resource: obj.userData.resource };
        obj = obj.parent;
      }
    }
    return null;
  }

  private onMouseMove(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    const tooltip = this.getTooltipElement();
    if (hit?.resource) {
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      tooltip.textContent = `${hit.resource.name} (${hit.resource.type})`;
    } else {
      tooltip.style.display = 'none';
    }
    if (hit?.id !== this.hovered) {
      this.hovered = hit?.id ?? null;
      this.emit('hover', this.hovered);
    }
  }

  private onClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    this.selected = hit?.id ?? null;
    const panel = this.getDetailPanel();
    if (hit?.resource) {
      this.renderDetailPanel(hit.resource);
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
    this.emit('select', this.selected);
  }

  private onDoubleClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    if (hit) {
      const obj = this.scene.children.find(c => c.userData?.id === hit.id);
      if (obj) {
        this.emit('focus', hit.id, { x: obj.position.x, y: obj.position.y, z: obj.position.z });
      }
    }
  }

  focusCamera(target: THREE.Vector3, cam: THREE.Camera, duration: number): void {
    const offset = new THREE.Vector3(0, 20, 40);
    this.focusAnim = {
      startPos: cam.position.clone(),
      endPos: target.clone().add(offset),
      elapsed: 0, duration, camera: cam,
    };
  }

  updateFocusAnimation(deltaMs: number): void {
    if (!this.focusAnim) return;
    this.focusAnim.elapsed += deltaMs;
    const t = Math.min(this.focusAnim.elapsed / this.focusAnim.duration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    this.focusAnim.camera.position.lerpVectors(this.focusAnim.startPos, this.focusAnim.endPos, eased);
    if (t >= 1) this.focusAnim = null;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selected !== null) {
      this.selected = null;
      this.getDetailPanel().style.display = 'none';
      this.emit('select', null);
    }
  }

  private renderDetailPanel(resource: any): void {
    const panel = this.getDetailPanel();
    panel.innerHTML = '';
    const header = document.createElement('div');
    header.style.marginBottom = '12px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid rgba(0, 255, 255, 0.2)';
    header.innerHTML = `<div style="font-size:14px;font-weight:bold">${resource.name}</div><div style="opacity:0.7">${resource.type}</div>`;
    panel.appendChild(header);
    if (resource.attributes) {
      const attrs = document.createElement('div');
      this.renderAttributes(attrs, resource.attributes);
      panel.appendChild(attrs);
    }
  }

  private renderAttributes(container: HTMLElement, obj: Record<string, any>, indent = 0): void {
    for (const [key, value] of Object.entries(obj)) {
      const row = document.createElement('div');
      row.style.paddingLeft = `${indent * 12}px`;
      row.style.marginBottom = '4px';
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        row.innerHTML = `<span style="opacity:0.7">${key}:</span>`;
        container.appendChild(row);
        this.renderAttributes(container, value, indent + 1);
      } else {
        const displayValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
        row.innerHTML = `<span style="opacity:0.7">${key}:</span> ${displayValue}`;
        container.appendChild(row);
      }
    }
  }

  dispose(): void {
    if (this.domElement) {
      this.domElement.removeEventListener('dblclick', this.boundDblClick);
      this.domElement.removeEventListener('mousemove', this.boundMouseMove);
      this.domElement.removeEventListener('click', this.boundClick);
    }
    document.removeEventListener('keydown', this.boundKeyDown);
    this.tooltip?.parentElement?.removeChild(this.tooltip);
    this.detailPanel?.parentElement?.removeChild(this.detailPanel);
    this.tooltip = null;
    this.detailPanel = null;
    this.domElement = null;
    this.focusAnim = null;
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/interactions/Selection.ts && git commit -m "feat: selection interactions with hover/click/focus"
```

---

### Task 9: Main Visualization Class (WebGPURenderer + PostProcessing)

Create `packages/visualization/src/Visualization.ts` — the main orchestrator. This is the biggest change:

**Key changes from old implementation:**
1. `import * as THREE from 'three/webgpu'` — WebGPU renderer
2. `import { pass } from 'three/tsl'` — TSL post-processing nodes
3. `import { bloom } from 'three/addons/tsl/display/BloomNode.js'` — TSL bloom
4. Constructor calls `await renderer.init()` — async initialization
5. `new THREE.PostProcessing(renderer)` replaces `EffectComposer`
6. `postProcessing.outputNode = scenePass.add(bloomPass)` replaces addPass chain
7. `postProcessing.render()` replaces `composer.render()`
8. Ground plane uses `MeshStandardNodeMaterial` instead of `MeshStandardMaterial`
9. Connection lines use `LineBasicNodeMaterial` instead of `LineBasicMaterial`

**Note on OrbitControls:** Still imported from `three/examples/jsm/controls/OrbitControls.js` — this path is unchanged.

**Note on async:** The constructor cannot be async, so we use a static `create()` factory method pattern.

**Step 1: Write Visualization.ts**

```typescript
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Theme, TerraformState, Resource, Connection } from './types';
import { defaultTheme } from './themes/default';
import { ResourceFactory } from './resources/ResourceFactory';
import { Animator } from './animations/Animator';
import { ForceLayout } from './layout/ForceLayout';
import { StateSync } from './state/StateSync';
import { SelectionManager } from './interactions/Selection';

export class Visualization {
  private container: HTMLElement;
  private theme: Theme;

  private scene: THREE.Scene;
  private orthoCamera: THREE.OrthographicCamera;
  private perspCamera: THREE.PerspectiveCamera;
  private activeCamera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private renderer: THREE.WebGPURenderer;
  private controls!: OrbitControls;
  private postProcessing!: THREE.PostProcessing;
  private scenePassCamera!: THREE.Camera;

  private resourceFactory: ResourceFactory;
  private animator: Animator;
  private layout: ForceLayout;
  private stateSync: StateSync;
  private selection: SelectionManager;

  private resources: Map<string, THREE.Object3D> = new Map();
  private connections: Map<string, THREE.Line> = new Map();
  private animationId: number | null = null;
  private groundMesh!: THREE.Mesh;

  private constructor(container: HTMLElement, theme: Theme, renderer: THREE.WebGPURenderer) {
    this.container = container;
    this.theme = theme;
    this.renderer = renderer;

    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 100;

    this.orthoCamera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2, 0.1, 2000,
    );
    this.perspCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    this.activeCamera = this.orthoCamera;

    this.resourceFactory = new ResourceFactory(this.theme);
    this.animator = new Animator((id) => this.resources.get(id));
    this.layout = new ForceLayout();
    this.stateSync = new StateSync();
    this.selection = new SelectionManager(this.activeCamera, this.scene);

    this.init();
  }

  static async create(container: HTMLElement, theme: Theme = defaultTheme): Promise<Visualization> {
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    await renderer.init();
    return new Visualization(container, theme, renderer);
  }

  private init(): void {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(this.theme.background, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.orthoCamera.position.set(50, 80, 50);
    this.orthoCamera.lookAt(0, 0, 0);
    this.perspCamera.position.set(50, 80, 50);
    this.perspCamera.lookAt(0, 0, 0);

    this.setupControls();
    this.setupLighting();
    this.setupGround();
    this.setupPostProcessing();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') this.toggleCamera();
    });

    this.selection.attach(this.renderer.domElement);
    this.container.appendChild(this.selection.getTooltipElement());
    this.container.appendChild(this.selection.getDetailPanel());
    this.selection.on('focus', (_id: string, pos: { x: number; y: number; z: number }) => {
      this.selection.focusCamera(new THREE.Vector3(pos.x, pos.y, pos.z), this.activeCamera, 600);
    });
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.activeCamera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    if (this.activeCamera === this.orthoCamera) {
      this.controls.enableRotate = false;
      this.controls.screenSpacePanning = false;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.minZoom = 0.5;
      this.controls.maxZoom = 3;
      this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    } else {
      this.controls.enableRotate = true;
      this.controls.screenSpacePanning = false;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
  }

  private toggleCamera(): void {
    if (this.activeCamera !== this.orthoCamera) {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(50, 80, 50);
      this.orthoCamera.lookAt(0, 0, 0);
      this.controls.dispose();
      this.setupControls();
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else {
      const target = this.controls.target.clone();
      this.activeCamera = this.perspCamera;
      this.perspCamera.position.copy(this.orthoCamera.position);
      this.perspCamera.lookAt(target);
      this.controls.dispose();
      this.setupControls();
      this.controls.target.copy(target);
      this.controls.update();
    }
    this.selection.setCamera(this.activeCamera);
    // Re-setup post-processing with new camera
    this.setupPostProcessing();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(this.theme.ambientLight.color, this.theme.ambientLight.intensity);
    this.scene.add(ambient);

    if (this.theme.hemisphereLight) {
      const hemi = new THREE.HemisphereLight(
        this.theme.hemisphereLight.skyColor,
        this.theme.hemisphereLight.groundColor,
        this.theme.hemisphereLight.intensity,
      );
      this.scene.add(hemi);
    }

    if (this.theme.directionalLight) {
      const dirLight = new THREE.DirectionalLight(this.theme.directionalLight.color, this.theme.directionalLight.intensity);
      const [x, y, z] = this.theme.directionalLight.position;
      dirLight.position.set(x, y, z);
      if (this.theme.directionalLight.castShadow) {
        dirLight.castShadow = true;
        const mapSize = this.theme.directionalLight.shadowMapSize ?? 512;
        dirLight.shadow.mapSize.width = mapSize;
        dirLight.shadow.mapSize.height = mapSize;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
      }
      this.scene.add(dirLight);
    }

    if (this.theme.rimLight) {
      const rimLight = new THREE.PointLight(this.theme.rimLight.color, this.theme.rimLight.intensity);
      const [rx, ry, rz] = this.theme.rimLight.position;
      rimLight.position.set(rx, ry, rz);
      this.scene.add(rimLight);
    }
  }

  private setupPostProcessing(): void {
    this.postProcessing = new THREE.PostProcessing(this.renderer);
    const scenePass = pass(this.scene, this.activeCamera);
    const scenePassColor = scenePass.getTextureNode('output');

    if (this.theme.bloom) {
      const bloomPass = bloom(scenePassColor, this.theme.bloom.strength, this.theme.bloom.radius, this.theme.bloom.threshold);
      this.postProcessing.outputNode = scenePassColor.add(bloomPass);
    } else {
      this.postProcessing.outputNode = scenePassColor;
    }
  }

  private setupGround(): void {
    const dots = this.theme.ground.dotGrid;

    const res = 128;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, res, res);

    if (dots) {
      const cx = res / 2;
      const cy = res / 2;
      const dotRadius = res * 0.015;
      ctx.fillStyle = dots.dotColor;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const spacing = dots?.spacing ?? 2;
    texture.repeat.set(1000 / spacing, 1000 / spacing);

    const material = new THREE.MeshStandardNodeMaterial();
    material.map = texture;
    material.roughness = 0.9;
    material.metalness = 0.05;

    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -1;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.userData = { isGround: true };
    this.scene.add(this.groundMesh);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.animator.update(16);
    this.selection.updateFocusAnimation(16);
    this.postProcessing.render();
  };

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    const frustumSize = 100;

    this.orthoCamera.left = frustumSize * aspect / -2;
    this.orthoCamera.right = frustumSize * aspect / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = frustumSize / -2;
    this.orthoCamera.updateProjectionMatrix();

    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  // Public API

  update(state: TerraformState): void {
    const positions = this.layout.calculate(state.resources);
    for (const resource of state.resources) this.upsertResource(resource, positions.get(resource.id));
    for (const conn of state.connections) this.upsertConnection(conn);
  }

  private upsertResource(resource: Resource, position?: { x: number; y: number; z: number }): void {
    let group = this.resources.get(resource.id);

    if (!group) {
      group = this.resourceFactory.create(resource);
      this.scene.add(group);
      this.resources.set(resource.id, group);

      this.animator.play({
        id: `create-${resource.id}`, type: 'create', target: resource.id,
        duration: this.theme.animations.createDuration, easing: 'easeOut', interruptible: true,
      });

      const stateConfig = this.theme.states[resource.state];
      if (stateConfig && 'pulse' in stateConfig && stateConfig.pulse) {
        this.animator.play({
          id: `pulse-${resource.id}`, type: 'pulse', target: resource.id,
          duration: 1000, easing: 'linear', interruptible: true,
        });
      }
    }

    if (position) group.position.set(position.x, position.y, position.z);
  }

  private upsertConnection(conn: Connection): void {
    const fromMesh = this.resources.get(conn.from);
    const toMesh = this.resources.get(conn.to);
    if (!fromMesh || !toMesh) return;

    const key = `${conn.from}->${conn.to}`;
    let line = this.connections.get(key);

    if (!line) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicNodeMaterial();
      material.color = new THREE.Color(0x00ffff);
      material.transparent = true;
      material.opacity = 0.3;

      line = new THREE.Line(geometry, material);
      line.userData = { connectionId: key };
      this.scene.add(line);
      this.connections.set(key, line);
    }

    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, fromMesh.position.x, fromMesh.position.y, fromMesh.position.z);
    posAttr.setXYZ(1, toMesh.position.x, toMesh.position.y, toMesh.position.z);
    posAttr.needsUpdate = true;
  }

  on(event: string, callback: Function): void {
    this.selection.on(event, callback as any);
  }

  dispose(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.postProcessing.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
```

**Step 2: Commit**

```bash
git add packages/visualization/src/Visualization.ts && git commit -m "feat: main visualization with WebGPURenderer + TSL bloom"
```

---

### Task 10: Entry Points & Demo

Create `packages/visualization/src/index.ts` and `packages/visualization/src/demo.ts`. Update `index.html` to use `demo.ts` as entry point.

**Step 1: Write index.ts**

```typescript
export { Visualization } from './Visualization';
export { defaultTheme } from './themes/default';
export type { Theme, Resource, Connection, TerraformState } from './types';
```

**Step 2: Write demo.ts**

```typescript
import { Visualization } from './Visualization';
import { defaultTheme } from './themes/default';
import type { TerraformState } from './types';

const sampleState: TerraformState = {
  resources: [
    { id: 'aws_vpc.main', type: 'vpc', name: 'main', attributes: { cidr_block: '10.0.0.0/16' }, state: 'applied' },
    { id: 'aws_subnet.public', type: 'subnet', name: 'public', attributes: { cidr_block: '10.0.1.0/24', vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_subnet.private', type: 'subnet', name: 'private', attributes: { cidr_block: '10.0.2.0/24', vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_security_group.web', type: 'security_group', name: 'web', attributes: { vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_instance.web-1', type: 'instance', name: 'web-1', attributes: { instance_type: 't3.micro', subnet_id: 'aws_subnet.public', vpc_security_group_ids: ['aws_security_group.web'] }, state: 'applied', parentId: 'aws_subnet.public' },
    { id: 'aws_instance.web-2', type: 'instance', name: 'web-2', attributes: { instance_type: 't3.micro', subnet_id: 'aws_subnet.public', vpc_security_group_ids: ['aws_security_group.web'] }, state: 'planned', parentId: 'aws_subnet.public' },
    { id: 'aws_s3_bucket.data', type: 's3_bucket', name: 'data', attributes: { bucket: 'my-data-bucket' }, state: 'applied' },
    { id: 'aws_lambda_function.handler', type: 'lambda_function', name: 'handler', attributes: { runtime: 'nodejs18.x', handler: 'index.handler' }, state: 'applied' },
  ],
  connections: [
    { from: 'aws_subnet.public', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_subnet.private', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_security_group.web', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_instance.web-1', to: 'aws_subnet.public', type: 'reference' },
    { from: 'aws_instance.web-1', to: 'aws_security_group.web', type: 'reference' },
    { from: 'aws_instance.web-2', to: 'aws_subnet.public', type: 'reference' },
    { from: 'aws_instance.web-2', to: 'aws_security_group.web', type: 'reference' },
  ],
};

async function main() {
  const container = document.getElementById('app');
  if (!container) return;

  const viz = await Visualization.create(container, defaultTheme);
  viz.update(sampleState);

  viz.on('select', (id: string) => console.log('Selected:', id));
  viz.on('hover', (id: string | null) => id && console.log('Hover:', id));
}

main();
```

**Step 3: Update index.html entry point**

Change `/src/index.ts` to `/src/demo.ts`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Terraform Town - Visualization</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0a0a0a; overflow: hidden; }
      #app { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/demo.ts"></script>
  </body>
</html>
```

**Step 4: Commit**

```bash
git add packages/visualization/src/index.ts packages/visualization/src/demo.ts packages/visualization/index.html && git commit -m "feat: entry points and demo scene"
```

---

### Task 11: Verify End-to-End

Run the dev server and check that the visualization renders.

**Step 1: Start dev server**

```bash
cd packages/visualization && bun run dev
```

**Step 2: Open in browser**

Open the Vite dev server URL in a WebGPU-capable browser (Chrome, Firefox, Safari).

**Step 3: Verify**

Expected: dark scene with 8 glowing frosted-glass resources (VPC, 2 subnets, security group, 2 instances, S3 bucket, Lambda), connection lines, bloom glow. One instance (web-2) should pulse at 50% opacity (planned state).

**Step 4: Fix any import/API issues**

If `THREE.PostProcessing` is not found, check the Three.js version:
- r171-r182: Use `THREE.PostProcessing`
- r183+: May be renamed to `THREE.RenderPipeline`

If `bloom` import fails from `three/addons/tsl/display/BloomNode.js`, try:
- `import { bloom } from 'three/tsl'`
- Check Three.js examples for the correct bloom import path

If `MeshPhysicalNodeMaterial` or `MeshStandardNodeMaterial` is not found:
- Ensure `import * as THREE from 'three/webgpu'` (not `'three'`)
- Check that `three` version is >= 0.171.0

If `LineBasicNodeMaterial` is not found:
- Fall back to `THREE.LineBasicMaterial` (line materials may not have node variants)

**Step 5: Final commit (if fixes needed)**

```bash
git add -A packages/visualization && git commit -m "fix: resolve WebGPU import and API compatibility"
```
