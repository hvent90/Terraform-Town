### 5. **Three.js Official Examples: Volumetric Lighting with TRAA and God-Rays** (February 19, 2026)
   - **Link**: [https://threejs.org/examples/#webgpu_volume_lighting_traa](https://threejs.org/examples/#webgpu_volume_lighting_traa) (and related: [https://threejs.org/examples/webgpu_lights_custom.html](https://threejs.org/examples/webgpu_lights_custom.html) for god-rays)
   - **Overview**: Part of the latest Three.js updates, these WebGPU examples demonstrate advanced volumetric lighting and god-rays. View the source code directly in the browser dev tools or on GitHub for tutorial-like implementation.
   - **Key Techniques**: Temporal anti-aliasing (TRAA) for smooth raymarched volumes; custom shaders for light scattering; integration with post-processing for fog and beams.
   - **Why Bonus Points?**: Ideal for moody atmospheres—volumetric effects create stylized fog, light shafts, and dramatic god-rays, perfect for ethereal or cinematic scenes.

---

## Deep Dive

# Three.js WebGPU Volumetric Lighting with TRAA

## Complete Source Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>three.js webgpu - volumetric lighting using TRAA</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <link type="text/css" rel="stylesheet" href="example.css">
</head>
<body>
  <div id="info">
    <a href="https://threejs.org/" target="_blank" rel="noopener" class="logo-link"></a>
    <div class="title-wrapper">
      <a href="https://threejs.org/" target="_blank" rel="noopener">three.js</a>
      <span>Volumetric Lighting using TRAA</span>
    </div>
    <small>Compatible with native lights and shadows using TRAA.</small>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "../build/three.webgpu.js",
        "three/webgpu": "../build/three.webgpu.js",
        "three/tsl": "../build/three.tsl.js",
        "three/addons/": "./jsm/"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three/webgpu';
    import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
             pass, depthPass, mrt, output, velocity, fract,
             interleavedGradientNoise } from 'three/tsl';
    import { traa } from 'three/addons/tsl/display/TRAANode.js';
    import { Inspector } from 'three/addons/inspector/Inspector.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
    import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

    function halton( index, base ) {
      let result = 0;
      let f = 1;
      while ( index > 0 ) {
        f /= base;
        result += f * ( index % base );
        index = Math.floor( index / base );
      }
      return result;
    }

    const _haltonOffsets = Array.from(
      { length: 32 },
      ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
    );

    let renderer, scene, camera;
    let volumetricMesh, teapot, pointLight, spotLight;
    let renderPipeline;
    let temporalOffset, temporalRotation, shaderTime;
    let params;

    init();

    function createTexture3D() { /* ... see below ... */ }
    function init() { /* ... see below ... */ }
    function onWindowResize() { /* ... see below ... */ }
    function animate() { /* ... see below ... */ }
  </script>
</body>
</html>
```

---

## 1. Code Snippets & Implementations

### Halton Sequence Generator (Temporal Jitter)

Generates a low-discrepancy quasi-random sequence used to vary the ray-marching offset each frame, which TRAA then accumulates:

```javascript
// Matches TRAA's 32-sample Halton jitter — optimal low-discrepancy distribution
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

// Generate 32 offsets (base 2, 3) — same length as TRAA's internal sequence
const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

### 3D Noise Texture Generation

128^3 Perlin noise baked into a `Data3DTexture` (single-channel, `RedFormat`):

```javascript
function createTexture3D() {
  let i = 0;
  const size = 128;
  const data = new Uint8Array( size * size * size );
  const scale = 10;
  const perlin = new ImprovedNoise();
  const repeatFactor = 5.0;

  for ( let z = 0; z < size; z ++ ) {
    for ( let y = 0; y < size; y ++ ) {
      for ( let x = 0; x < size; x ++ ) {
        const nx = ( x / size ) * repeatFactor;
        const ny = ( y / size ) * repeatFactor;
        const nz = ( z / size ) * repeatFactor;
        const noiseValue = perlin.noise( nx * scale, ny * scale, nz * scale );
        data[ i ] = ( 128 + 128 * noiseValue );
        i ++;
      }
    }
  }

  const texture = new THREE.Data3DTexture( data, size, size, size );
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
```

