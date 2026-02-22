**12. Wael Yasmina — "Ultra-Realistic Scenes in Three.js"**
Covers HDR, tone mapping, color space, gamma correction, and MeshPhysicalMaterial with IOR, transmission, and environment maps for photorealistic results.

---

## Deep Dive

# Ultra-Realistic Scenes in Three.js — Full Extraction

## Key Techniques & Concepts

### Dynamic Range
- **Dynamic range** = a sensor's ability to represent the full spectrum of light. Wider range captures more detail in shadows and highlights.
- Standard photos lose information in extreme bright/dark areas; HDR preserves it.

### HDR (High Dynamic Range) Workflow
- Achieved by taking multiple photos at different exposures and merging them in software.
- Stored as `.hdr` or `.exr` files.
- **Gotcha:** `.exr` and `.hdr` files are *significantly larger* than `.jpg`/`.png` due to uncompressed data.

### Tone Mapping
- HDR images are 16 or 32 bits, but monitors display 8–10 bits. Tone mapping compresses the range while preserving detail.
- Three.js provides built-in algorithms; **`ACESFilmicToneMapping`** is recommended.
- `toneMappingExposure` controls brightness (article uses `1.8`).

### Gamma Correction
- Human eyes perceive light nonlinearly (doubling light sources ≠ perceived double intensity).
- `.jpg`/`.png` files are pre-corrected (brighter than they appear in linear space).
- `.exr`/`.hdr` files are saved in **linear format** — no inverse curve applied.
- Renderers need linear workflow for accurate pixel color calculations.

### Color Space (sRGB)
- sRGB = "Standard Red Green Blue" — a subset of human-perceivable colors.
- Gamma correction maps original colors into this subset.

---

## Code Snippets

### 1. Loading an HDR Environment Map

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const rgbeLoader = new RGBELoader();

rgbeLoader.load('/env_map.hdr', function (texture) {
  // texture ready for use
});
```

Use `RGBELoader` instead of `TextureLoader` — HDR files require specialized handling for high bit-depth.

### 2. Setting Background & Mapping

```javascript
scene.background = texture;
texture.mapping = THREE.EquirectangularReflectionMapping;
```

Maps a 360-degree HDR image to spherical coordinates, creating a surrounding environment.

### 3. Renderer Color/Tone Configuration

```javascript
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;
```

Modern Three.js sets `outputColorSpace` by default, but older versions required manual correction to avoid incorrect colors.

### 4. Environment Map — Scene-Wide vs. Per-Material

**Scene-wide** (affects all materials):
```javascript
scene.environment = texture;
```

**Per-material** (selective control):
```javascript
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2, 50, 50),
    new THREE.MeshStandardMaterial({
      color: 0xffea00,
      envMap: texture
    })
);
sphere.position.x = -2.5;
scene.add(sphere);
```

### 5. Realistic Metal

```javascript
new THREE.MeshStandardMaterial({
    roughness: 0,
    envMap: texture,
    color: 0xffea00,
})
```

- Lowering `roughness` adds reflections.
- Increasing `metalness` further boosts reflectivity.

### 6. Realistic Glass

```javascript
const sphere2 = new THREE.Mesh(
    new THREE.SphereGeometry(2, 50, 50),
    new THREE.MeshPhysicalMaterial({
      roughness: 0,
      metalness: 0,
      transmission: 1,
      ior: 2.33,
      envMap: texture
    })
);
sphere2.position.x = 2.5;
scene.add(sphere2);
```

- Requires **`MeshPhysicalMaterial`** (not Standard).
- Both `metalness` and `roughness` must be `0`.
- `transmission: 1` for full transparency.
- `ior` (index of refraction) should be between **1 and 2.333**.

---

## Practical Tips & Gotchas

| Tip | Detail |
|-----|--------|
| **No lights = black objects** | Without light sources or `scene.environment`, materials render as black holes. Fix by setting `scene.environment = texture`. |
| **Material choice matters** | `MeshStandardMaterial` for basic reflections; `MeshPhysicalMaterial` for advanced effects (glass, transmission). |
| **Exposure tuning** | `toneMappingExposure` value depends on the specific HDR source — adjust per scene. |
| **File sizes** | HDR/EXR files are much larger than JPG/PNG — impacts load times. |
| **IOR range** | Index of refraction should stay between 1.0 and 2.333 for physically plausible results. |
| **Boilerplate** | Author recommends their [Three.js boilerplate](https://github.com/WaelYasmina/ThreeBoilerplate) for quick setup. |

## Performance Considerations

The article does not cover explicit performance optimization. The only indirect consideration: **HDR/EXR file sizes** are significantly larger than compressed alternatives, which impacts loading time. No mitigation strategies (e.g., PMREM generation, compressed KTX2 textures) are discussed.
