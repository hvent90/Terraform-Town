**10. Utsubo — "Migrate Three.js to WebGPU (2026)" (Jan 2026)**
Includes TSL bloom setup: `import { bloom, pass } from 'three/tsl'` with threshold, intensity parameters — the modern way to do post-processing lighting.

---

## Deep Dive

# WebGPU + Three.js Migration Guide

## 1. Code Snippets & Implementations

### Basic Renderer Migration

```javascript
// Before (WebGL)
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer({ antialias: true });

// After (WebGPU)
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
```

The `three/webgpu` entry point includes all necessary components and automatically falls back to WebGL 2 if WebGPU is unavailable.

### Async Initialization Pattern

```javascript
// WebGL (synchronous)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
animate(); // Can call immediately

// WebGPU (asynchronous)
const renderer = new THREE.WebGPURenderer();
await renderer.init(); // MUST await before using
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
animate();
```

Refactored pattern for existing codebases:

```javascript
async function initRenderer() {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  await renderer.init();
  return renderer;
}

const renderer = await initRenderer();
```

### Post-Processing with TSL

```javascript
import { bloom, pass } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
const bloomPass = bloom(scenePass, { threshold: 0.8, intensity: 1.5 });
postProcessing.outputNode = bloomPass;
```

### Custom Shader Migration: GLSL to TSL

**Original GLSL:**

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(vUv, 0.5, 1.0);
    }
  `
});
```

**TSL Equivalent:**

```javascript
import { Fn, uv, vec4 } from 'three/tsl';

const colorNode = Fn(() => {
  return vec4(uv(), 0.5, 1.0);
});

const material = new THREE.MeshBasicNodeMaterial();
material.colorNode = colorNode();
```

### WebGPU Capability Detection

```javascript
async function checkWebGPUSupport() {
  if (!navigator.gpu) {
    return { supported: false, reason: 'WebGPU API not available' };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false, reason: 'No GPU adapter found' };
    }

    const device = await adapter.requestDevice();
    return { supported: true, adapter, device };
  } catch (e) {
    return { supported: false, reason: e.message };
  }
}
```

### Progressive Enhancement Factory Pattern

```javascript
import * as THREE_WEBGPU from 'three/webgpu';
import * as THREE_WEBGL from 'three';

export async function createRenderer(canvas, options = {}) {
  const { preferWebGPU = true, ...rendererOptions } = options;

  if (preferWebGPU && navigator.gpu) {
    try {
      const renderer = new THREE_WEBGPU.WebGPURenderer({
        canvas,
        ...rendererOptions
      });
      await renderer.init();
      return { renderer, isWebGPU: true, THREE: THREE_WEBGPU };
    } catch (e) {
      console.warn('WebGPU failed, falling back:', e);
    }
  }

  return {
    renderer: new THREE_WEBGL.WebGLRenderer({ canvas, ...rendererOptions }),
    isWebGPU: false,
    THREE: THREE_WEBGL
  };
}
```

### React Three Fiber Integration

```javascript
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from 'three/webgpu';

function App() {
  return (
    <Canvas
      gl={async (canvas) => {
        const renderer = new WebGPURenderer({ canvas, antialias: true });
        await renderer.init();
        return renderer;
      }}
    >
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}
```

The `gl` prop must return a Promise resolving to the initialized renderer.

### Renderer Type Detection

```javascript
// Unreliable with WebGPU:
const { gl } = useThree();
gl.capabilities.isWebGL2; // undefined on WebGPU

// Better:
const isWebGPU = gl.isWebGPURenderer;
```

### TSL Shader Patterns

**Animated displacement:**

```javascript
import { Fn, positionLocal, normalLocal, sin, time } from 'three/tsl';

const wobble = Fn(() => {
  const t = time.mul(2.0);
  const displacement = sin(positionLocal.x.mul(10.0).add(t)).mul(0.1);
  return positionLocal.add(normalLocal.mul(displacement));
});
```

**Fresnel effect (GLSL vs TSL):**

```javascript
// GLSL:  float fresnel = pow(1.0 - dot(viewDirection, normal), 3.0);

// TSL:
import { Fn, viewDirection, normalLocal, pow, dot, sub } from 'three/tsl';

const fresnel = Fn(() => {
  const vDotN = dot(viewDirection, normalLocal);
  return pow(sub(1.0, vDotN), 3.0);
});
```

**Noise-based displacement:**

```javascript
import { Fn, positionLocal, normalLocal, noise3D, time } from 'three/tsl';

const noiseDisplacement = Fn(() => {
  const noiseInput = positionLocal.add(time.mul(0.5));
  const n = noise3D(noiseInput);
  return positionLocal.add(normalLocal.mul(n.mul(0.2)));
});
```

