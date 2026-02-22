**6. Codrops — "Interactive Text Destruction with WebGPU and TSL" (Jul 2025)**
Sets up a WebGPU scene using `RoomEnvironment` with PMREMGenerator for lighting plus a DirectionalLight, with TSL-driven deformation shaders.

---

## Deep Dive

# Interactive Text Destruction with Three.js, WebGPU, and TSL

## Code Snippets & Implementations

### 1. Resource Loading & Scene Initialization

```javascript
const Resources = { font: null };

function preload() {
    const _font_loader = new FontLoader();
    _font_loader.load("../static/font/Times New Roman_Regular.json", (font) => {
        Resources.font = font;
        init();
    });
}

function init() {
    // Scene setup follows
}

window.onload = preload;
```

Loads a Three.js-compatible JSON font file before initializing the scene.

### 2. Scene & Renderer Setup

```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGPURenderer({ antialias: true });

document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;
scene.add(camera);
```

Uses `WebGPURenderer` (not `WebGLRenderer`) because TSL is WebGPU-native.

### 3. Environmental Lighting

```javascript
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromSceneAsync(environment).texture;
scene.environmentIntensity = 0.8;

const light = new THREE.DirectionalLight("#e7e2ca", 5);
light.position.set(0.0, 1.2, 3.86);
scene.add(light);
```

### 4. TextGeometry Creation

```javascript
const text_geo = new TextGeometry("NUEVOS", {
    font: Resources.font,
    size: 1.0,
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.01,
    bevelOffset: 0,
    bevelSegments: 1
});

const mesh = new THREE.Mesh(
    text_geo,
    new THREE.MeshStandardMaterial({
        color: "#656565",
        metalness: 0.4,
        roughness: 0.3
    })
);
scene.add(mesh);
```

### 5. Text Centering

```javascript
text_geo.computeBoundingBox();
const centerOffset = -0.5 * (text_geo.boundingBox.max.x - text_geo.boundingBox.min.x);
const centerOffsety = -0.5 * (text_geo.boundingBox.max.y - text_geo.boundingBox.min.y);
text_geo.translate(centerOffset, centerOffsety, 0);
```

TextGeometry places origin at the baseline by default — must manually center via bounding box.

### 6. Storage Buffer Setup

```javascript
const count = text_geo.attributes.position.count;
const initial_position = storage(text_geo.attributes.position, "vec3", count);
const normal_at = storage(text_geo.attributes.normal, "vec3", count);
const position_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);
const velocity_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);
```

Dual-buffer pattern: stores original vertex positions alongside mutable current positions and velocities for GPU simulation.

### 7. Compute Initialization

```javascript
const compute_init = Fn(() => {
    position_storage_at.element(instanceIndex).assign(initial_position.element(instanceIndex));
    velocity_storage_at.element(instanceIndex).assign(vec3(0.0, 0.0, 0.0));
})().compute(count);

renderer.computeAsync(compute_init);
```

### 8. Uniforms (CPU → GPU Bridge)

```javascript
const u_input_pos = uniform(new THREE.Vector3(0, 0, 0));
const u_input_pos_press = uniform(0.0);
const u_spring = uniform(0.05);
const u_friction = uniform(0.9);
const u_noise_amp = uniform(/* amplitude value */);
```

### 9. Core Compute Update (Spring Physics + Noise Deformation)

```javascript
const compute_update = Fn(() => {
    const base_position = initial_position.element(instanceIndex);
    const current_position = position_storage_at.element(instanceIndex);
    const current_velocity = velocity_storage_at.element(instanceIndex);
    const normal = normal_at.element(instanceIndex);

    // Noise for organic motion
    const noise = mx_noise_vec3(
        current_position.mul(0.5).add(vec3(0.0, time, 0.0)), 1.0
    ).mul(u_noise_amp);

    // Distance-based pointer influence
    const distance = length(u_input_pos.sub(base_position));
    const pointer_influence = step(distance, 0.5).mul(1.5);

    // Deform along normals with noise
    const disorted_pos = base_position.add(noise.mul(normal.mul(pointer_influence)));

    // Rotation for chaotic effect
    disorted_pos.assign(rotate(disorted_pos, vec3(normal.mul(distance)).mul(pointer_influence)));
    disorted_pos.assign(mix(base_position, disorted_pos, u_input_pos_press));

    // Spring-damper physics
    current_velocity.addAssign(disorted_pos.sub(current_position).mul(u_spring));
    current_position.addAssign(current_velocity);
    current_velocity.assign(current_velocity.mul(u_friction));
})().compute(count);
```

**Core logic breakdown:**
- `step(distance, 0.5)` — binary threshold creating a radial falloff; only vertices within 0.5 units of the pointer are affected
- Normal vectors guide the explosion direction; noise prevents uniform/mechanical motion
- Spring physics: `velocity += (target - current) * spring`
- Friction damping: `velocity *= friction`
- Position integration: `position += velocity`

