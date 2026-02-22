**17. Three.js Demos — "Volumetric Light Shafts"**
Fake volumetric lighting using a translucent cone mesh with additive blending, animated occluders creating dynamic shadow patterns. Interactive with decay/opacity controls.

---

## Deep Dive

# Volumetric Light Shafts (God Rays) — Three.js

## Code Implementation

```javascript
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 200)
camera.position.set(0, 2, 6)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
document.querySelector('#app').appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.5, 0)
controls.update()

// Ground plane
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
)
plane.rotation.x = -Math.PI / 2
plane.receiveShadow = true
scene.add(plane)

// Occluder (rotating cube that creates shadow patterns)
const occluder = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
)
occluder.position.set(0, 0.5, 0)
scene.add(occluder)

// Point light source
const light = new THREE.PointLight(0xffddaa, 1.2, 30, 2)
light.position.set(-2, 3, -2)
scene.add(light)

// Volumetric light cone (the god rays)
const coneGeom = new THREE.ConeGeometry(0.6, 5, 32, 1, true)  // open-ended cone
const coneMat = new THREE.MeshBasicMaterial({
  color: 0xffeedd,
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending,
  depthWrite: false
})
const rays = new THREE.Mesh(coneGeom, coneMat)
rays.position.copy(light.position)
rays.rotation.x = -Math.PI / 2
scene.add(rays)

const params = { density: 0.2, decay: 0.95 }

function animate(timeMs) {
  requestAnimationFrame(animate)
  occluder.rotation.y += 0.01
  rays.material.opacity = params.density
  const d = THREE.MathUtils.lerp(1.0, 0.6, 1 - params.decay)
  rays.scale.set(d, 1, d)
  controls.update()
  renderer.render(scene, camera)
}
animate()
```

## Key Techniques & Patterns

### Cone Geometry as Light Volume
An **open-ended cone** (`ConeGeometry` with the last param `true` to disable the bottom cap) is placed at the light source position. This gives the visual impression of a volumetric light shaft without actual volumetric rendering.

### Additive Blending
`THREE.AdditiveBlending` causes overlapping rays to **add together**, creating bright concentration effects where rays intersect — mimicking how real light accumulates.

### Depth Write Disabled
`depthWrite: false` prevents the transparent cone from writing to the depth buffer, which would otherwise **occlude other transparent objects** and break visual layering.

### Dynamic Decay via Lerp
The `decay` parameter (0.95) modulates cone scaling through `THREE.MathUtils.lerp(1.0, 0.6, 1 - params.decay)`, controlling the radial falloff of light intensity.

### Unlit Material
Uses `MeshBasicMaterial` (not `MeshStandardMaterial`) so the cone **isn't affected by scene lighting** — it maintains a consistent glow appearance regardless of light setup.

## Practical Tips & Gotchas

- **32 cone segments** balances visual quality vs. geometry count
- **Density controls opacity directly** (baseline 0.2) — tweak this to control perceived ray intensity
- **Position must be synced** between the light source and the cone mesh (`rays.position.copy(light.position)`) or you get disconnection artifacts
- The rotating occluder cube (0.01 rad/frame) creates dynamic shadow patterns within the rays

## Performance Considerations

- This is a **geometry-based approximation**, not true volumetric rendering — dramatically cheaper on the GPU
- Trades physical accuracy for computational simplicity while maintaining convincing visual results
- The cone is a single mesh with additive blending, so overdraw cost is minimal compared to ray-marching or post-processing approaches
