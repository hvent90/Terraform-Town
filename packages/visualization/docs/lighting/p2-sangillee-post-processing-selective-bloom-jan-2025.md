**15. Sangillee — "Post-Processing & Selective Bloom" (Jan 2025)**
Detailed walkthrough of EffectComposer, UnrealBloomPass, and selective bloom using layers with full code.
---

---

## Deep Dive

# Selective Bloom Effect in Three.js

## Key Techniques and Patterns

### Layer-Based Object Isolation
Three.js Layers are used to segregate objects that need bloom. There are 32 available layers (0–31), and objects are assigned via bit-masks. An object assigned to multiple layers has a bit-mask equal to the sum of the respective layer values.

### Dual EffectComposer Architecture
Two separate `EffectComposer` instances handle rendering:
1. **Bloom composer** — renders only blooming objects (everything else darkened)
2. **Final composer** — merges the bloom texture with the full scene

This prevents unwanted glow bleeding onto non-target objects.

---

## Code Snippets & Implementations

### 1. Layer Setup
```javascript
sun.layers.enable(1);  // Assigns Sun to bloom layer
```

### 2. Material Darkening (hide non-bloom objects during bloom pass)
```javascript
function darkenNonBloom(obj) {
  if (obj.name == 'atmosphere' || obj.name == 'glow' || obj.name == 'fresnel')
    obj.visible = false;
  else if (obj.layers.isEnabled(1) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}
```

### 3. Material Restoration (restore after bloom pass)
```javascript
function restoreMaterial(obj) {
  if (obj.name == 'atmosphere' || obj.name == 'glow' || obj.name == 'fresnel')
    obj.visible = true;
  else if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}
```

### 4. Bloom Composer Configuration
```javascript
bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderPass);
bloomComposer.addPass(antialiasPass);
bloomComposer.addPass(bloomPass);
bloomComposer.renderToScreen = false;  // renders to texture, not screen
```

### 5. Merge Shader (combines bloom texture with base scene)

**Vertex Shader:**
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
```

**Fragment Shader:**
```glsl
uniform sampler2D u_baseTexture;
uniform sampler2D u_bloomTexture;
uniform float u_alpha;
varying vec2 vUv;

void main() {
  gl_FragColor = (texture2D(u_baseTexture, vUv) + u_alpha * texture2D(u_bloomTexture, vUv));
}
```

### 6. Merge Pass Setup
```javascript
const bloomUniforms = {
  u_baseTexture: { value: null },
  u_bloomTexture: { value: bloomComposer.readBuffer.texture },
  u_alpha: { value: 0.5 }
};

const mergePass = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: bloomUniforms,
  vertexShader: shader_pass_vertex,
  fragmentShader: shader_pass_fragment,
}), 'u_baseTexture');
```

### 7. Main Render Loop
```javascript
scene.traverse(darkenNonBloom);   // replace non-bloom materials with black
bloomComposer.render();           // render bloom-only pass
scene.traverse(restoreMaterial);  // restore original materials
composer.render();                // render final merged scene
```

### 8. Bloom Pass Parameters
```javascript
bloomPass.threshold = 0;
bloomPass.strength = 1.5;
bloomPass.radius = 0.1;
u_alpha: { value: 0.2 }  // Controls bloom intensity in merge
```

---

## Practical Tips & Gotchas

- **Material preservation is critical** — Non-blooming objects must have their original materials cached (keyed by `obj.uuid`) before being replaced with `darkMaterial`. Forgetting to restore them breaks the scene.
- **Visibility toggling vs. material swap** — Special objects like atmosphere, glow, and fresnel need `visible = false` rather than material replacement. They shouldn't occlude bloom calculations.
- **Render order matters** — The bloom composer **must** render before the main composer. Reversing this order breaks the merge operation since `bloomComposer.readBuffer.texture` won't be ready.
- **`renderToScreen = false`** on the bloom composer — it renders to an offscreen buffer that the merge shader reads from, not directly to the canvas.

---

## Performance Considerations

- Running two full composer passes (bloom + final) **doubles the rendering overhead** compared to a single pass.
- Despite the cost, selective bloom produces **cleaner results** than full-scene bloom (which causes unwanted glow on every bright surface).
- The `u_alpha` uniform controls bloom intensity in the merge — lower values reduce bloom contribution and can be tuned for visual quality vs. subtlety.
