**21. Sean Bradley (sbcode.net)** — Full TSL course + all light types
Updated through 2025. Covers every light type plus the new TSL/WebGPU workflow.

---

## Deep Dive

# Three.js Lights

## Code Snippets

### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Three.js TypeScript Tutorials by Sean Bradley : https://sbcode.net/threejs</title>
  </head>
  <body>
    <div class="label">MeshBasicMaterial</div>
    <div class="label">MeshNormalMaterial</div>
    <div class="label">MeshPhongMaterial</div>
    <div class="label">MeshStandardMaterial</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### style.css
```css
body {
  overflow: hidden;
  margin: 0px;
}

.label {
  position: absolute;
  color: #ffffff;
  font-family: monospace;
  pointer-events: none;
  text-align: center;
  width: 75px;
  height: 25px;
  font-size: 1vw;
  filter: drop-shadow(2px 2px 1px #000000);
}
```

### main.ts — Full Implementation
```typescript
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

const scene = new THREE.Scene()

const gridHelper = new THREE.GridHelper()
scene.add(gridHelper)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(-1, 4, 2.5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial())
plane.rotation.x = -Math.PI / 2
scene.add(plane)

const data = { color: 0x00ff00, lightColor: 0xffffff }

const geometry = new THREE.IcosahedronGeometry(1, 1)

const meshes = [
  new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: data.color })),
  new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({ flatShading: true })),
  new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: data.color, flatShading: true })),
  new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: data.color, flatShading: true })),
]

meshes[0].position.set(-3, 1, 0)
meshes[1].position.set(-1, 1, 0)
meshes[2].position.set(1, 1, 0)
meshes[3].position.set(3, 1, 0)

scene.add(...meshes)

const gui = new GUI()

// --- AMBIENT LIGHT ---
const ambientLight = new THREE.AmbientLight(data.lightColor, Math.PI)
ambientLight.visible = false
scene.add(ambientLight)

const ambientLightFolder = gui.addFolder('AmbientLight')
ambientLightFolder.add(ambientLight, 'visible')
ambientLightFolder.addColor(data, 'lightColor').onChange(() => {
  ambientLight.color.set(data.lightColor)
})
ambientLightFolder.add(ambientLight, 'intensity', 0, Math.PI)

// --- DIRECTIONAL LIGHT ---
const directionalLight = new THREE.DirectionalLight(data.lightColor, Math.PI)
directionalLight.position.set(1, 1, 1)
scene.add(directionalLight)

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight)
directionalLightHelper.visible = false
scene.add(directionalLightHelper)

const directionalLightFolder = gui.addFolder('DirectionalLight')
directionalLightFolder.add(directionalLight, 'visible')
directionalLightFolder.addColor(data, 'lightColor').onChange(() => {
  directionalLight.color.set(data.lightColor)
})
directionalLightFolder.add(directionalLight, 'intensity', 0, Math.PI * 10)

const directionalLightFolderControls = directionalLightFolder.addFolder('Controls')
directionalLightFolderControls.add(directionalLight.position, 'x', -1, 1, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolderControls.add(directionalLight.position, 'y', -1, 1, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolderControls.add(directionalLight.position, 'z', -1, 1, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolderControls.add(directionalLightHelper, 'visible').name('Helper Visible')
directionalLightFolderControls.close()

// --- POINT LIGHT ---
const pointLight = new THREE.PointLight(data.lightColor, Math.PI)
pointLight.position.set(2, 0, 0)
pointLight.visible = false
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight)
pointLightHelper.visible = false
scene.add(pointLightHelper)

const pointLightFolder = gui.addFolder('Pointlight')
pointLightFolder.add(pointLight, 'visible')
pointLightFolder.addColor(data, 'lightColor').onChange(() => {
  pointLight.color.set(data.lightColor)
})
pointLightFolder.add(pointLight, 'intensity', 0, Math.PI * 10)

const pointLightFolderControls = pointLightFolder.addFolder('Controls')
pointLightFolderControls.add(pointLight.position, 'x', -10, 10)
pointLightFolderControls.add(pointLight.position, 'y', -10, 10)
pointLightFolderControls.add(pointLight.position, 'z', -10, 10)
pointLightFolderControls.add(pointLight, 'distance', 0, 20).onChange(() => {
  spotLightHelper.update()
})
pointLightFolderControls.add(pointLight, 'decay', 0, 10).onChange(() => {
  spotLightHelper.update()
})
pointLightFolderControls.add(pointLightHelper, 'visible').name('Helper Visible')
pointLightFolderControls.close()

// --- SPOTLIGHT ---
const spotLight = new THREE.SpotLight(data.lightColor, Math.PI)
spotLight.position.set(3, 2.5, 1)
spotLight.visible = false
scene.add(spotLight)

const spotLightHelper = new THREE.SpotLightHelper(spotLight)
spotLightHelper.visible = false
scene.add(spotLightHelper)

const spotLightFolder = gui.addFolder('Spotlight')
spotLightFolder.add(spotLight, 'visible')
spotLightFolder.addColor(data, 'lightColor').onChange(() => {
  spotLight.color.set(data.lightColor)
})
spotLightFolder.add(spotLight, 'intensity', 0, Math.PI * 10)

const spotLightFolderControls = spotLightFolder.addFolder('Controls')
spotLightFolderControls.add(spotLight.position, 'x', -10, 10).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight.position, 'y', -10, 10).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight.position, 'z', -10, 10).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight, 'distance', 0, 20).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight, 'decay', 0, 10).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight, 'angle', 0, 1).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLight, 'penumbra', 0, 1, 0.001).onChange(() => {
  spotLightHelper.update()
})
spotLightFolderControls.add(spotLightHelper, 'visible').name('Helper Visible')
spotLightFolderControls.close()

const stats = new Stats()
document.body.appendChild(stats.dom)

const labels = document.querySelectorAll<HTMLDivElement>('.label')

let x, y
const v = new THREE.Vector3()

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  for (let i = 0; i < 4; i++) {
    v.copy(meshes[i].position)
    v.project(camera)

    x = ((1 + v.x) / 2) * innerWidth - 50
    y = ((1 - v.y) / 2) * innerHeight

    labels[i].style.left = x + 'px'
    labels[i].style.top = y + 'px'
  }

  renderer.render(scene, camera)
  stats.update()
}

animate()
```

