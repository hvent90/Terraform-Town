**24. Discover Three.js — PBR & Ambient Lighting**
Explains how Three.js contains the same PBR algorithms used by Unreal, Unity, Disney, and Pixar — foundational but well-written.
---

---

## Deep Dive

# Ambient Lighting in Three.js — Extracted Reference

## Code Snippets & Implementations

### Importing Light Classes

```javascript
import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
} from 'three';
```

### Creating Lights (AmbientLight + DirectionalLight)

```javascript
function createLights() {
  const ambientLight = new AmbientLight('white', 2);

  const mainLight = new DirectionalLight('white', 5);
  mainLight.position.set(10, 10, 10);

  return { ambientLight, mainLight };
}
```

### Adding Lights to the Scene (World Constructor)

```javascript
constructor(container) {
  camera = createCamera();
  renderer = createRenderer();
  scene = createScene();
  loop = new Loop(camera, scene, renderer);
  container.append(renderer.domElement);

  const controls = createControls(camera, renderer.domElement);

  const cube = createCube();
  const { ambientLight, mainLight } = createLights();

  loop.updatables.push(controls);
  scene.add(ambientLight, mainLight, cube);

  const resizer = new Resizer(container, camera, renderer);
}
```

### Creating a HemisphereLight

```javascript
const ambientLight = new HemisphereLight(
  'white',           // bright sky color
  'darkslategrey',   // dim ground color
  5,                 // intensity
);
```

---

## Key Techniques & Patterns

### Two Categories of Lighting

1. **Direct lights** — simulate light arriving directly from a source (`DirectionalLight`, `SpotLight`, `PointLight`)
2. **Ambient lights** — cheaply fake indirect lighting (`AmbientLight`, `HemisphereLight`)

In reality, infinite light rays bounce off every surface. Three.js splits this into direct + indirect components for real-time performance.

### AmbientLight

- Adds a **constant amount of light to every object from all directions**
- Does **not** require positioning (position changes have no effect)
- Cannot cast shadows
- Objects lit only by `AmbientLight` appear flat — no depth perception

### HemisphereLight

- Fades between a **sky color** (top) and **ground color** (bottom)
- Has a `.groundColor` property for the secondary color
- Good for outdoor scenes (pair with `DirectionalLight` as sun) or indoor environments
- Does **not** produce specular highlights when used alone

### Standard Lighting Setup

The go-to pattern: **`DirectionalLight` paired with an ambient light** — balances quality and performance.

---

## Practical Tips & Gotchas

| Tip | Detail |
|-----|--------|
| **Intensity ratio** | Set ambient intensity *lower* than paired direct light (example: ambient=2, directional=5) |
| **One ambient is enough** | No need to add more than one ambient light — multiple instances give diminishing returns |
| **Specular highlights need direct light** | `HemisphereLight` alone produces no shiny highlights; pair with direct light |
| **Depth perception** | Ambient-only lighting makes objects appear 2D — eyes rely on shading variation for depth |
| **DirectionalLight targeting** | Shines from `light.position` toward `light.target.position` (default: origin). Adjusting position still points at the same target |
| **Light transforms** | All lights have `.position`, `.rotation`, `.scale` — but **rotating or scaling lights has no effect** |

---

## Performance Considerations

- **`AmbientLight` is the cheapest** way to fake indirect lighting — suitable for low-power/mobile devices
- **Adding many direct lights kills framerate** — ambient lights are the essential complement
- The **ambient + direct combo** has "virtually no better performance/quality tradeoff"
- **`MeshBasicMaterial`** needs no lights at all (uses textures only) — best for intentionally low-fidelity scenes or when performance is paramount
