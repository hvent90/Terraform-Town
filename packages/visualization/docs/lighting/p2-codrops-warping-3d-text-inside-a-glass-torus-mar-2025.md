**5. Codrops — "Warping 3D Text Inside a Glass Torus" (Mar 2025)**
Deep dive into MeshTransmissionMaterial (built on MeshPhysicalMaterial), exploring how transmission, IOR, and resolution fields control how much light passes through for refraction effects. Moody glass-refraction lighting.

---

## Deep Dive

# Warping 3D Text Inside a Glass Torus — Extracted Notes

## Code Snippets & Implementations

### Animation Setup with GSAP (React Three Fiber)

```javascript
// Two-phase animation: pause and oscillation
// IOR oscillates between 1.07 (min) and 1.5 (max)
useFrame(() => {
  // Phase 1: Pause state
  // Phase 2: Oscillation with "woosh" effect
  // Uses basic math to transition between min/max IOR values
});

// Animate IOR using GSAP over time
gsap.to(materialRef.current, {
  ior: targetValue,
  duration: animationDuration
});
```

### MeshTransmissionMaterial Configuration (Drei)

```javascript
const materialConfig = {
  samples: 10,              // Refraction sample count
  resolution: 256,          // Render texture resolution
  transmission: 0.95,       // Light transmission (0.0–1.0)
  roughness: 0.2,           // Surface roughness
  ior: 1.25,                // Index of refraction
  thickness: 2.0,           // Light travel depth
  chromaticAberration: 0.1, // Color dispersion
  anisotropy: 0.5,          // Directional blur
  distortion: 0.2,          // Light wave bending
  distortionScale: 0.5,     // Distortion frequency
  temporalDistortion: 0.1   // Animation distortion
};
```

---

## Key Techniques & Patterns

### 1. Transmission Materials & Light Refraction
- Works by layering shaders on top of Three.js `MeshPhysicalMaterial`
- Simulates light bending through transparent materials
- Requires environment lighting — without it, the material looks dull/flat
- Performs a **separate render pass** per transmission object (unlike simple opacity)

### 2. Index of Refraction (IOR)

| Material | IOR Value |
|----------|-----------|
| Air      | 1.0003    |
| Water    | 1.333     |
| Diamond  | 2.42      |

Higher IOR = stronger distortion and magnification. This is the "secret sauce" for positioning text inside the torus — the IOR warps the text visually into place.

### 3. Chromatic Aberration
Simulates color dispersion where different wavelengths bend at different angles. Creates subtle rainbow effects at edges. Range: `0.0` (minimal) to `1.0` (exaggerated).

### 4. Anisotropy + Roughness = Frosted Glass
Combines directional blur with roughness for a frosted/streaked glass look. Higher roughness diffuses anisotropic reflections.

### 5. Distortion Wave Properties
Three complementary properties for wavy/heat-haze effects:
- **`distortion`** — primary warping control
- **`distortionScale`** — size/frequency of waves
- **`temporalDistortion`** — animation timing

A well-balanced combination creates stunning water-like refraction *without* needing `useFrame`.

---

## Practical Tips & Gotchas

1. **Dull initial appearance** — Adding `MeshTransmissionMaterial` without environment mapping produces a very flat result. You *must* add environment lighting for it to look right.

2. **`roughness: 1.0` makes the material invisible** — At full roughness, light scatters completely; no light passes through, eliminating reflections entirely.

3. **`thickness` has no effect when `ior === 1.0`** — Thickness only matters when light actually bends inside the material (IOR > 1.0).

4. **The text-inside-torus trick is IOR-driven** — The text isn't literally positioned inside; the IOR distortion makes it *appear* warped inside.

---

## Performance Considerations

**Transmission is expensive.** Each transmission object triggers a full separate render pass.

- Multiple transmission objects = multiple full scene re-renders → performance bottleneck with increased draw calls
- **`samples`**: Default `10` balances quality/perf. Higher = smoother refraction but more shader work per sample.
- **`resolution`**: Controls the render texture size. Lowering to `128–256` reduces cost (and can create an intentional pixelated aesthetic — no custom shader needed).
- **Mitigation**: Reduce `samples` or `resolution` when using multiple transmission materials.

---

## Library Stack

| Library | Role |
|---------|------|
| **Drei** | Provides `MeshTransmissionMaterial` |
| **React Three Fiber** | React renderer for Three.js |
| **Three.js** | Base 3D engine |
| **GSAP** | Animation tweening |

> Note: The WebFetch extraction likely condensed some inline code. The article's full demo source may contain more complete shader/scene setup code — check the [original article](https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/) or its linked GitHub repo for the complete implementation.