### VolumeNodeMaterial Setup (Core Volumetric Config)

```javascript
const volumetricMaterial = new THREE.VolumeNodeMaterial();
volumetricMaterial.steps = 12;
volumetricMaterial.transparent = true;
volumetricMaterial.blending = THREE.AdditiveBlending;
```

### Temporal Dithering via IGN + Halton

The `offsetNode` shifts each pixel's ray-march start using Interleaved Gradient Noise perturbed by the Halton sequence:

```javascript
temporalOffset = uniform( 0 );
temporalRotation = uniform( 0 );
shaderTime = uniform( 0 );

const temporalJitter2D = vec2( temporalOffset, temporalRotation );
volumetricMaterial.offsetNode = fract(
  interleavedGradientNoise(
    screenCoordinate.add( temporalJitter2D.mul( 100 ) )
  ).add( temporalOffset )
);
```

### Scattering Node (Multi-Octave Density Sampling)

Three octaves of 3D noise sampled at different scales, multiplied together for detail, animated over time:

```javascript
volumetricMaterial.scatteringNode = Fn( ( { positionRay } ) => {
  const timeScaled = vec3( shaderTime, 0, shaderTime.mul( .3 ) );

  const sampleGrain = ( scale, timeScale = 1 ) =>
    texture3D(
      noiseTexture3D,
      positionRay.add( timeScaled.mul( timeScale ) ).mul( scale ).mod( 1 ),
      0
    ).r.add( .5 );

  let density = sampleGrain( .1 );
  density = density.mul( sampleGrain( .05, 1 ) );
  density = density.mul( sampleGrain( .02, 2 ) );

  return smokeAmount.mix( 1, density );
} );
```

### Multi-Pass Render Pipeline

```javascript
renderPipeline = new THREE.RenderPipeline( renderer );

// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' )
  .toInspector( 'Depth', () => prePass.getLinearDepthNode() );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );

// --- Pass 2: Scene Pass (full scene + volumetric, MRT) ---
const scenePass = pass( scene, camera ).toInspector( 'Scene' );
scenePass.name = 'Scene Pass';
scenePass.setMRT( mrt( {
  output: output,
  velocity: velocity
} ) );
const scenePassColor = scenePass.getTextureNode().toInspector( 'Output' );
const scenePassVelocity = scenePass.getTextureNode( 'velocity' )
  .toInspector( 'Velocity' );

// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

### Animation Loop

```javascript
let frameCount = 0;
let animationTime = 0;
let lastTime = performance.now();

function animate() {
  const currentTime = performance.now();
  const delta = ( currentTime - lastTime ) * 0.001;
  lastTime = currentTime;

  // Sync temporal uniforms with TRAA's Halton sequence
  const haltonIndex = frameCount % 32;
  temporalOffset.value = _haltonOffsets[ haltonIndex ][ 0 ];
  temporalRotation.value = _haltonOffsets[ haltonIndex ][ 1 ];
  frameCount ++;

  if ( params.animated ) animationTime += delta;
  shaderTime.value = animationTime;

  const scale = 2.4;
  pointLight.position.x = Math.sin( animationTime * 0.7 ) * scale;
  pointLight.position.y = Math.cos( animationTime * 0.5 ) * scale;
  pointLight.position.z = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.position.x = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.lookAt( 0, 0, 0 );
  teapot.rotation.y = animationTime * 0.2;

  renderPipeline.render();
}
```

### Lighting Setup

```javascript
// Warm point light (animated orbit)
pointLight = new THREE.PointLight( 0xf9bb50, 3, 100 );
pointLight.castShadow = true;
pointLight.position.set( 0, 1.4, 0 );

