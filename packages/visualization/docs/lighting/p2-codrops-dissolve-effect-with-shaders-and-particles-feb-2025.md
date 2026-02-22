**3. Codrops — "Dissolve Effect with Shaders and Particles" (Feb 2025)**
Walks through environment/lighting setup, selective Unreal Bloom, and why CubeMaps are ideal for applying bloom without creating overexposed highlights compared to HDRI lighting. Very moody — glowing dissolve edges with particles.

---

## Deep Dive

# Dissolve Effect with Shaders and Particles in Three.js

## Overview

This tutorial builds a zombie-dissolution effect in Three.js through four phases: environment setup, dissolve shader, particle system, and selective bloom.

---

## 1. Environment & Lighting Setup

**Key insight:** CubeMaps are preferred over HDRI when using bloom effects. HDRI causes excessive reflections that bloom amplifies uncontrollably, while CubeMaps simulate environmental lighting without introducing bright direct light sources.

---

## 2. Dissolve Effect (Perlin Noise + Shader Injection)

### Noise Fundamentals

Perlin noise produces **continuous** output for natural-looking transitions (unlike random values). Two controls:

- **Amplitude** — scales intensity. Noise outputs `[-1,1]`, amplitude of 10 → `[-10,10]`
- **Frequency** — higher = more intricate dissolve patterns

### Three-Zone Fragment Logic

Each fragment falls into one of:

1. **Discard zone:** `noiseValue < uProgress` → fragment discarded
2. **Edge zone:** `uProgress < noiseValue < uProgress + uEdge` → colored with `uEdgeColor`
3. **Original material** → untouched

### Fragment Shader Implementation

Injected by replacing `#include <dithering_fragment>` in Three.js standard materials:

```glsl
shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
    #include <dithering_fragment>        
    
    float noise = cnoise(vPos * uFreq) * uAmp;
    
    if(noise < uProgress) discard;
    
    float edgeWidth = uProgress + uEdge;
    if(noise > uProgress && noise < edgeWidth){
        gl_FragColor = vec4(vec3(uEdgeColor), noise);
    }
    
    gl_FragColor = vec4(gl_FragColor.xyz, 1.0);
`);
```

---

## 3. Particle System

### Setup — ShaderMaterial with Custom Attributes

**Vertex shader** — size inversely proportional to camera distance:

```glsl
void main(){
    vec3 viewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_PointSize = uBaseSize / -viewPosition.z;
}
```

**Fragment shader** — particles only render in the edge zone (matching the mesh dissolve):

```glsl
uniform vec3 uColor;
uniform float uEdge;
uniform float uProgress;

varying float vNoise;
 
void main(){
    if( vNoise < uProgress ) discard;
    if( vNoise > uProgress + uEdge) discard;

    gl_FragColor = vec4(uColor, 1.0);
}
```

### Attribute Arrays

```javascript
let particleCount = meshGeo.attributes.position.count;
let particleMaxOffsetArr: Float32Array;    // max distance from origin
let particleInitPosArr: Float32Array;      // initial positions
let particleCurrPosArr: Float32Array;      // current positions
let particleVelocityArr: Float32Array;     // velocity vectors
let particleSpeedFactor = 0.02;
```

### Initialization

```javascript
function initParticleAttributes() {
    particleMaxOffsetArr = new Float32Array(particleCount);
    particleInitPosArr = new Float32Array(meshGeo.getAttribute('position').array);
    particleCurrPosArr = new Float32Array(meshGeo.getAttribute('position').array);
    particleVelocityArr = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        let x = i * 3 + 0;
        let y = i * 3 + 1;
        let z = i * 3 + 2;

        particleMaxOffsetArr[i] = Math.random() * 1.5 + 0.2;

        particleVelocityArr[x] = 0;
        particleVelocityArr[y] = Math.random() + 0.01;
        particleVelocityArr[z] = 0;
    }

    setParticleAttributes();
}
```

### Per-Frame Update with Recycling

```javascript
function updateParticleAttributes() {
    for (let i = 0; i < particleCount; i++) {
        let x = i * 3 + 0;
        let y = i * 3 + 1;
        let z = i * 3 + 2;

        particleCurrPosArr[x] += particleVelocityArr[x] * particleSpeedFactor;
        particleCurrPosArr[y] += particleVelocityArr[y] * particleSpeedFactor;
        particleCurrPosArr[z] += particleVelocityArr[z] * particleSpeedFactor;

        const vec1 = new THREE.Vector3(particleInitPosArr[x], particleInitPosArr[y], particleInitPosArr[z]);
        const vec2 = new THREE.Vector3(particleCurrPosArr[x], particleCurrPosArr[y], particleCurrPosArr[z]);
        const dist = vec1.distanceTo(vec2);

        if (dist > particleMaxOffsetArr[i]) {
            particleCurrPosArr[x] = particleInitPosArr[x];
            particleCurrPosArr[y] = particleInitPosArr[y];
            particleCurrPosArr[z] = particleInitPosArr[z];
        }
    }

    setParticleAttributes();
}
```

### Wave-Like Motion (Stacked Sine Waves)

Combines multiple sine waves at different frequencies for organic, non-repetitive movement:

```javascript
function calculateWaveOffset(idx: number) {
    const posx = particleCurrPosArr[idx * 3 + 0];
    const posy = particleCurrPosArr[idx * 3 + 1];

    let xwave1 = Math.sin(posy * 2) * (0.8 + particleData.waveAmplitude);
    let ywave1 = Math.sin(posx * 2) * (0.6 + particleData.waveAmplitude);

    let xwave2 = Math.sin(posy * 5) * (0.2 + particleData.waveAmplitude);
    let ywave2 = Math.sin(posx * 1) * (0.9 + particleData.waveAmplitude);

    return { xwave: xwave1 + xwave2, ywave: ywave1 + ywave2 }
}

