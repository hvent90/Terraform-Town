**1. Maxime Heckel — "Field Guide to TSL and WebGPU" (Oct 2025)**
Covers writing shaders in TSL (Three.js Shading Language) for WebGPU, including lighting integration with `positionNode` and `normalNode` for custom materials with proper shadows and reflections. Excellent for understanding the future of lighting in Three.js.

---

## Deep Dive

**Source**: [blog.maximeheckel.com](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) (Oct 14, 2025)
**Note**: Blog is client-side rendered; content reconstructed from RSS, search indices, and related sources.

A comprehensive guide to building 3D web experiences with TSL and WebGPU, covering shader development, compute shader applications, and practical examples for particle systems and post-processing effects. Heckel documents his journey from knowing very little about TSL/WebGPU to becoming comfortable with them.

### Why TSL Exists

TSL was created to address the obsolescence of old GLSL shader chunks used in Three.js materials when transitioning to WebGPU. TSL prevents this issue by allowing existing shader code to transpile to any future shading language that browsers may support (WGSL today, whatever comes next).

### Node Material Hooks

TSL provides hooks for each of its NodeMaterials to modify material output:

| Hook | Purpose |
|------|---------|
| `colorNode` | Modify the base color output |
| `normalNode` | Adjust normal data (bump/normal mapping) |
| `positionNode` | Modify vertex positions (deformation) |
| `roughnessNode` | Control PBR roughness |
| `metalnessNode` | Control PBR metalness |

```javascript
// Example: animated color with MeshStandardNodeMaterial
material.colorNode = sin(timeUniform).mul(0.5).add(0.5);
```

### Organic Displacement (Blob Example)

The guide demonstrates creating a classic blob with organic displacement on a sphere using `meshPhongNodeMaterial`:
- Write a shader for `positionNode` to modify vertex positions over time
- Write a shader for `normalNode` to adjust normal data so lighting matches the vertex displacement
- This ensures shadows and reflections respond correctly to the deformed geometry

### Compute Shaders for Particle Systems

The guide covers GPU-accelerated particle systems:

- **Mesh**: Uses `Sprite` and `SpriteNodeMaterial` as the particle "mesh"
- **Buffer**: An `instancedArray` of `vec3` holds initial positions for all particles
- **Init**: A compute shader `computeInit` initializes particles at desired positions
- **instanceIndex**: TSL helper that returns a unique ID per thread from the GPU compute pipeline — each thread is responsible for one instance
- `SpriteNodeMaterial` takes a `count` prop for particle count, with `positionNode` and `colorNode` for customization

### Post-Processing with WebGPU

Heckel ported key projects to WebGPU/TSL including glass materials, post-processing, particles, and shader experiments. The guide covers using `WebGPURenderer`, `BatchedMesh`, and post-processing effects.

### Key Takeaways for Lighting

- TSL node hooks let you extend materials while keeping PBR lighting intact
- `normalNode` modifications automatically update how light interacts with surfaces
- Compute shaders enable GPU-side particle lighting calculations
- TSL transpiles to both WGSL (WebGPU) and GLSL (WebGL fallback)

### Related Resources

- [Three.js Shading Language Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [TSL Tutorials by cmhhelgeson](https://github.com/cmhhelgeson/Threejs_TSL_Tutorials)
- [WebGPU Claude Skill](https://github.com/dgreenheck/webgpu-claude-skill)