## Key Techniques & Patterns

### Light Types
| Light | Direction | Position | Description |
|-------|-----------|----------|-------------|
| **AmbientLight** | All directions | N/A | Illuminates the whole scene uniformly |
| **DirectionalLight** | 1 direction | N/A (infinite) | Illuminates the whole scene in one direction |
| **PointLight** | All directions | 3D point | Illuminates from a specific point outward |
| **SpotLight** | 1 direction | 3D point | Cone-shaped illumination from a point |

### Helper Visualization Pattern
Each light gets a corresponding helper (`DirectionalLightHelper`, `PointLightHelper`, `SpotLightHelper`) added to the scene. Helpers must be manually `.update()`'d whenever the light's position/properties change via GUI.

### GUI Organization Pattern
lil-gui folders nest hierarchically — a top-level folder per light type, with a nested "Controls" sub-folder for position/parameters. Sub-folders are `.close()`'d by default.

### Screen-Space Label Tracking
Labels are positioned in screen space by projecting 3D mesh positions through the camera, then converting from NDC to pixel coordinates:
```typescript
v.copy(meshes[i].position)
v.project(camera)
x = ((1 + v.x) / 2) * innerWidth - 50
y = ((1 - v.y) / 2) * innerHeight
```

### Material Responsiveness to Light
- **MeshBasicMaterial** — ignores lights entirely (always fully lit by its color)
- **MeshNormalMaterial** — colors based on surface normals, not lights
- **MeshPhongMaterial** — responds to lights (Phong shading model)
- **MeshStandardMaterial** — responds to lights (PBR model, most realistic)

## Gotchas