// Spotlight with color projection texture
spotLight = new THREE.SpotLight( 0xffffff, 100 );
spotLight.position.set( 2.5, 5, 2.5 );
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 0;
spotLight.map = new THREE.TextureLoader().setPath( 'textures/' ).load( 'colors.png' );
spotLight.castShadow = true;
spotLight.shadow.intensity = .98;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 15;
spotLight.shadow.focus = 1;
```

---

## 2. Key Techniques & Patterns

### Temporal Reprojection Anti-Aliasing (TRAA) for Volumetrics

The central technique: ray-marched volumes are inherently noisy (few steps = banding), so each frame the ray-march offset is jittered using a **Halton sequence + Interleaved Gradient Noise**, and TRAA accumulates the results over 32 frames. This turns 12-step banding into smooth, high-quality fog.

### Multi-Pass Architecture

| Pass | Purpose |
|------|---------|
| **Depth Pre-Pass** | Renders only opaques to get depth buffer. Volumetric mesh is transparent so it's excluded automatically. |
| **Scene Pass** | Renders everything (opaques + volumetric) with MRT writing both `output` (color) and `velocity` (motion vectors). |
| **TRAA Pass** | Uses color, depth, and velocity to reproject and blend frames temporally. |

### Depth-Aware Volumetric Occlusion

The pre-pass depth is fed into `volumetricMaterial.depthNode` so ray marching terminates at opaque surfaces — volumetric fog correctly stops behind solid objects.

### Multi-Octave Noise for Density

Three noise samples at scales 0.1, 0.05, 0.02 multiplied together. Each moves at a different time scale, creating organic turbulence. The `.add(.5)` bias keeps values positive before multiplication.

### TSL (Three Shader Language) Pattern

All shader logic is defined in JavaScript using TSL's node-based API (`Fn`, `vec3`, `fract`, `texture3D`, etc.) — no raw GLSL/WGSL. This is Three.js's WebGPU-era shader authoring approach.

---

## 3. Practical Tips & Gotchas

- **Halton count must match TRAA**: The 32-element Halton array matches TRAA's internal 32-sample jitter cycle. If they're out of sync, accumulation produces artifacts instead of converging.

- **`RepeatWrapping` on 3D texture**: Essential because the scattering node uses `.mod(1)` on UV coordinates — without repeat wrapping, you get hard seams at volume boundaries.

- **`unpackAlignment = 1`**: Required for `RedFormat` single-byte-per-texel textures. Default alignment of 4 causes row stride mismatch on non-power-of-4 widths.

- **`transparent = true` + `AdditiveBlending`**: The volumetric material must be transparent so it's excluded from the depth pre-pass but included in the scene pass. Additive blending makes fog brighten with light accumulation (physically motivated for in-scattering).

- **DPR intentionally disabled**: The line `renderer.setPixelRatio( window.devicePixelRatio )` is commented out. At retina resolutions, the multi-pass pipeline (depth + scene + TRAA) would be very expensive.

- **`shadow.intensity = 0.98`**: Not 1.0 — a subtle trick to prevent fully black shadows, which look unrealistic in volumetric scenes where ambient scattering would always provide some fill light.

- **Spotlight `.map`**: A color texture is used as a spotlight projection map (`colors.png`), creating colored volumetric light cones — a simple way to get visually interesting beams.

- **`smokeAmount.mix(1, density)`**: When `smokeAmount` is 0, returns 1 (uniform fog with no noise variation). When `smokeAmount` is high, noise contrast increases. This is the opposite of a typical lerp — it mixes between "no noise" and "full noise."

---

## 4. Performance Considerations

| Aspect | Detail |
|--------|--------|
| **Ray march steps** | Default 12, adjustable 2–16 via GUI. Fewer steps = faster but more banding (TRAA compensates). |
| **DPR disabled** | Rendering at 1x device pixels rather than 2x/3x retina. The multi-pass pipeline (3 full-screen passes) makes high DPR very costly. |
| **3D texture size** | 128^3 = 2MB (single channel). Small enough to fit in texture cache for repeated sampling. |
| **3 texture3D samples per fragment** | The scattering node samples the 3D texture 3 times per ray step. At 12 steps, that's 36 texture reads per pixel — the main shader bottleneck. |
| **MRT (Multiple Render Targets)** | The scene pass writes color + velocity in a single draw call instead of two separate passes — saves an entire scene traversal. |
| **Depth pre-pass for early termination** | Volumetric rays stop at opaque surfaces, avoiding wasted march steps behind geometry. |
| **TRAA vs raw quality** | TRAA lets you use very few ray-march steps (even 2–4) while still getting smooth results through temporal accumulation. The trade-off is ghosting on fast motion. |
| **Animation toggle** | The `animated` flag can freeze animation time, which in a production context would let TRAA fully converge to a clean image for static scenes. |
