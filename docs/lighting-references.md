# Three.js Lighting References — Master Index

Curated collection of 28 cutting-edge tutorials and articles (2025-2026) for stylized, moody, atmospheric lighting.

---

## Quick Navigation

| Category | Count | Best For |
|----------|-------|----------|
| [Cutting-Edge TSL/WebGPU](#cutting-edge-tslwebgpu) | 11 | Future-proof techniques |
| [Post-Processing & Bloom](#post-processing--bloom) | 4 | Glow effects |
| [Volumetric & God Rays](#volumetric--god-rays) | 5 | Atmospheric beams |
| [Fog & Atmosphere](#fog--atmosphere) | 2 | Depth and mood |
| [PBR & Realistic](#pbr--realistic) | 4 | Photorealism |
| [Courses & References](#courses--references) | 6 | Comprehensive learning |

---

## Cutting-Edge TSL/WebGPU

| # | Title | Date | Focus |
|---|-------|------|-------|
| 01 | [Maxime Heckel — Field Guide to TSL and WebGPU](./lighting/01-maxime-heckel-tsl-webgpu.md) | Oct 2025 | TSL, positionNode, normalNode |
| 02 | [Three.js Roadmap — TSL: A Better Way to Write Shaders](./lighting/02-threejs-roadmap-tsl-shaders.md) | Dec 2025 | colorNode, PBR integration |
| 03 | [Codrops — Dissolve Effect with Shaders and Particles](./lighting/03-codrops-dissolve-shaders-particles.md) | Feb 2025 | Selective bloom, CubeMaps |
| 04 | [Codrops — Procedural Vortex Inside Glass Sphere](./lighting/04-codrops-vortex-glass-sphere.md) | Mar 2025 | Emission nodes, fog, god rays |
| 05 | [Codrops — Warping 3D Text Inside Glass Torus](./lighting/05-codrops-glass-torus-text.md) | Mar 2025 | MeshTransmissionMaterial, IOR |
| 06 | [Codrops — Interactive Text Destruction](./lighting/06-codrops-text-destruction-webgpu.md) | Jul 2025 | WebGPU, PMREMGenerator |
| 07 | [Codrops — 3D Weather Visualization with R3F](./lighting/07-codrops-weather-r3f.md) | Sep 2025 | Lightning, storms, particles |
| 08 | [Codrops — Scroll-Driven 3D Carousel](./lighting/08-codrops-carousel-post-processing.md) | Dec 2025 | Chromatic aberration, distortion |
| 09 | [Codrops — Blended Material Shader](./lighting/09-codrops-blended-material-performance.md) | Aug 2025 | Performance (6 lights → 2, 4x faster) |
| 10 | [Utsubo — Migrate to WebGPU](./lighting/10-utsubo-webgpu-migration.md) | Jan 2026 | TSL bloom, modern post-processing |
| 11 | [Dipankar Paul — Mastering Three.js Lighting](./lighting/11-dipankar-paul-mastering-lighting.md) | Jan 2026 | 3-point cinematic lighting |

---

## Post-Processing & Bloom

| # | Title | Date | Focus |
|---|-------|------|-------|
| 12 | [Wael Yasmina — Ultra-Realistic Scenes](./lighting/12-wael-yasmina-ultra-realistic.md) | 2025 | HDR, tone mapping, MeshPhysicalMaterial |
| 13 | [Wael Yasmina — Selective Unreal Bloom](./lighting/13-wael-yasmina-selective-bloom.md) | 2025 | Layer-based selective bloom |
| 14 | [Needle Engine — FastHDR Environment Maps](./lighting/14-needle-fasthdr.md) | Aug 2025 | 10× faster HDR, 95% less memory |
| 15 | [Sangillee — Post-Processing & Selective Bloom](./lighting/15-sangillee-post-processing.md) | Jan 2025 | EffectComposer, full code |

---

## Volumetric & God Rays

| # | Title | Date | Focus |
|---|-------|------|-------|
| 16 | [Codrops — Volumetric Light Rays](./lighting/16-codrops-volumetric-god-rays.md) | Jun 2022 | Fragment shader god rays (classic) |
| 17 | [Three.js Demos — Volumetric Light Shafts](./lighting/17-threejsdemos-volumetric-shafts.md) | Current | Fake volumetrics, interactive |
| 26 | [Maxime Heckel — Volumetric Lighting with Raymarching](./lighting/26-maxime-heckel-volumetric-raymarching.md) | Jun 2025 | SDF, blue noise, TRAA |
| 27 | [Three.js Official — Volumetric Lighting with TRAA](./lighting/27-threejs-official-volumetric-traa.md) | Feb 2026 | WebGPU, god rays, official |

---

## Fog & Atmosphere

| # | Title | Date | Focus |
|---|-------|------|-------|
| 18 | [Sneha Belkhale — Three.js Fog Hacks](./lighting/18-sneha-belkhale-fog-hacks.md) | 2025 | onBeforeCompile, custom fog |
| 25 | [Three.js Forum — Architectural Ambience](./lighting/25-threejs-forum-architectural-ambience.md) | Feb 2026 | Baked lighting, HDRI-only |

---

## PBR & Realistic

| # | Title | Date | Focus |
|---|-------|------|-------|
| 19 | [Erichlof — PathTracing Renderer](./lighting/19-erichlof-path-tracing.md) | Aug 2025 | Real-time path tracing 30-60fps |
| 24 | [Discover Three.js — PBR & Ambient](./lighting/24-discover-threejs-pbr.md) | Current | PBR theory, ambient lighting |
| 28 | [Medium — Enlightening 3D Worlds](./lighting/28-medium-enlightening-3d-worlds.md) | 2025 | Light types, shadow mapping |

---

## Courses & References

| # | Title | Date | Focus |
|---|-------|------|-------|
| 20 | [Three.js Journey](./lighting/20-threejs-journey.md) | 2025 | Comprehensive course ($95) |
| 21 | [Sean Bradley — TSL + Light Types](./lighting/21-sean-bradley-tsl-lights.md) | 2025 | All lights, TSL workflow |
| 22 | [Wawa Sensei — WebGPU/TSL](./lighting/22-wawa-sensei-webgpu-tsl.md) | 2025 | R3F + WebGPU |
| 23 | [Three.js Demos](./lighting/23-threejsdemos.md) | Current | Interactive demos with code |

---

## Recommended Reading Order

### For Terraform Town (TRON-style)

1. **[13 - Selective Bloom](./lighting/13-wael-yasmina-selective-bloom.md)** — Make specific objects glow
2. **[15 - Post-Processing](./lighting/15-sangillee-post-processing.md)** — EffectComposer setup
3. **[10 - TSL Bloom](./lighting/10-utsubo-webgpu-migration.md)** — Future-proof approach
4. **[18 - Fog Hacks](./lighting/18-sneha-belkhale-fog-hacks.md)** — Atmospheric depth
5. **[11 - Cinematic Lighting](./lighting/11-dipankar-paul-mastering-lighting.md)** — 3-point setup

### For Advanced Effects

1. **[01 - TSL Guide](./lighting/01-maxime-heckel-tsl-webgpu.md)** — Future of Three.js
2. **[26 - Volumetric Raymarching](./lighting/26-maxime-heckel-volumetric-raymarching.md)** — God rays from scratch
3. **[27 - Official Volumetric](./lighting/27-threejs-official-volumetric-traa.md)** — Production WebGPU

---

## Expert Recommendation

> "The Codrops articles are probably your best bet for the moody/stylized vibe — they consistently showcase creative developers doing atmospheric, cinematic work with modern Three.js. The TSL/WebGPU resources from Maxime Heckel and Three.js Roadmap are where the ecosystem is heading in 2026."

---

## Tags Index

| Tag | References |
|-----|------------|
| `#tsl` | 01, 02, 04, 06, 10, 21, 22 |
| `#webgpu` | 01, 06, 10, 22, 27 |
| `#bloom` | 03, 10, 13, 15 |
| `#volumetric` | 16, 17, 26, 27 |
| `#fog` | 04, 18 |
| `#atmospheric` | 04, 07, 18, 25 |
| `#pbr` | 02, 12, 24, 28 |
| `#cinematic` | 08, 11 |
| `#performance` | 09, 14 |
| `#course` | 20, 21, 22 |

---

## Stats

- **Total references:** 28
- **Date range:** 2022-2026
- **Most from:** 2025-2026
- **Top sources:** Codrops (9), Maxime Heckel (2), Wael Yasmina (2)
