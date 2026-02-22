**16. Codrops/Yuriy — "Volumetric Light Rays with Three.js"**
Fragment shader god rays from scratch — still the gold standard tutorial for this effect.

---

## Deep Dive

Here's the compiled extraction. The Codrops page is a **video coding session** (not a written article), so the actual code lives in associated gists. I've extracted everything available:

---

# Volumetric Light Rays with Three.js

> Based on the [Codrops tutorial](https://tympanus.net/codrops/2022/06/27/volumetric-light-rays-with-three-js/) by Yuri Artiukh (akella), with full implementations from associated gists.

## 1. Core Technique: Two-Pass Rendering with Radial Blur

The effect uses a **screen-space post-processing approach** based on the GPU Gems 3 "Volumetric Light Scattering" algorithm. The idea:

1. **Occlusion Pass** - Render the scene with only a bright light source (white sphere) and black silhouettes of occluding objects against a black background.
2. **Volumetric Light Shader Pass** - Apply a radial blur originating from the light's screen-space position to the occlusion texture, creating light ray streaks.
3. **Composite Pass** - Additively blend the light ray texture onto the normally-lit scene.

Three.js **layers** (`camera.layers.set()`) are used to switch between what the camera sees for each pass, avoiding the need for two separate scenes.

## 2. Full Code Implementations

### 2.1 Volumetric Light Scattering Shader (the core effect)

```javascript
THREE.VolumetericLightShader = {
  uniforms: {
    tDiffuse:      { value: null },
    lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
    exposure:      { value: 0.18 },
    decay:         { value: 0.95 },
    density:       { value: 0.8 },
    weight:        { value: 0.4 },
    samples:       { value: 50 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2 lightPosition;
    uniform float exposure;
    uniform float decay;
    uniform float density;
    uniform float weight;
    uniform int samples;
    const int MAX_SAMPLES = 100;

    void main() {
      vec2 texCoord = vUv;
      vec2 deltaTextCoord = texCoord - lightPosition;
      deltaTextCoord *= 1.0 / float(samples) * density;

      vec4 color = texture2D(tDiffuse, texCoord);
      float illuminationDecay = 1.0;

      for (int i = 0; i < MAX_SAMPLES; i++) {
        if (i == samples) {
          break;
        }
        texCoord -= deltaTextCoord;
        vec4 sample = texture2D(tDiffuse, texCoord);
        sample *= illuminationDecay * weight;
        color += sample;
        illuminationDecay *= decay;
      }

      gl_FragColor = color * exposure;
    }
  `
};
```

**How it works:** For each pixel, the shader marches along a ray from the pixel toward the light's screen position. At each step it samples the occlusion texture and accumulates the color, with an exponential `decay` factor so samples farther from the pixel contribute less. This creates the characteristic radial light streak pattern.

**Uniform meanings:**
| Uniform | Purpose | Typical Range |
|---|---|---|
| `lightPosition` | Light position in screen UV space (0-1) | `vec2(0.5, 0.5)` = center |
| `exposure` | Overall brightness multiplier | 0 - 1 (default 0.18) |
| `decay` | How quickly rays fade per sample step | 0.8 - 1.0 (default 0.95) |
| `density` | Step size scaling (controls ray length) | 0 - 1 (default 0.8) |
| `weight` | Per-sample brightness weight | 0 - 1 (default 0.4) |
| `samples` | Number of marching steps | 1 - 100 (default 50) |

### 2.2 Additive Blending Shader (compositing)

```javascript
THREE.AdditiveBlendingShader = {
  uniforms: {
    tDiffuse: { value: null },
    tAdd:     { value: null }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tAdd;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 add = texture2D(tAdd, vUv);
      gl_FragColor = color + add;
    }
  `
};
```

Simple additive blend: the normally-lit scene (`tDiffuse`) plus the volumetric light texture (`tAdd`).

### 2.3 Scene Setup with Layer-Based Occlusion

```javascript
var DEFAULT_LAYER = 0,
    OCCLUSION_LAYER = 1;

function setupScene() {
  // Ambient light for subtle illumination on occluding objects
  var ambientLight = new THREE.AmbientLight(0x2c3e50);
  scene.add(ambientLight);

  // Point light at the light source position
  var pointLight = new THREE.PointLight(0xffffff);
  scene.add(pointLight);

  // WHITE sphere = the light source (only visible in occlusion layer)
  var geometry = new THREE.SphereBufferGeometry(1, 16, 16);
  var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  lightSphere = new THREE.Mesh(geometry, material);
  lightSphere.layers.set(OCCLUSION_LAYER);
  scene.add(lightSphere);

  // Visible colored box (default layer - the "real" scene)
  geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  material = new THREE.MeshPhongMaterial({ color: 0xe74c3c });
  box = new THREE.Mesh(geometry, material);
  box.position.z = 2;
  scene.add(box);

  // BLACK silhouette box (occlusion layer - blocks the light)
  material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  occlusionBox = new THREE.Mesh(geometry, material);
  occlusionBox.position.z = 2;
  occlusionBox.layers.set(OCCLUSION_LAYER);
  scene.add(occlusionBox);

  camera.position.z = 6;
}
```

**Key pattern:** Every object that should block light needs **two meshes** — a visible one on `DEFAULT_LAYER` and a black silhouette on `OCCLUSION_LAYER`. The light source is a white `MeshBasicMaterial` sphere on the occlusion layer only.

### 2.4 Post-Processing Pipeline Setup

```javascript
var renderScale = 0.5; // half resolution for performance

function setupPostprocessing() {
  // --- Pass 1: Occlusion composer (renders at half resolution) ---
  occlusionRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth * renderScale,
    window.innerHeight * renderScale
  );
  occlusionComposer = new THREE.EffectComposer(renderer, occlusionRenderTarget);
  occlusionComposer.addPass(new THREE.RenderPass(scene, camera));

  var pass = new THREE.ShaderPass(THREE.VolumetericLightShader);
  pass.needsSwap = false;  // single shader, no buffer swap needed
  occlusionComposer.addPass(pass);

  // --- Pass 2: Main scene composer ---
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  // Additive blend: main scene + volumetric light texture
  pass = new THREE.ShaderPass(THREE.AdditiveBlendingShader);
  pass.uniforms.tAdd.value = occlusionRenderTarget.texture;
  composer.addPass(pass);
  pass.renderToScreen = true;
}
```

### 2.5 Render Loop (Layer Switching)

```javascript
function render() {
  // Render occlusion pass: only OCCLUSION_LAYER objects visible
  camera.layers.set(OCCLUSION_LAYER);
  renderer.setClearColor(0x000000);     // black background
  occlusionComposer.render();

  // Render main scene: only DEFAULT_LAYER objects visible
  camera.layers.set(DEFAULT_LAYER);
  renderer.setClearColor(0x090611);     // dark scene background
  composer.render();
}
```

### 2.6 Projecting 3D Light Position to Screen UV

```javascript
function updateShaderLight() {
  var p = lightSphere.position.clone();
  var vector = p.project(camera);        // project to NDC (-1 to 1)
  var x = (vector.x + 1) / 2;           // convert to UV (0 to 1)
  var y = (vector.y + 1) / 2;
  volumetericLightShaderUniforms.lightPosition.value.set(x, y);
  pointLight.position.copy(lightSphere.position);
}
```

This is critical — the shader works in screen space, so you must project the 3D light world position into 2D UV coordinates each frame (or when the light/camera moves).

### 2.7 Resize Handler

```javascript
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  var pixelRatio = renderer.getPixelRatio();
  var newWidth  = Math.floor(window.innerWidth / pixelRatio) || 1;
  var newHeight = Math.floor(window.innerHeight / pixelRatio) || 1;

  composer.setSize(newWidth, newHeight);
  occlusionComposer.setSize(
    newWidth * renderScale,
    newHeight * renderScale
  );
}, false);
```

## 3. Key Techniques & Patterns

- **Layer-based multi-pass rendering** — `THREE.Layers` controls what each camera pass can see, eliminating the need for duplicate scenes. `OCCLUSION_LAYER = 1` for the light/silhouettes, `DEFAULT_LAYER = 0` for the lit scene.
- **Screen-space radial blur** — The fragment shader marches from each pixel toward the light in UV space, accumulating weighted samples with exponential decay. This approximates volumetric scattering without expensive raymarching through 3D volumes.
- **Dual EffectComposer pipeline** — One composer for the occlusion/light-ray pass, one for the main scene. The occlusion render target texture is passed to the additive blending shader.
- **3D-to-2D light projection** — `Vector3.project(camera)` converts the light's world position to NDC, then remapped to `[0,1]` UV space for the shader uniform.

## 4. Practical Tips & Gotchas

- **Duplicate meshes are required:** Every occluding object needs a black `MeshBasicMaterial` clone on the occlusion layer. Position and rotation must be synced every frame (`occlusionBox.position.copy(box.position)`).
- **`pass.needsSwap = false`:** When there's only one shader pass in a composer, set this to avoid unnecessary buffer swaps.
- **`MeshBasicMaterial` for light and silhouettes:** The occlusion pass must not be affected by scene lighting — use `MeshBasicMaterial` (white for the light, black for blockers), not `MeshPhongMaterial`.
- **GLSL loop workaround:** GLSL doesn't allow non-constant loop bounds in older specs, so a `MAX_SAMPLES` constant is used with an `if (i == samples) break;` guard to allow the `samples` uniform to control iteration count dynamically.
- **Light position must be in UV space (0-1)**, not NDC (-1 to 1). The conversion is `x = (ndc.x + 1) / 2`.

## 5. Performance Considerations

- **Render occlusion at half resolution** (`renderScale = 0.5`): The occlusion render target is created at `window.innerWidth * 0.5, window.innerHeight * 0.5`. Since the light rays are inherently soft/blurry, half resolution is visually indistinguishable from full resolution but saves significant fill rate.
- **Configurable render scale:** The implementation supports `Full (1.0)`, `Half (0.5)`, and `Quarter (0.25)` scales for tuning performance vs. quality.
- **Sample count is the main performance knob:** More `samples` = longer rays but more texture fetches per pixel. Default of 50 is a good balance; reduce to 20-30 for mobile.
- **`pixelRatio`-aware sizing:** Composer sizes are divided by device pixel ratio to avoid rendering at unnecessarily high resolutions on retina displays.
- **Single shader pass avoids buffer swap overhead** (`needsSwap = false`).

---

Sources:
- [Volumetric Light Rays with Three.js - Codrops](https://tympanus.net/codrops/2022/06/27/volumetric-light-rays-with-three-js/)
- [Three.js Volumetric Lighting Setup Gist (abberg)](https://gist.github.com/abberg/3486c95682da0a2a5d5f9afb01eae0e4)
- [Volumetric Light Scattering in Three.js Gist (wonglok)](https://gist.github.com/wonglok/2bc240ae814b44f1dc359fd3350a87b6)
- [Live Demo](https://schweinkarausdisco.netlify.app/)
