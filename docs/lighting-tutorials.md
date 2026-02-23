# Three.js Lighting Tutorials (2025-2026)

Curated collection of contemporary lighting tutorials focusing on stylized, moody, and atmospheric effects.

---

## Post-Processing & Bloom

### 1. Post-processing Guide - Sangil Lee
- **URL:** https://sangillee.com/webgl/post-processing/
- **Year:** 2025
- **Description:** Comprehensive overview of Three.js post-processing, covering `EffectComposer`, `RenderPass`, and `BloomPass` for glowing effects.
- **Relevance:** Essential for emissive glow, neon, and cyberpunk aesthetics.

### 2. Glowing Sphere Particles With Shadow Map
- **Platform:** YouTube
- **Year:** 2025
- **Description:** Creates glowing spheres using `instancedMesh`, `pointLight` shadow maps, and Unreal Bloom effect.
- **Relevance:** Combines emissive materials, glow, and shadows for moody scenes.

### 3. Neon Lights in Three.js & React Three Fiber (Devlog #1)
- **Platform:** YouTube
- **Year:** 2025
- **Description:** 3D neon lights with R3F, post-processing bloom for vibrant atmospheric scenes.
- **Relevance:** Direct TRON/cyberpunk style implementation.

---

## Volumetric & Atmospheric

### 4. Volumetric Lighting in WebGPU
- **URL:** https://discourse.threejs.org/
- **Year:** 2025
- **Description:** Advanced volumetric techniques including directional light integration, Mie/Rayleigh scattering, multiple scattering.
- **Relevance:** Crucial for moody, atmospheric effects like god rays.

### 5. Dynamic Atmospheric Lighting for Procedural Worlds
- **Platform:** Reddit r/threejs
- **Year:** 2026
- **Description:** Time-of-day based lighting, coordinate-based atmosphere for procedural worlds.
- **Relevance:** Dynamic mood and atmosphere generation.

### 6. HemisphereLight + DirectionalLight (Crisp Shadows)
- **Platform:** YouTube
- **Year:** 2025
- **Description:** Professional lighting setup with `HemisphereLight` for ambient fill, `DirectionalLight` for key, fog for depth.
- **Relevance:** Foundation for atmospheric depth and mood.

---

## IES & Light Probes

### 7. Three.js IES Spot Light (WebGPU Example)
- **URL:** https://threejs.org/examples/#webgpu_lights_ies_spotlight
- **Year:** 2025/2026
- **Description:** Official example of `IESSpotLight` with IES texture files in WebGPU renderer.
- **Relevance:** Precise light distribution for architectural/atmospheric scenes.

### 8. LightProbe Documentation
- **URL:** https://threejs.org/docs/#api/en/lights/LightProbe
- **Year:** Current
- **Description:** Official docs for `LightProbe` - indirect lighting and reflections with cube textures.
- **Relevance:** Advanced ambient lighting tricks.

---

## Comprehensive Guides

### 9. Mastering Three.js Lighting - Dipankar Paul
- **URL:** https://iamdipankarpaul.com/blog/mastering-threejs-lighting/
- **Year:** 2026
- **Description:** Comprehensive guide covering all light types and mood manipulation.
- **Relevance:** Modern (2026) foundational resource.

### 10. Three.js Journey (Platform)
- **URL:** https://threejs-journey.com/
- **Year:** 2025 (copyright)
- **Description:** Platform with detailed lessons on lighting types and techniques.
- **Relevance:** Comprehensive course with intermediate/advanced content.

---

## Additional Resources to Explore

| Source | Focus Area | URL Pattern |
|--------|------------|-------------|
| **SimonDev** | Custom shaders, game tech | youtube.com/@simondev |
| **Wessles** | Creative coding | Various platforms |
| **Poimandres** | R3F ecosystem | pmnd.rs |
| **kdhrubo** | Three.js blog | blog.kdhrubo.me |
| **DiscoverThreeJS** | Tutorials | discoverthreejs.com |

---

## Techniques to Apply to Terraform Town

Based on these tutorials, recommended implementations:

1. **UnrealBloomPass** - Add bloom for TRON glow effect
2. **Fog** - Add depth and atmosphere
3. **IES profiles** - For precise light shaping on larger scenes
4. **Custom decay curves** - Stylized falloff (already implemented)
5. **LightProbe** - For ambient reflections in metallic ground

---

## Implementation Priority for Terraform Town

| Priority | Technique | Why |
|----------|-----------|-----|
| 1 | UnrealBloomPass | Essential for TRON aesthetic |
| 2 | Fog (linear/exp2) | Atmospheric depth |
| 3 | Custom shader decay | Stylized edges (done) |
| 4 | LightProbe | Ambient reflections |
| 5 | Volumetric lights | Future enhancement |
