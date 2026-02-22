**22. Wawa Sensei — WebGPU/TSL Chapter**
Covers WebGPU with React Three Fiber, including how TSL is renderer-agnostic and compiles to both GLSL and WGSL.

---

## Deep Dive

# WebGPU / TSL with React Three Fiber

## Code Snippets & Implementations

### 1. WebGPU Renderer Setup

The WebGPU renderer requires async initialization, so rendering is deferred until ready:

```jsx
import { useState } from "react";
import * as THREE from "three/webgpu";

function App() {
  const [frameloop, setFrameloop] = useState("never");

  return (
    <Canvas
      frameloop={frameloop}
      gl={(canvas) => {
        const renderer = new THREE.WebGPURenderer({
          canvas,
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
          stencil: false,
          shadowMap: true,
        });
        renderer.init().then(() => {
          setFrameloop("always");
        });
        return renderer;
      }}
    >
      {/* ... */}
    </Canvas>
  );
}
```

### 2. Extending Node Materials for R3F

```jsx
import { extend } from "@react-three/fiber";

extend({
  MeshBasicNodeMaterial: THREE.MeshBasicNodeMaterial,
  MeshStandardNodeMaterial: THREE.MeshStandardNodeMaterial,
});
```

Node materials must be explicitly registered. This is a current R3F requirement that may become automatic in the future.

### 3. Basic Color Node

```jsx
import { color } from "three/tsl";

export const PracticeNodeMaterial = ({ colorA = "white" }) => {
  return <meshStandardNodeMaterial colorNode={color(colorA)} />;
};
```

### 4. Mixing Colors via UV Coordinates

```jsx
import { color, mix, uv } from "three/tsl";

export const PracticeNodeMaterial = ({ colorA = "white", colorB = "orange" }) => {
  return (
    <meshStandardNodeMaterial
      colorNode={mix(color(colorA), color(colorB), uv())}
    />
  );
};
```

`mix()` blends two colors using UV coords as the interpolation factor, producing a gradient across the surface.

### 5. Memoized Nodes + Uniforms (Production Pattern)

```jsx
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { color, mix, uv, uniform } from "three/tsl";

export const PracticeNodeMaterial = ({ colorA = "white", colorB = "orange" }) => {
  const { nodes, uniforms } = useMemo(() => {
    const uniforms = {
      colorA: uniform(color(colorA)),
      colorB: uniform(color(colorB)),
    };
    return {
      nodes: {
        colorNode: mix(uniforms.colorA, uniforms.colorB, uv()),
      },
      uniforms,
    };
  }, []);

  useFrame(() => {
    uniforms.colorA.value.set(colorA);
    uniforms.colorB.value.set(colorB);
  });

  return <meshStandardNodeMaterial {...nodes} />;
};
```

This is the recommended pattern: nodes are created once via `useMemo`, and dynamic values flow through uniforms updated in `useFrame`.

### 6. Leva Controls Integration

```jsx
import { useControls } from "leva";

export const Experience = () => {
  const { colorA, colorB } = useControls({
    colorA: { value: "skyblue" },
    colorB: { value: "blueviolet" },
  });

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[2, 2, 200, 200]} />
      <PracticeNodeMaterial colorA={colorA} colorB={colorB} />
    </mesh>
  );
};
```

---

## Key Techniques & Patterns

- **Node material naming**: `MeshBasicMaterial` → `MeshBasicNodeMaterial`, `MeshStandardMaterial` → `MeshStandardNodeMaterial`, etc.
- **TSL is renderer-agnostic**: Same node code compiles to GLSL (WebGL) or WGSL (WebGPU). Future-proof by design.
- **Core TSL nodes** from `three/tsl`: `color()`, `mix()`, `uv()`, `uniform()`, `position`
- **Node-based architecture benefits**: composability, reusability, no raw shader code needed, extensibility on top of existing materials.

---

## Practical Tips & Gotchas

| Gotcha | Detail |
|--------|--------|
| **Init timing** | Set `frameloop="never"` initially; switch to `"always"` only after `renderer.init()` resolves. Rendering before init causes errors. |
| **Uniform updates differ by type** | Objects (`color`, `vec3`): `uniforms.colorA.value.set(newColor)`. Primitives (`float`): `uniforms.opacity.value = 0.5`. Mixing these up silently fails. |
| **Shader recompilation** | Wrap node definitions in `useMemo([])`. Recreating nodes triggers expensive shader recompilation. Use uniforms for dynamic values instead. |
| **Extend is required** | Node materials won't work in JSX without `extend()`. This is easy to forget. |

---

## Performance Considerations

- **WebGPU init is async** — the renderer needs a moment to initialize; don't force synchronous rendering.
- **Uniform updates are cheap** — updating uniforms per frame is far less expensive than recompiling shaders. This is the intended update path.
- **Shader compilation is one-time** — TSL compiles to GLSL/WGSL once at material creation, not per frame.
- **Node materials inherit engine optimizations** — `MeshStandardNodeMaterial` still gets built-in shadow, light, and normal handling from Three.js.
- **Watch geometry segments** — the example uses `[2, 2, 200, 200]` (40k vertices). Tune segment count to match visual needs.

---

**References**: [Three.js Shading Language Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language) | Three.js Playground (interactive node editor)
