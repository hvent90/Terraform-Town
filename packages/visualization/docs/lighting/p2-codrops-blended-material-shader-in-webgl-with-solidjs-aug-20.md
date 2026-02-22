**9. Codrops — "Blended Material Shader in WebGL with Solid.js" (Aug 2025)**
Great practical insight: reducing from six lights to just two delivered identical visual results at 120fps vs 30fps — a lesson in performant moody lighting.

---

## Deep Dive

# Building a Blended Material Shader in WebGL with Solid.js

## Overview

Tutorial on creating a wireframe-to-solid blending effect using Three.js render targets and custom shaders, with Solid.js for state management. Originally developed for the Blackbird website (SR-71 visualization).

---

## 1. Code Snippets & Implementations

### Viewport Tracker (avoids DOM reflow)

```javascript
// src/gl/viewport.js
export const viewport = {
  width: 0,
  height: 0,
  devicePixelRatio: 1,
  aspectRatio: 0,
};

export const resizeViewport = () => {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.aspectRatio = viewport.width / viewport.height;
  viewport.devicePixelRatio = Math.min(window.devicePixelRatio, 2);
};
```

### Stage Class (Three.js lifecycle manager)

```javascript
// src/gl/stage.js
import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { viewport, resizeViewport } from './viewport';

class Stage {
  init(element) {
    resizeViewport();
    this.camera = new PerspectiveCamera(45, viewport.aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(viewport.width, viewport.height);
    element.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio(viewport.devicePixelRatio);
    this.scene = new Scene();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
    this.scene.children.forEach((child) => {
      if (child.render && typeof child.render === 'function') child.render();
    });
  }

  resize() {
    this.renderer.setSize(viewport.width, viewport.height);
    this.camera.aspect = viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.scene.children.forEach((child) => {
      if (child.resize && typeof child.resize === 'function') child.resize();
    });
  }
}
export default new Stage();
```

### Torus Mesh with GSAP Animation

```javascript
// src/gl/torus.js
import { Mesh, MeshNormalMaterial, TorusKnotGeometry } from 'three';
import gsap from 'gsap';

export default class Torus extends Mesh {
  constructor() {
    super();
    this.geometry = new TorusKnotGeometry(1, 0.285, 300, 26);
    this.material = new MeshNormalMaterial();
    this.position.set(0, 0, -8);

    gsap.to(this.rotation, {
      y: 540 * (Math.PI / 180), // degrees -> radians
      ease: 'power3.inOut',
      duration: 4,
      repeat: -1,
      yoyo: true,
    });
  }
}
```

### RenderTarget Wrapper

```javascript
// src/gl/render-target.js
import { WebGLRenderTarget } from 'three';
import { viewport } from '../viewport';

export default class RenderTarget extends WebGLRenderTarget {
  constructor() {
    super();
    this.width = viewport.width * viewport.devicePixelRatio;
    this.height = viewport.height * viewport.devicePixelRatio;
  }

  resize() {
    const w = viewport.width * viewport.devicePixelRatio;
    const h = viewport.height * viewport.devicePixelRatio;
    this.setSize(w, h);
  }
}
```

### TargetedTorus — Dual Render Pass + Shader Blending (core of the technique)

```javascript
// src/gl/targeted-torus.js
import { Mesh, ShaderMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import Torus from './torus';
import { viewport } from './viewport';
import RenderTarget from './render-target';
import Stage from './stage';

export default class TargetedTorus extends Mesh {
  targetSolid = new RenderTarget();
  targetWireframe = new RenderTarget();
  scene = new Torus();
  camera = new PerspectiveCamera(45, viewport.aspectRatio, 0.1, 1000);

  constructor() {
    super();
    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
      fragmentShader: `
        varying vec2 v_uv;
        uniform sampler2D u_texture_solid;
        uniform sampler2D u_texture_wireframe;

        void main() {
          vec4 wireframe_texture = texture2D(u_texture_wireframe, v_uv);
          vec4 solid_texture = texture2D(u_texture_solid, v_uv);

          float blend = smoothstep(0.15, 0.65, v_uv.x);
          vec4 mixed = mix(wireframe_texture, solid_texture, blend);
          gl_FragColor = mixed;
        }
      `,
      uniforms: {
        u_texture_solid: { value: this.targetSolid.texture },
        u_texture_wireframe: { value: this.targetWireframe.texture },
      },
    });
  }

  render() {
    // Pass 1: wireframe
    this.scene.material.wireframe = true;
    Stage.renderer.setRenderTarget(this.targetWireframe);
    Stage.renderer.render(this.scene, this.camera);
    this.material.uniforms.u_texture_wireframe.value = this.targetWireframe.texture;

    // Pass 2: solid
    this.scene.material.wireframe = false;
    Stage.renderer.setRenderTarget(this.targetSolid);
    Stage.renderer.render(this.scene, this.camera);
    this.material.uniforms.u_texture_solid.value = this.targetSolid.texture;

    // Reset to default framebuffer
    Stage.renderer.setRenderTarget(null);
  }

  resize() {
    this.targetSolid.resize();
    this.targetWireframe.resize();
    this.camera.aspect = viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
  }
}
```

