**18. Sneha Belkhale — "Three.js Fog Hacks"**
Shows how to replace fog shader chunks via `onBeforeCompile` while keeping integration with scene lights and properties — custom fog that goes beyond `FogExp2`.

---

## Deep Dive

Medium blocked direct fetching (403), and archive.org was also blocked. I was able to gather substantial information from the companion [StackBlitz project](https://stackblitz.com/edit/threejs-fog-hacks) and search result descriptions, but I could not extract the **exact code snippets** from the article text. Here's what I recovered:

---

# Three.js Fog Hacks — Sneha Belkhale

*Source: [Medium article](https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386) | [StackBlitz demo](https://stackblitz.com/edit/threejs-fog-hacks)*

## Core Technique: Shader Chunk Replacement via `onBeforeCompile`

The central pattern is intercepting Three.js material compilation to replace the built-in fog shader chunks with custom ones. The four relevant chunks are:

| Chunk | Purpose |
|---|---|
| `fog_pars_vertex` | Declares fog varyings/uniforms in vertex shader |
| `fog_vertex` | Computes fog depth in vertex shader |
| `fog_pars_fragment` | Declares fog uniforms + noise functions in fragment shader |
| `fog_fragment` | Applies fog color blending in fragment shader |

You replace them using `material.onBeforeCompile`:

```js
material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <fog_pars_vertex>', fogParsVert)
    .replace('#include <fog_vertex>', fogVert);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <fog_pars_fragment>', fogParsFrag)
    .replace('#include <fog_fragment>', fogFrag);

  // Add custom uniforms
  shader.uniforms.fogNearColor = { value: new THREE.Color(...) };
  shader.uniforms.fogNoiseFreq = { value: 0.0012 };
  shader.uniforms.fogNoiseSpeed = { value: 100 };
  shader.uniforms.fogNoiseImpact = { value: 0.5 };
  shader.uniforms.time = { value: 0 };
};
```

## Hack 1: Multi-Color Fog

Instead of a single `fogColor`, use **two colors** — a near color and a horizon/far color — and blend between them based on the fog factor:

```glsl
// In fog_pars_fragment replacement
uniform vec3 fogNearColor;

// In fog_fragment replacement
float fogFactor = 1.0 - exp(-fogDensity * fogDensity * fogDepth * fogDepth);
fogFactor = clamp(fogFactor, 0.0, 1.0);
vec3 fogMix = mix(fogNearColor, fogColor, fogFactor);
gl_FragColor.rgb = mix(gl_FragColor.rgb, fogMix, fogFactor);
```

## Hack 2: Noisy Fog (Perlin Noise)

Apply a 3D Perlin noise function to the fog depth so density varies spatially, mimicking real fog with patches of varying density:

```glsl
// In fog_pars_fragment — includes a Perlin noise function (cnoise)
uniform float fogNoiseFreq;
uniform float fogNoiseSpeed;
uniform float fogNoiseImpact;
uniform float time;

// In fog_fragment
vec3 windDir = vec3(1.0, 0.0, 0.0); // scrolling direction
vec3 scrollPos = vFogWorldPosition.xyz + windDir * time * fogNoiseSpeed;
float noise = cnoise(scrollPos * fogNoiseFreq);
float noisyDepth = fogDepth + noise * fogNoiseImpact;
float fogFactor = 1.0 - exp(-fogDensity * fogDensity * noisyDepth * noisyDepth);
```

## Hack 3: Dynamic Movement

The fog noise scrolls over time using a `time` uniform updated each frame:

```js
// In animation loop
shader.uniforms.time.value = clock.getElapsedTime();
```

The world position is passed from vertex to fragment shader via a varying:

```glsl
// fog_pars_vertex replacement
varying float fogDepth;
varying vec3 vFogWorldPosition;

// fog_vertex replacement
fogDepth = -mvPosition.z;
vFogWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
```

## Key Project Structure (from StackBlitz)

| File | Role |
|---|---|
| `index.js` | Scene setup, 256x256 Perlin terrain, FirstPersonControls, dat.gui for fog params |
| `FogReplace.js` | Exports 4 shader chunk strings: `fogParsVert`, `fogVert`, `fogParsFrag`, `fogFrag` |
| `PerlinNoise.js` | Classic Perlin 3D noise (Stefan Gustavson) as GLSL string for injection |

## Practical Tips & Gotchas

1. **Debugging shader chunks**: Intentionally insert invalid GLSL (e.g., a syntax error) into your replacement string — the browser console will print the **full compiled shader** with all chunks resolved, letting you see exactly what's happening.

2. **Learn the chunk system**: Go to the Three.js GitHub repo and read the shader chunks that compose each material. Understand what `#define`s, varyings, and uniforms exist before replacing chunks.

3. **`fogDensity` vs `fogNear`/`fogFar`**: The article uses `FogExp2` (exponential squared fog) which uses `fogDensity`. Standard `Fog` uses `fogNear`/`fogFar` for linear interpolation. Your replacement code must match the fog type you're using.

4. **`onBeforeCompile` caching**: Three.js caches compiled shaders. If you change uniforms after initial compilation, make sure they're set on the `shader` object reference you captured, not on a new one.

## Performance Considerations

- **Perlin noise in fragment shader** runs per-pixel — on high-resolution displays or large viewports, this can be expensive. The `fogNoiseFreq` parameter controls the noise frequency; lower values = larger fog patches = visually similar with potentially fewer visible artifacts if you downsample.
- The StackBlitz demo uses `stats.js` for FPS monitoring, suggesting performance is a concern the author tracked.
- The terrain is 256x256 vertices — a moderate polygon count chosen to demonstrate the effect without GPU bottlenecks.

---

**Limitation**: I could not fetch the full Medium article text (403 blocked). The code above is reconstructed from the StackBlitz project descriptions and search metadata. For the exact article prose and code formatting, you'll need to open the [original article](https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386) directly in a browser.