### 10. Linking Compute Output to Rendering

```javascript
mesh.material.positionNode = position_storage_at.toAttribute();
```

### 11. Animation Loop

```javascript
function animate() {
    renderer.computeAsync(compute_update);
    renderer.renderAsync(scene, camera);
}
```

Compute runs **before** render each frame.

### 12. Velocity-Driven Emissive Color

```javascript
const emissive_color = color(new THREE.Color("0000ff"));
const vel_at = velocity_storage_at.toAttribute();
const hue_rotated = vel_at.mul(Math.PI * 10.0);
const emission_factor = length(vel_at).mul(10.0);

mesh.material.emissiveNode = hue(emissive_color, hue_rotated).mul(emission_factor).mul(5.0);
```

Color shifts based on velocity magnitude — faster movement = more hue rotation + brighter emission.

### 13. Fog & Background

```javascript
scene.fog = new THREE.Fog(new THREE.Color("#41444c"), 0.0, 8.5);
scene.background = scene.fog.color;
```

### 14. Post-Processing Pipeline

```javascript
const composer = new THREE.PostProcessing(renderer);
const scene_pass = pass(scene, camera);

scene_pass.setMRT(mrt({
    output: output,
    normal: normalView
}));

const scene_color = scene_pass.getTextureNode("output");
const scene_depth = scene_pass.getTextureNode("depth");
const scene_normal = scene_pass.getTextureNode("normal");

// Ambient Occlusion
const ao_pass = ao(scene_depth, scene_normal, camera);
ao_pass.resolutionScale = 1.0;

const ao_denoise = denoise(ao_pass.getTextureNode(), scene_depth, scene_normal, camera)
    .mul(scene_color);

// Bloom
const bloom_pass = bloom(ao_denoise, 0.3, 0.2, 0.1);

// Film grain noise
const post_noise = mx_noise_float(
    vec3(uv(), time.mul(0.1)).mul(sizes.width), 0.03
).mul(1.0);

// Final composite
composer.outputNode = ao_denoise.add(bloom_pass).add(post_noise);
```

MRT (Multiple Render Targets) outputs color, depth, and normals in a single pass for use in post-processing.

---

## Key Techniques & Patterns

### Spring-Damper Physics
The elastic deformation model: vertices accelerate toward a target, overshoot, and settle naturally. Controlled by two parameters — `spring` (stiffness) and `friction` (damping).

### GPU Compute via TSL
TSL's `Fn()` builder creates GPU-executable compute functions that run per-vertex, avoiding CPU bottlenecks entirely. The pattern is: define with `Fn()`, call to get a node, chain `.compute(count)`.

### Distance-Based Influence with `step()`
Binary threshold function creates a crisp radial falloff — vertices inside the radius deform, those outside don't. Multiplied by 1.5 to amplify the effect.

### Normal-Guided Deformation
Vertices explode outward along their surface normals rather than in a uniform direction, creating physically plausible destruction. Noise modulation adds organic variation.

### Dual-Buffer Pattern
Maintaining both `initial_position` (rest state) and `position_storage_at` (animated state) lets vertices always know where "home" is for the spring system to pull them back.

### Velocity-Driven Visual Feedback
Using velocity magnitude for both hue rotation and emission intensity creates a natural feedback loop — fast-moving vertices glow and shift color, slow ones return to neutral.

---

## Practical Tips & Gotchas

1. **Font conversion** — Use [Facetype.js](http://gero3.github.io/facetype.js/) to convert `.ttf` → `.typeface.json` for Three.js `FontLoader`
2. **WebGPU required** — Must use `WebGPURenderer`, not `WebGLRenderer`; TSL is WebGPU-native
3. **Text centering is manual** — `TextGeometry` places origin at the text baseline; compute bounding box and translate to center
4. **Compute before render** — Call `renderer.computeAsync()` before `renderer.renderAsync()` so GPU buffers update before drawing
5. **Position override** — Assign compute output via `mesh.material.positionNode = storage.toAttribute()` to override vertex positions
6. **Spring tuning** — Low spring (0.05) = slow elastic response; friction at 0.9 prevents runaway oscillation

---

## Performance Considerations

- **Full GPU offload** — All vertex deformation runs on the GPU; no CPU-GPU data transfer per frame
- **Pre-allocated buffers** — Storage buffers are created once, not per-frame
- **Built-in noise** — Uses TSL's `mx_noise_vec3()` (procedural, computed on GPU) rather than texture lookups
- **AO resolution scaling** — `ao_pass.resolutionScale = 1.0` can be dropped to 0.5 on lower-end hardware for a perf boost
- **MRT rendering** — Single geometry pass outputs color + depth + normals simultaneously, avoiding redundant draw calls for post-processing