### Solid.js Components

```tsx
// src/components/GlCanvas.tsx
import { onMount, onCleanup } from 'solid-js';
import Stage from '~/gl/stage';

export default function GlCanvas() {
  let el;
  let gl;
  let observer;

  onMount(() => {
    if (!el) return;
    gl = Stage;
    gl.init(el);
    gl.render();
    observer = new ResizeObserver((entry) => gl.resize());
    observer.observe(el);
  });

  onCleanup(() => { if (observer) observer.disconnect(); });

  return (
    <div ref={el} style={{ position: 'fixed', inset: 0, height: '100lvh', width: '100vw' }} />
  );
}
```

```tsx
// src/components/WireframeDemo.tsx
import { createEffect, createSignal } from 'solid-js';
import Stage from '~/gl/stage';
import Torus from '~/gl/torus';

export default function WireframeDemo() {
  let el;
  const [element, setElement] = createSignal(null);
  const [actor, setActor] = createSignal(null);

  createEffect(() => {
    setElement(el);
    if (!element()) return;
    setActor(new Torus());
    Stage.scene.add(actor());
  });

  return <div ref={el} />;
}
```

---

## 2. Key Techniques & Patterns

### Dual Render Target Compositing
The core technique: render the same scene twice (wireframe + solid) into separate `WebGLRenderTarget`s, then composite them on a fullscreen quad using a custom shader. This avoids any geometry duplication.

### `smoothstep` + `mix` Blending
- **`smoothstep(0.15, 0.65, v_uv.x)`** — creates a smooth ramp from 0 to 1 across UV x-coordinates (left=wireframe, right=solid)
- **`mix(a, b, t)`** — linearly interpolates between two vec4 colors at ratio `t`
- The author's mental model: "picture what you want, think how you'd do it in Photoshop, then translate to shader math"

### Stage/Actor Delegation
The `Stage` class auto-delegates `render()` and `resize()` to all scene children that implement those methods — no manual registration needed.

### Solid.js Signal Timing Trick
`createSignal` + `createEffect` defers 3D object creation to the next tick, ensuring the Stage singleton is initialized before children try to use it.

### Viewport Cache Object
All window dimension reads go through a single cached object, updated only on resize. Prevents layout thrashing from repeated `window.innerWidth` calls.

---

## 3. Practical Tips & Gotchas

| Gotcha | Detail |
|--------|--------|
| **SSR safety** | Default viewport values to `0`; `window` is undefined server-side |
| **`setRenderTarget(null)`** | Must reset after render target passes or normal rendering breaks |
| **`material.needsUpdate = true`** | Required after toggling `wireframe` mode |
| **Radians, not degrees** | GSAP/Three.js rotation uses radians: `degrees * (Math.PI / 180)` |
| **Stage timing** | Stage initializes on mount; dependent objects must defer via signals |
| **UV space is 0-1** | Not pixel coordinates |
| **ResizeObserver > window resize** | Auto-debounced, fires on init (no need for manual initial call) |
| **Avoid spaghetti** | Keep files small and single-purpose — "800-line mega-classes are nightmares when debugging WebGL" |

---

## 4. Performance Considerations

- **Cap `devicePixelRatio` at 2**: `Math.min(window.devicePixelRatio, 2)` — ultra-high-density screens waste GPU without visible benefit
- **Minimize lights**: The Blackbird project went from 6 lights (30fps on M1 Max) to 2 lights (120fps) with no visual difference. "The lights in WebGL have consequences."
- **Render target resolution**: Match to `viewport * devicePixelRatio` for crisp output without over-rendering
- **Viewport cache**: Reading `window.innerWidth`/`innerHeight` triggers document reflow — cache and read from the object instead
- **`MeshNormalMaterial`**: Used here to skip lighting entirely, eliminating a major GPU cost for demos/prototypes
- **ResizeObserver**: Built-in debouncing avoids hammering resize logic on every frame during window drag