### Breaking Change: `useLegacyLights` (Three.js r155+)
Since Three.js r155, `WebGLRenderer.useLegacyLights` defaults to `false`. This changes how light intensity is calculated. The tutorial uses `Math.PI` as intensity (not `1`) to account for this. **If upgrading from older Three.js versions, multiply your old intensity values by `Math.PI`** to get equivalent brightness.

### SpotLight-Specific Parameters
- **`angle`** — cone aperture (0 to 1, not radians in the GUI range)
- **`penumbra`** — soft edge falloff (0 = hard edge, 1 = fully soft)
- **`distance`** and **`decay`** — control how light fades with distance

## Performance Considerations
- A single `IcosahedronGeometry` is shared across all four meshes (geometry reuse).
- `Stats` module is included for FPS monitoring.
- Labels update every frame in the animation loop — for many labels this could become a bottleneck.

---

# TSL (Three.js Shading Language) — Getting Started

## Code Snippets

### Import Map — Self-Hosted
```html
<script type="importmap">
    {
        "imports": {
            "three": "/build/three.webgpu.js",
            "three/webgpu": "/build/three.webgpu.js",
            "three/tsl": "/build/three.tsl.js",
            "three/addons/": "/jsm/"
        }
    }
</script>
```

### Import Map — CDN
```html
<script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.webgpu.js",
            "three/webgpu": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.webgpu.js",
            "three/tsl": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.tsl.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@<version>/examples/jsm/"
        }
    }
</script>
```

### NPM Install
```bash
npm install three
npm install @types/three
```

### Module Imports
```javascript
import * as THREE from 'three/webgpu'
import { positionLocal, Fn, time, vec3 } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

### main.ts — Complete Starter
```typescript
import './style.css'
import * as THREE from 'three/webgpu'
import { color } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10
)
camera.position.z = 1

const renderer = new THREE.WebGPURenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setAnimationLoop(animate)

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const material = new THREE.NodeMaterial()
material.fragmentNode = color('crimson')

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material)
scene.add(mesh)

function animate() {
  controls.update()
  renderer.render(scene, camera)
}
```

## Key Techniques & Patterns

### What TSL Is
TSL (Three.js Shading Language) is a **high-level shader abstraction** — you write shader logic in JavaScript/TypeScript and TSL compiles it at runtime to either WebGL2 GLSL or WebGPU WGSL depending on browser capabilities. No raw shader code needed.

### Critical Import Difference
You must import from `three/webgpu` (not the default `three`) and shader functions from `three/tsl`:
```typescript
import * as THREE from 'three/webgpu'   // NOT 'three'
import { color } from 'three/tsl'
```

### NodeMaterial Pattern
The core pattern for TSL: create a `THREE.NodeMaterial()` and assign TSL expressions to its `fragmentNode` (and/or `vertexNode`):
```typescript
const material = new THREE.NodeMaterial()
material.fragmentNode = color('crimson')
```

### WebGPURenderer vs WebGLRenderer
TSL uses `THREE.WebGPURenderer()` instead of `THREE.WebGLRenderer()`. The renderer automatically falls back to WebGL2 if WebGPU is unavailable.

### Animation Loop Difference
Uses `renderer.setAnimationLoop(animate)` instead of manual `requestAnimationFrame` calls.

## Practical Tips

- **Boilerplate**: Clone from `https://github.com/Sean-Bradley/Three.js-Boilerplate-TS-Vite.git` for a ready-to-go Vite + TypeScript setup.
- **Prerequisites**: Git, Node.js, VSCode (or equivalent).
- **Dev server**: `npm run dev` starts on `localhost:5173`.
- **TypeScript flexibility**: TSL type declarations may have gaps; the course accommodates workarounds for developers unfamiliar with TS.
- **`enableDamping`**: Always set on OrbitControls for smooth camera interaction.

## Performance Considerations
- TSL compiles shaders at runtime — the shader code is generated per-material, so complex node graphs will increase initial compile time.
- `WebGPURenderer` with WebGPU backend is generally faster than WebGL2 for complex scenes, but the fallback to WebGL2 is automatic and transparent.