// Applied in the update loop:
let { xwave, ywave } = calculateWaveOffset(idx);
vx += xwave;
vy += ywave;
```

### Distance-Based Size Shrinking

Particles shrink as they travel farther from their origin:

```javascript
// Initialize
particleDistArr[i] = 0.001;

// Update each frame
const dist = vec1.distanceTo(vec2);
particleDistArr[i] = dist;
```

```glsl
// Vertex shader
float size = uBaseSize * uPixelDensity;
size = size / (aDist + 1.0);
gl_PointSize = size / -viewPosition.z;
```

### Rotating Textured Particles

```glsl
// Fragment shader with rotation + texture sampling
uniform vec3 uColor;
uniform float uEdge;
uniform float uProgress;
uniform sampler2D uTexture;

varying float vNoise;
varying float vAngle;

void main(){
    if( vNoise < uProgress ) discard;
    if( vNoise > uProgress + uEdge) discard;

    vec2 coord = gl_PointCoord;
    coord = coord - 0.5;                    // shift pivot to center
    coord = coord * mat2(cos(vAngle), sin(vAngle), -sin(vAngle), cos(vAngle));
    coord = coord + 0.5;                    // shift back

    vec4 texture = texture2D(uTexture, coord);

    gl_FragColor = vec4(vec3(uColor.xyz * texture.xyz), 1.0);
}
```

```javascript
// Required material settings
particleMat.transparent = true;
particleMat.blending = THREE.AdditiveBlending;
```

---

## 4. Selective Bloom (Two-Pass Rendering)

```javascript
// Pass 1: bloom only (black background isolates bloom targets)
scene.background = new THREE.Color(0x000000);
bloomComposer.render();

// Pass 2: combine base + bloom
scene.background = originalBackground;
finalComposer.render();
```

The final shader blends `tDiffuse` (base) with the bloom texture. Bloom only affects the dissolving edge, not the environment.

---

## Practical Tips & Gotchas

| Tip | Detail |
|-----|--------|
| **uProgress range** | Must extend slightly beyond noise output range (e.g., beyond `[-1,1]`) to allow full dissolve/reverse |
| **Shader injection point** | Replace at `#include <dithering_fragment>` to hook into standard materials without rewriting them |
| **Texture rotation pivot** | The 3-step shift→rotate→shift is mandatory. Skipping it rotates around the bottom-left corner, not center |
| **Additive blending** | Must set `transparent = true` AND `blending = THREE.AdditiveBlending`, or particles won't glow/accumulate |
| **CubeMaps > HDRI for bloom** | HDRI causes overblown reflections when bloom is applied; CubeMaps keep it controlled |
| **Particle recycling** | Reset particles when they exceed `maxOffset` — prevents unbounded drift, memory growth, and perf degradation |

---

## Performance Considerations

- **Attribute updates** run every frame but only touch the visible portion of arrays
- **Fragment discard** is fast but not free — early discards in the edge zone help
- **Particle count** is bounded by vertex buffer size; test on target hardware
- **Two EffectComposer passes** for bloom — monitor GPU cost
- **GLSL `cnoise()`** per-pixel is acceptable performance-wise, but frequency/amplitude affect workload
