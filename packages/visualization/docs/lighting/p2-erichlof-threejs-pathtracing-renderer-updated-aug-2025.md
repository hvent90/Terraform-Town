**19. Erichlof — THREE.js PathTracing Renderer (Updated Aug 2025)**
Light Shaft demos with volumetric god rays in participating media, plus terrain rendering, Cornell Box, and ocean/sky scenes with procedural clouds — all path-traced at 30-60fps.
---

---

## Deep Dive

# THREE.js-PathTracing-Renderer

The page is a project README/overview rather than a code tutorial. It contains no inline code snippets, but does describe techniques, patterns, and performance considerations in detail. Here's everything extracted:

---

## Key Techniques and Patterns

### Path Tracing via Monte Carlo Integration
Uses **Monte Carlo integration** (a random process, producing visual noise) to sample the unit-hemisphere oriented around the normal of the ray-object hitpoint, collecting any light being received. This is the key difference between path tracing and simple old-fashioned ray tracing.

### Mini-Stack Technique for Transparent Surfaces
Instead of randomizing path choices at each bounce: "I first send a ray on the path towards the target light source...but at the same time, create a randomized indirect diffuse color-gathering ray, and push it on the mini-stack for later use."

### Shapes BVH System
Rather than dealing with glTF models, builds a BVH around large amounts of **simple primitive shapes** (spheres, boxes, cylinders, etc.) using `THREE.SphereGeometry`, `THREE.BoxGeometry`, `THREE.PhysicalMaterial`, and `THREE.Mesh`/`THREE.Object3D`.

### Quadric Shape Rendering
Shapes defined implicitly (e.g., unit sphere: `x² + y² + z² - 1 = 0`) and reduced to a quadratic equation in the ray's `t` value.

### Constructive Solid Geometry (CSG)
- **Union**: outside of shape A fused with outside of shape B
- **Difference**: shape A is cut out with shape B
- **Intersection**: wherever shape A touches shape B, a new shape/volume is created

### Triangle-to-Quad Conversion
Combining every 2 triangles into 1 quad saves memory and BVH size by at least 50%, and intersecting 1 quad is actually faster than intersecting the 2 triangles it was made from.

---

## Practical Tips and Gotchas

- **Direct Light Targeting**: Custom randomized direct light targeting makes images converge almost instantly.
- **Float Precision Artifacts**: Rendering artifacts like gaps and thin cracks appear at larger scales due to limited GPU shader float precision.
- **Torus is Expensive**: The torus is a quartic (degree 4) shape requiring solving roots of a quartic equation — historically difficult and expensive to ray trace.
- **Mobile BVH Traversal**: Cell phones struggle traversing deep BVH trees that triangle-heavy scenes produce.
- **Compilation Time**: Complex scenes may take up to 10 seconds to compile; terrain demos may take several seconds to load and compile.

---

## Performance Considerations

| Metric | Value |
|--------|-------|
| Target frame rate | 30–60 FPS in browser (including smartphones) |
| Convergence range | ~500–3,000 samples (lower for simple, higher for complex scenes) |
| Triangle limit tested | Up to 800,000 triangles via BVH |

- **Mobile vs Desktop**: A Samsung S9 achieved nearly 60fps while an older laptop managed ~20fps — mobile GPUs can outperform older desktop hardware.
- **Mobile Strategy**: Standard "triangle BVH" systems can't just be thrown at phones/tablets and expected to match desktop NVIDIA RTX performance. The Shapes BVH approach is better suited.
- **Quad optimization**: 50%+ memory savings and faster intersection vs triangles.

---

**Note**: The page is a project overview/README with demo links — not a code tutorial. The actual implementations live in the [GitHub repository](https://github.com/erichlof/THREE.js-PathTracing-Renderer). No code blocks were present on the page itself.
