**14. Needle Engine — "FastHDR Environment Maps" (Aug 2025)**
HDR environments in FastHDR format load 10× faster than EXR and use roughly 95% less GPU memory — cutting-edge IBL optimization for production scenes.

---

## Deep Dive

# FastHDR Environment Maps

## Code Snippets & Implementations

### Needle Engine (simplest integration)

```html
<needle-engine
  background-image="https://cdn.needle.tools/static/hdris/ballroom_2k.pmrem.ktx2"
  environment-image="https://cdn.needle.tools/static/hdris/ballroom_2k.pmrem.ktx2">
</needle-engine>
```

### three.js with FastHDR (KTX2)

```javascript
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { CubeUVReflectionMapping } from 'three';

const loader = new KTX2Loader();
loader.setTranscoderPath('three/examples/js/libs/basis/');
loader.detectSupport(renderer);
loader.load('https://cdn.needle.tools/static/hdris/ballroom_2k.pmrem.ktx2', (texture) => {
    texture.mapping = CubeUVReflectionMapping; // tells three.js this is already a PMREM
    scene.environment = texture;
    scene.background = texture;
});
```

### Traditional three.js approach (what FastHDR replaces)

```javascript
import { PMREMGenerator } from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const loader = new EXRLoader();
loader.load('path/to/your.exr', (texture) => {
  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envRT = pmremGenerator.fromEquirectangular(texture);
  scene.environment = envRT.texture;
  scene.background = envRT.texture;
  texture.dispose();
  pmremGenerator.dispose();
});
```

### Command-line KTX2 compression

```bash
./basisu -hdr_4x4 my_pmrem.exr
```

---

## Key Techniques & Patterns

### Image-Based Lighting (IBL)
Environment panoramas serve as both light sources and reflection sources, split into:
- **Radiance (specular)** — sharp mirror-like reflections from bright features
- **Irradiance (diffuse)** — soft ambient lighting

### Prefiltered Mipmapped Radiance Environment Maps (PMREM)
Multiple blur levels are pre-generated and stored as cube faces in a mipmap chain. The shader picks the mipmap level based on material roughness — rough surfaces sample blurred mipmaps, smooth surfaces sample the sharp base level. This eliminates expensive runtime filtering.

### GPU-Compressed Texture Storage
Traditional HDR formats (EXR, HDR) are CPU-compressed — they must fully decompress before GPU upload. KTX2 stays compressed on the GPU via transcodable formats, dramatically reducing VRAM usage.

### Worker Thread Parallelization
KTX2 transcoding runs on separate JS workers, keeping the main thread and GPU free for model loading and rendering during scene init.

---

## Practical Tips & Gotchas

1. **Critical: set `texture.mapping = CubeUVReflectionMapping`** — without this, three.js treats the texture as raw equirectangular data, producing inverted/distorted reflections.

2. **Transcoder path + detectSupport are both required** — `loader.setTranscoderPath(...)` and `loader.detectSupport(renderer)` must both be called. Missing either causes silent failure.

3. **Browser memory limits for 4k** — web-based conversion tools are limited to 1k–2k. Larger textures require the command-line Basis Universal tool.

4. **Background blur is free with PMREM** — use `scene.backgroundBlurriness` (three.js) or `background-blurriness` attribute (Needle Engine) to leverage the mipmap chain for runtime blur at no extra cost.

5. **Resolution unlocked** — where 1k EXR was previously the web norm, 2k–4k FastHDR files are now practical with better performance *and* lower memory.

6. **EXR baselines are large** — 2k EXR is 8–10 MB, 4k is ~20 MB. FastHDR compresses these to ~3–5 MB download.

---

## Performance Considerations

### Load Time (4k resolution)
| | Time |
|---|---|
| **FastHDR** | **1.4s** (mostly download) |
| EXR | 8.5s (full pipeline) |
| Speedup | ~10x vs EXR, ~5x vs UltraHDR |

### Memory Usage
| Metric | EXR 4k | FastHDR 4k |
|---|---|---|
| Download size | 20+ MB | ~3–5 MB |
| GPU memory | ~250+ MB | ~12–15 MB |
| PMREM generation overhead | ~150–200 MB peak | **0 MB** |
| GPU memory savings | — | **~95%** |

### Compression Format Options
| Format | Tradeoff |
|---|---|
| ETC1S | Smaller files, lower quality |
| UASTC | Higher fidelity, larger |
| **UASTC HDR 4x4** | Current standard for radiance data |
| UASTC HDR 6x6 | Future — even smaller files |

### HDR File Format Reference
| Format | Loader | Notes |
|---|---|---|
| OpenEXR (.exr) | `EXRLoader` | Professional, lossless |
| Radiance (.hdr) | `HDRLoader` | Standard web HDR |
| UltraHDR (JPEG + gainmap) | `UltraHDRLoader` | Google/Android standard |
| **KTX2 (.ktx2)** | **`KTX2Loader`** | **FastHDR implementation** |

### Formal Name
> "KTX2-supercompressed Prefiltered Mipmapped Radiance Environment Maps in UASTC HDR format"

### Resources
- 20+ pre-processed environment maps at 1k/2k/4k: `https://cloud.needle.tools/hdris`
- Conversion workflow: three.js `EXRExporter` → PMREM → Basis Universal CLI
