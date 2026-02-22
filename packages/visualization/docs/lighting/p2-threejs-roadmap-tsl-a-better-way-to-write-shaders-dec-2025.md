**2. Three.js Roadmap — "TSL: A Better Way to Write Shaders" (Dec 2025)**
Shows how assigning to `colorNode` feeds your logic into PBR calculations where lights, shadows, and fog all still work — you're extending the material rather than replacing it. Includes an animated glass material with vertex displacement.

---

## Deep Dive

# TSL: A Better Way to Write Shaders in Three.js

## Problems TSL Solves

- **`ShaderMaterial`**: Requires rebuilding entire rendering pipelines (lighting, fog, skinning, shadows)
- **`onBeforeCompile()`**: Fragile string injection into generated code, no syntax highlighting or IDE support

---

## Core Concepts & Patterns

### 1. Nodes as Data Flow Declarations
TSL creates node graphs representing shader operations rather than executing math imperatively. Calling `sin(timeUniform)` describes a GPU operation that compiles to optimized GLSL or WGSL.

### 2. Automatic Dependency Resolution
Referencing `positionWorld` automatically multiplies `positionLocal` by the model matrix. Uniforms and transformations are declared only once even if multiple nodes need them.

### 3. Type System with Automatic Conversions
Nodes carry type info. Extracting `.y` from a vec3 yields a float. Multiplying a float by a vec3 auto-promotes the float.

### 4. Method Chaining
```javascript
positionLocal.y.mul(3.0).add(time).sin()
```

### 5. Uniforms for Dynamic Updates
```javascript
const myColor = uniform(new THREE.Color(0xff0000));
// Later: myColor.value.set(0x00ff00);
```

---

## Complete Implementation

### Step 1: Base Setup (WebGPU Renderer)

```javascript
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('canvas');

async function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 0, 3);

  // WebGPU renderer required for TSL
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Must initialize before rendering
  await renderer.init();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 200, 32);
  // ...
}
init();
```

### Step 2: Glass Material with Node Material

```javascript
import {
  uniform, positionLocal, normalLocal, time, sin, mix, Fn
} from 'three/tsl';

const material = new THREE.MeshPhysicalNodeMaterial();

// Glass properties
material.metalness = 0.0;
material.roughness = 0.0;
material.transmission = 0.5;   // 50% see-through
material.thickness = 1.0;
material.ior = 1.5;             // Glass refraction index
material.transparent = true;
material.opacity = 0.6;
material.side = THREE.DoubleSide;

// Uniforms (updateable from JS without recompilation)
const color1 = uniform(new THREE.Color(0x6366f1)); // Indigo
const color2 = uniform(new THREE.Color(0xec4899)); // Pink

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

### Step 3: Animated Color Gradient

```javascript
// Gradient that moves based on position and time
const gradientFactor = sin(positionLocal.length().mul(3.0).add(time))
  .mul(-0.5)
  .add(0.5);

// Pulsating brightness effect
const pulse = sin(time.mul(2.0)).mul(0.3).add(0.7);

// Mix the two colors based on gradient
const finalColor = mix(color1, color2, gradientFactor);

// Apply to emissive (glows through the glass)
material.emissiveNode = finalColor.mul(pulse);
```

**Breakdown:**
- `positionLocal.length()` — distance from center
- `.mul(3.0)` — tighter bands (higher = more bands)
- `.add(time)` — pattern flows outward over time
- `.sin()` — oscillating wave (-1 to 1)
- `.mul(-0.5).add(0.5)` — remaps to 0→1 for `mix()`
- `pulse` — breathing effect (range 0.4 to 1.0)
- Use `emissiveNode` over `colorNode` for transparent materials — emissive glows through, base color barely visible at 50% transmission

### Step 4: Vertex Displacement

```javascript
material.positionNode = Fn(() => {
  const pos = positionLocal;
  const norm = normalLocal;

  // Displacement changes over time and position
  const displacement = sin(time.mul(3.0).add(pos.y.mul(5.0)))
    .mul(0.075);

  // Move vertex along its normal
  return pos.add(norm.mul(displacement));
})();
```

**Details:**
- `Fn()` creates a TSL function compiled to vertex shader
- `time.mul(3.0)` — animation speed
- `pos.y.mul(5.0)` — wave traveling up Y-axis
- `.mul(0.075)` — scales displacement to 7.5% of model size
- Moving along normals maintains surface shape
- **The trailing `()` is required** — it immediately invokes the function

### Step 5: Animation Loop

```javascript
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
animate();
```

---

## Material Node Slots

| Slot | Purpose |
|------|---------|
| `colorNode` | Base color (opaque materials) |
| `emissiveNode` | Self-illuminated color (works with transparency) |
| `positionNode` | Vertex positions (geometry deformation) |
| `roughnessNode` | Surface roughness (PBR) |
| `metalnessNode` | Metallic property (PBR) |
| `normalNode` | Surface normals (bump/normal mapping) |
| `opacityNode` | Transparency amount |
| `aoNode` | Ambient occlusion |

Each slot integrates with the material's lighting model — you **extend** the material rather than replace it.

---

## Practical Tips & Gotchas

1. **Nodes vs Values** — TSL creates node graphs for GPU execution, not JavaScript math. `positionLocal.y.mul(2.0)` is a compilation step, not a calculation.

2. **Emissive for Transparency** — Use `emissiveNode` instead of `colorNode` with transparent materials. Base color is barely visible at 50% transmission; emissive glows through.

3. **Async Renderer Init** — `WebGPURenderer` requires `await renderer.init()` before rendering. Unlike the WebGL renderer, it's not immediately ready.

4. **Uniform Updates** — Uniforms update between frames without shader recompilation. Just modify the `.value` property.

5. **Type Conversions** — Automatic but explicit. Extract components with `.x`, `.y`, `.z` for type safety.

6. **Use Node Material variants** — `MeshPhysicalNodeMaterial`, etc. Standard properties like `metalness`/`roughness` still work normally alongside node inputs.

---

## Performance Considerations

- **Compiler optimization** — TSL handles dead code elimination, variable reuse, and uniform deduplication automatically
- **Bug prevention** — Hand-optimized GLSL often contains subtle bugs that the TSL compiler avoids
- **No redundant calculations** — Automatic dependency resolution prevents recomputing shared values
- **Cross-backend** — Same code compiles to both GLSL (WebGL) and WGSL (WebGPU) without modification
