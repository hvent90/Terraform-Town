**13. Wael Yasmina — "Selective Unreal Bloom"**
Uses layers to isolate bloomed objects, a bloom EffectComposer, and a custom ShaderPass to merge bloom textures back with the base scene. Essential for making specific objects glow.

---

## Deep Dive

# Selective Unreal Bloom in Three.js - Post Processing

## 1. Code Snippets & Implementations

### Imports & Scene Setup

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(0, -2, 18);
camera.lookAt(scene.position);
```

### Tone Mapping Configuration

```javascript
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

### Bloom Composer (renders bloom to off-screen texture)

```javascript
const renderScene = new RenderPass(scene, camera);
const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.6,  // strength
  0.1,  // radius
  0.1   // threshold
);
bloomComposer.addPass(bloomPass);

bloomPass.strength = 0.4;
bloomPass.radius = 1.2;
bloomPass.threshold = 0.1;
bloomComposer.renderToScreen = false; // Key: don't render to screen
```

### Custom Shaders (HTML)

```html
<script id="vertexshader" type="vertex">
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
</script>

<script id="fragmentshader" type="fragment">
  uniform sampler2D baseTexture;
  uniform sampler2D bloomTexture;

  varying vec2 vUv;

  void main() {
    gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
  }
</script>
```

### ShaderPass Blending (combines base scene + bloom)

```javascript
const mixPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture },
    },
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
  }),
  'baseTexture' // textureID — must match the uniform name
);
```

### Final Composer Pipeline (renders to screen)

```javascript
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(mixPass);

const outputPass = new OutputPass();
finalComposer.addPass(outputPass);
```

> `OutputPass` is only added to `finalComposer`, **not** to `bloomComposer`.

### Layer-Based Selective Bloom

```javascript
const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const materials = {};

// Darken non-bloom objects before bloom pass
function nonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

// Restore original materials after bloom pass
function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}
```

### GLTF Model Loading with Animation

```javascript
const loader = new GLTFLoader();
let mixer;

loader.load('/eye_sword.glb', function (glb) {
  const model = glb.scene;
  scene.add(model);
  model.position.set(0, -2.4, 11);

  const animations = glb.animations;
  mixer = new THREE.AnimationMixer(model);
  const clip = animations[0];
  const action = mixer.clipAction(clip);
  action.play();
});
```

### Animation Loop (critical execution order)

```javascript
const clock = new THREE.Clock();

function animate() {
  controls.update();

  if (mixer) mixer.update(clock.getDelta());

  // Phase 1: darken non-bloom objects
  scene.traverse(nonBloomed);
  // Phase 2: render bloom to off-screen texture
  bloomComposer.render();

  // Phase 3: restore original materials
  scene.traverse(restoreMaterial);
  // Phase 4: render final composited scene
  finalComposer.render();

  requestAnimationFrame(animate);
}
animate();
```

### Raycaster Click-to-Toggle Bloom

```javascript
const rayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  rayCaster.setFromCamera(mouse, camera);
  const intersects = rayCaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const object = intersects[0].object;
    object.layers.toggle(BLOOM_SCENE);
  }
}
window.addEventListener('pointerdown', onPointerDown);
```

### lil-gui Controls

```javascript
import { GUI } from 'lil-gui';

const params = {
  threshold: 0,
  strength: 1,
  radius: 0.5,
  exposure: 1.5,
  Object_11: true,
  Object_12: false,
  Object_13: true,
  Object_14: true,
};

const gui = new GUI();
const bloomFolder = gui.addFolder('Bloom');

bloomFolder.add(params, 'threshold', 0.0, 1.0).onChange(function (value) {
  bloomPass.threshold = Number(value);
});
bloomFolder.add(params, 'strength', 0.0, 3).onChange(function (value) {
  bloomPass.strength = Number(value);
});
bloomFolder.add(params, 'radius', 0.0, 1.0).step(0.01).onChange(function (value) {
  bloomPass.radius = Number(value);
});

const toneMappingFolder = gui.addFolder('Tone mapping');
toneMappingFolder.add(params, 'exposure', 0.1, 2).onChange(function (value) {
  renderer.toneMappingExposure = Math.pow(value, 4.0);
});
```