### Compute Shader: GPU Particle System (1M particles)

```javascript
import {
  Fn, storage, instancedArray,
  instanceIndex, vec3, time
} from 'three/tsl';

const particleCount = 1000000;
const positionBuffer = instancedArray(particleCount, 'vec3');
const velocityBuffer = instancedArray(particleCount, 'vec3');

const updateParticles = Fn(() => {
  const i = instanceIndex;
  const pos = positionBuffer.element(i);
  const vel = velocityBuffer.element(i);

  const gravity = vec3(0, -9.8, 0);
  vel.addAssign(gravity.mul(0.016));
  pos.addAssign(vel.mul(0.016));
  pos.y.assign(pos.y.max(0));
});

renderer.computeAsync(updateParticles);
```

### Resource Disposal

```javascript
mesh.geometry.dispose();
mesh.material.dispose();
texture.dispose();
storageBuffer.destroy(); // compute buffers
```

### Electron Kiosk Configuration

```javascript
app.commandLine.appendSwitch('enable-features', 'Vulkan');
app.commandLine.appendSwitch('use-vulkan');
app.commandLine.appendSwitch('enable-unsafe-webgpu');

const win = new BrowserWindow({
  fullscreen: true, frame: false, kiosk: true,
  webPreferences: { webgl: true, webgpu: true }
});
```

---

## 2. Key Techniques & Patterns

- **Zero-config import strategy** — `three/webgpu` provides automatic WebGL 2 fallback without explicit configuration.
- **Async-first initialization** — WebGPU requires `await renderer.init()` before any rendering, unlike WebGL's synchronous model.
- **TSL as cross-platform shader language** — compiles to both WGSL (WebGPU) and GLSL (WebGL), eliminating parallel shader implementations.
- **GPU compute shaders** — enable general-purpose computation (physics, particles) entirely on the GPU, bypassing CPU-GPU round trips.
- **Graceful degradation architecture** — ship WebGPU as primary with WebGL 2 as transparent fallback.
- **React Three Fiber async factory** — the `gl` prop accepts an async factory function for deferred WebGPU renderer initialization.
- **Conditional shader paths** — use `renderer.isWebGPURenderer` to select TSL vs GLSL material paths at runtime.

---

## 3. Practical Tips & Gotchas

| Gotcha | Detail |
|--------|--------|
| **Silent init failure** | Forgetting `await renderer.init()` produces a blank canvas with **zero console errors**. |
| **Import mixing** | Mixing `three` and `three/webgpu` imports in the same codebase creates version conflicts and unexpected behavior. |
| **Safari timestamp queries** | Safari lacks some timestamp-based queries available in Chrome/Firefox — avoid relying on fine-grained GPU timing. |
| **Safari texture formats** | Safari has slightly different default texture format behavior — specify formats explicitly. |
| **Drei compatibility** | Most Drei helpers work unchanged, but **post-processing effects** require individual testing and potential TSL rewrites. |
| **EffectComposer** | The pmndrs/postprocessing `EffectComposer` requires pass-by-pass validation — not all effects work cross-renderer. |
| **Stricter memory management** | WebGPU requires explicit disposal of geometry, materials, textures, and compute buffers (stricter than WebGL). |
| **Type detection** | Use `gl.isWebGPURenderer` instead of `gl.capabilities.isWebGL2` (the latter is undefined on WebGPU). |
| **User messaging** | Don't show "WebGPU unsupported" alerts — use subtle "compatibility mode" banners instead. |
| **Shader pre-warming** | First-frame compilation stutter occurs — pre-warm shaders during initialization to prevent visible jank. |

---

## 4. Performance Considerations

| Metric | WebGL | WebGPU |
|--------|-------|--------|
| **Draw calls** | CPU-bound overhead in 50k+ draw-call scenes | **2-10x improvement** via explicit binding model |
| **Particles** | ~50,000 practical limit | **1,000,000+** with GPU compute shaders |
| **Physics bodies** | ~1,000 real-time on CPU | **100,000+** via compute shaders |
| **Compute dispatches** | N/A | Batch into fewer, larger passes — many small dispatches create bottlenecks |
| **Texture uploads** | Baseline | Minor factor — don't expect gains from API switch alone |
| **Memory** | Implicit GC | Requires explicit disposal; accumulated allocations degrade frame rate over time |

**Browser support (as of Jan 2026):** ~95% global coverage. Chrome/Edge v113+, Firefox v141+ (Win) / v145+ (macOS), Safari v26+.

**Migration time estimates:** Simple projects 1-2 hours, custom GLSL shaders 1-2 days, complex post-processing apps 1-2 weeks.