### Per-Mesh GUI Toggle (inside loader callback)

```javascript
const partsFolder = gui.addFolder('Parts');
partsFolder.closed = false;

partsFolder.add(params, 'Object_11').onChange(function () {
  model.getObjectByName('Object_11').layers.toggle(BLOOM_SCENE);
});
// ... repeat for Object_12, Object_13, Object_14

// Set initial bloom state
model.getObjectByName('Object_11').layers.toggle(BLOOM_SCENE);
model.getObjectByName('Object_13').layers.toggle(BLOOM_SCENE);
model.getObjectByName('Object_14').layers.toggle(BLOOM_SCENE);
```

### Window Resize Handler

```javascript
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  finalComposer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 2. Key Techniques & Patterns

### Three-Phase Rendering
The core technique is a **dual-composer pipeline**:
1. **Darken** all non-bloom objects by swapping their materials to black
2. **Bloom composer** renders the scene (only bloom objects are visible) to an **off-screen texture**
3. **Restore** original materials, then the **final composer** blends the base scene with the bloom texture via a custom shader

### Layer-Based Object Selection
Three.js `Layers` (values 1–31) determine which objects receive bloom. `bloomLayer.test(obj.layers)` checks membership. Objects are assigned to the bloom layer via `object.layers.toggle(BLOOM_SCENE)`.

### UUID-Based Material Caching
Each mesh's `uuid` is used as the key for storing/restoring materials — prevents conflicts even in complex scenes with identically-named meshes.

### Shader Blending
The fragment shader adds the base texture and bloom texture: `baseTexture + 1.0 * bloomTexture`. The `vec4(1.0)` multiplier controls bloom intensity and could be made a uniform for runtime control.

---

## 3. Practical Tips & Gotchas

- **`OutputPass` placement**: Only add it to `finalComposer`, not `bloomComposer`.
- **`bloomComposer.renderToScreen = false`**: Must be set — otherwise bloom renders directly to screen, bypassing the blending step.
- **Bloom texture access**: Use `bloomComposer.renderTarget2.texture` specifically (the second render target).
- **`ShaderPass` textureID**: If your uniform is named `tDiffuse`, you don't need to pass a textureID. For any other name (like `baseTexture`), you must pass it as the second argument to `ShaderPass`.
- **`obj.isMesh` check**: Required in `nonBloomed()` because `scene.traverse` visits all objects including bones, audio, lights, etc.
- **Model lighting**: If using a different model and everything appears dark, check that you have a light source — not all models have emissive materials.
- **Material cleanup**: `delete materials[obj.uuid]` after restoring prevents memory accumulation over time.
- **GUI vs Raycaster**: Using checkboxes and using raycaster click-to-toggle are two alternative approaches — pick one.
- **Resize handler**: Must update `.setSize()` on **both** composers, not just the renderer.

---

## 4. Performance Considerations

- **Double render per frame**: The pipeline calls both `bloomComposer.render()` and `finalComposer.render()` every frame — the scene is effectively rendered twice.
- **`scene.traverse()` per frame**: Runs twice per frame (darken + restore). For large scenes with many meshes, consider caching bloom/non-bloom object lists instead of traversing every frame.
- **Off-screen rendering**: `renderToScreen = false` avoids redundant screen writes — the bloom result goes to a texture, not the display.
- **Tone mapping exposure**: Uses `Math.pow(value, 4.0)` for non-linear control — gives more intuitive GUI slider feel compared to linear mapping.
- **Material swap cost**: Creating a single shared `darkMaterial` (rather than per-object) minimizes allocation overhead.
