# Three.js Lighting Techniques - Categorized by Handbook Section

## Techniques Extracted: 2
## Skipped: Fog/atmosphere techniques, React Three Fiber patterns

---

## Section 6: Post-Processing & Bloom

### 6.1 Volumetric Lighting Post-Processing Effect

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Description**: Complete class structure for a post-processing volumetric lighting effect using the postprocessing library. Handles uniform updates and depth buffer access automatically.

**Code**:
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor(
    cameraFar = 500,
    projectionMatrixInverse = new THREE.Matrix4(),
    viewMatrixInverse = new THREE.Matrix4(),
    cameraPosition = new THREE.Vector3(),
    lightDirection = new THREE.Vector3(),
    lightPosition = new THREE.Vector3(),
    coneAngle = 40.0
  ) {
    const uniforms = new Map([
      ['cameraFar', new THREE.Uniform(cameraFar)],
      ['projectionMatrixInverse', new THREE.Uniform(projectionMatrixInverse)],
      ['viewMatrixInverse', new THREE.Uniform(viewMatrixInverse)],
      ['cameraPosition', new THREE.Uniform(cameraPosition)],
      ['lightDirection', new THREE.Uniform(lightDirection)],
      ['lightPosition', new THREE.Uniform(lightPosition)],
      ['coneAngle', new THREE.Uniform(coneAngle)],
    ]);

    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    // Update matrices each frame
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    // ... update other uniforms
  }
}
```

**Key Parameters**:
| Parameter | Default | Description |
|-----------|---------|-------------|
| `cameraFar` | 500 | Camera far plane distance |
| `coneAngle` | 40.0 | Light cone angle in degrees |
| `EffectAttribute.DEPTH` | required | Enables depth buffer access in shader |

**Gotchas/Tips**:
- `EffectAttribute.DEPTH` required to access depthBuffer in shader
- Update uniforms in `update()`, not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---

## Section 12: Performance Guide

### 12.1 Multi-Light Performance Optimization Strategies

**Source**: Performance Considerations for Many Small Light Sources

**Description**: Comprehensive guidance for optimizing scenes with multiple light sources, particularly relevant for TRON/frosted glass aesthetics with internal lighting.

**Performance Impact Table**:

| Factor | Impact | Guidance |
|--------|--------|----------|
| **Step count** | Dominant raymarching cost | 250 steps = high quality; blue noise dithering enables ~50 steps. For many lights, aggressively reduce steps. |
| **Shadow map resolution** | Per-step texture read | 128² = fast/blocky, 512² = good balance, 1024² = expensive. Use lower res for distant lights. |
| **Cube camera shadows** | 6x scene renders per light | **CRITICAL BOTTLENECK** for many lights |
| **Multiple lights** | Linear scaling | 2-3 lights manageable; 5+ needs optimization |
| **FBM noise** | Multiple texture reads per step | Use small wrapping texture (256²) or generate in-shader |
| **Blue noise dithering** | Negligible cost | **ESSENTIAL** - Single texture read, huge quality/step-count win |
| **Bandwidth** | 1080p × 50 steps ≈ 500M texture accesses | Compress shadow data, use half-float formats |

**Key Parameters**:
- Shadow map resolution: 512² recommended balance
- Blue noise dithering: mandatory for many lights
- Light count threshold: optimize at 5+ lights

**Gotchas/Tips**:
- **Shadow LOD**: Only key lights cast shadows
- **Static shadows**: Update only when objects move
- **Distance-based resolution**: Lower resolution for distant lights
- **Skip shadows**: For tiny accent lights entirely
- **Fake small lights**: Use emissive materials + bloom instead of actual point lights
- **Deferred rendering**: Consider for 5+ lights
- **Early exit**: Always include depth/far-plane checks
- **Format optimization**: Compress shadow data, use half-float formats

---

## Summary

| Section | Technique Count |
|---------|-----------------|
| 6. Post-Processing & Bloom | 1 |
| 12. Performance Guide | 1 |

**Filtered Out**:
- FBM Noise for Volumetric Effects (fog/atmosphere - removed from design)
- Point Light Inside Translucent Mesh (R3F pattern)
- Dynamic Light Intensity / Strobe Effect (R3F pattern)
# Three.js Lighting Techniques — Organized by Handbook Section

---

## Section 1: Aesthetic Identity

### Technique: Cool Color Temperature for Dramatic Atmosphere
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: Color temperature — cool tones (blue) for dramatic effect

**How it applies**:
- TRON aesthetic uses cool neon colors: cyan, electric blue, purple
- Apply to all lights for cohesive atmosphere
- Ground plane can receive cool-tinted shadows
- Creates the cold, digital, futuristic feel

**Code snippet**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

## Section 2: Scene Foundation (renderer, camera, ground, ambient light)

### Technique: AmbientLight for Dark Scene Base
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: AmbientLight provides uniform base illumination without direction or shadows.

**How it applies**: For a dark scene, use a VERY low intensity AmbientLight (or none at all) to maintain the moody, dark atmosphere. A subtle ambient can prevent pure black areas while keeping the TRON-like minimal aesthetic.

**Code snippet**:
```javascript
// For dark moody scene, use very low intensity
const ambientLight = new THREE.AmbientLight(0x111122, 0.1);
scene.add(ambientLight);
```

**Key parameters**:
- Color: `0x111122` (dark blue tint)
- Intensity: `0.1` (very low for dark scenes)

**Gotchas/tips**:
- AmbientLight does NOT cast shadows
- Keep intensity extremely low (0.05-0.2) for dark scenes
- A slightly colored ambient (cool blue) can enhance the moody atmosphere
- AmbientLight is "cheap" — minimal performance cost

---

### Technique: HemisphereLight for Ground Plane Ambient
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: HemisphereLight — sky-to-ground gradient for natural lighting

**How it applies**:
- For dark ground plane: set ground color to dark blue/black
- Sky color can be subtle dark blue for ambient fill
- Creates subtle gradient lighting on ground plane from internal lights
- Cheaper than multiple fill lights

**Code snippet**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Key parameters**:
- Sky color: `0x004466` (dark teal blue)
- Ground color: `0x000011` (near black)
- Intensity: `0.3` (low)

**Gotchas/tips**:
- HemisphereLight is "cheap" for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Technique: Cinematic Night Scene Setup
**Source**: Mastering Three.js Lighting: Illuminating Your 3d World

**Technique**: Low-intensity ambient + cool directional light for cinematic night scenes

**How it applies**:
- Foundation for dark TRON aesthetic
- Cool blue directional light provides subtle rim/back lighting
- Low ambient keeps scene dark while cool directional adds atmospheric color
- Orthographic camera works well with this setup for stylized look

**Code snippet**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Technique: IBL (Image-Based Lighting) for Atmospheric Depth
**Source**: Enlightening 3D Worlds: Mastering Three.js (2025)

**Technique**: IBL uses environment maps to create photorealistic lighting conditions.

**How it applies**: For your dark scene, use a dark/subtle environment map to add atmospheric depth without adding extra light sources. This can enhance the moody atmosphere and provide subtle reflections on glass surfaces.

**Code snippet**:
```javascript
// Load environment map for IBL
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromScene(scene).texture;
scene.environment = envMap;
```

**Gotchas/tips**:
- Can enhance the glow effect on glass materials
- For dark scene, consider a custom dark environment map
- PBR materials respond to environment maps for realistic reflections

---

## Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

### Technique: PBR (Physically Based Rendering) for Glass Materials
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: PBR simulates real-world material properties by mimicking how light interacts with different surfaces.

**How it applies**: CRITICAL for your frosted glass / translucent mesh primitives. Use MeshPhysicalMaterial (Three.js PBR material) with:
- `transmission` for glass-like transparency
- `roughness` for frosted effect
- `thickness` for volumetric appearance

**Code snippet**:
```javascript
// PBR material for frosted glass effect
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.5,        // Higher = more frosted
  transmission: 0.9,     // Glass-like transparency
  thickness: 0.5,        // For volumetric effect
  transparent: true
});
```

**Key parameters**:
- `metalness: 0` — non-metallic for glass
- `roughness: 0.5` — controls frost level (higher = more frosted)
- `transmission: 0.9` — glass-like transparency
- `thickness: 0.5` — volumetric effect
- `transparent: true` — required for transmission

**Gotchas/tips**:
- MeshPhysicalMaterial is more expensive than MeshStandardMaterial
- `transmission` requires `transparent: true`
- `roughness` controls the frost level — higher = more diffuse glow
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

### Technique: PointLight for Internal Mesh Lights
**Source**: Enlightening 3D Worlds + Mastering Three.js Lighting (combined)

**Technique**: PointLight radiates light in all directions from a single point in space.

**How it applies**: PERFECT for your frosted glass primitives with internal lights. Place a PointLight inside each translucent mesh to create the "light emanating outward through glass" effect. Use colored lights (cyan, magenta, etc.) for TRON-like neon aesthetic.

**Code snippet**:
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);

// For TRON cyan internal light
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Key parameters**:
- First param: color (hex)
- Second param: intensity
- Third param: distance limit (lights fade to black at this distance)

**Gotchas/tips**:
- The third parameter (100) is the distance limit — lights fade to black at this distance
- For many small light sources, be aware that each PointLight adds render cost
- Consider using a lower intensity with higher count for distributed glow effect
- For performance with many lights, you may need to use deferred rendering or light clustering
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Technique: RectAreaLight for Panel/Screen Glow
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: RectAreaLight — rectangular emitter for window/panel light

**How it applies**:
- Perfect for TRON-style light panels and screens
- Can create glowing rectangular shapes on walls/floor
- Soft, diffuse light emanating from a defined rectangular area
- Works well for geometric, minimalist TRON aesthetic

**Code snippet**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Key parameters**:
- Color: `0x00ffff` (cyan)
- Intensity: `1.0`
- Width: `2`
- Height: `2`

**Gotchas/tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Technique: SpotLight for Focused Dramatic Effects
**Source**: Enlightening 3D Worlds + Mastering Three.js Lighting (combined)

**Technique**: SpotLight creates a cone-shaped beam of light with target tracking capability.

**How it applies**: Could be used for dramatic focused lighting effects in your TRON-like scene — think of focused neon beams cutting through the dark environment. The target tracking allows for dynamic light direction.

**Code snippet**:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
spotlight.angle = Math.PI / 6; // 30 degrees
spotlight.penumbra = 0.5; // soft edges
scene.add(spotlight);
scene.add(spotlight.target);
```

**Key parameters**:
- `angle`: cone angle (Math.PI / 6 = 30 degrees)
- `penumbra`: soft edge factor (0.5 = soft edges)

**Gotchas/tips**:
- Both the spotlight AND its target must be added to the scene
- Good for creating focused pools of light on your dark ground plane
- Can create dramatic TRON-like light trails when animated
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Technique: Three-Point Lighting (Adapted for Dark Scenes)
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: Three-point lighting setup (key, fill, rim)

**How it applies**:
- For dark TRON scene, invert the typical setup
- KEY: Internal point lights in mesh primitives (the main visible glow)
- FILL: Very low ambient or hemisphere for subtle visibility
- RIM: Cool directional or spot from behind for edge definition
- Separates glowing objects from dark background

**Code snippet**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/tips**:
- For internal mesh lights, the "key" is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Technique: Combining Lights for Atmospheric Effects
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: Combining multiple light types creates atmospheric effects and mood.

**How it applies**: ESSENTIAL for your TRON-like aesthetic. Combine:
- Low ambient for base darkness
- Colored PointLights inside glass objects
- Soft shadows for depth

**Code snippet**:
```javascript
// Soft ambient for moody interiors
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.15);
scene.add(ambientLight);

// Multiple colored point lights for neon effect
const cyanLight = new THREE.PointLight(0x00ffff, 0.8, 50);
const magentaLight = new THREE.PointLight(0xff00ff, 0.6, 50);
```

**Gotchas/tips**:
- "Soft ambient for moody interiors" directly from the source
- Balance light intensities carefully — too many lights will wash out the dark aesthetic
- For TRON-like look, use complementary neon colors

---

## Section 5: Shadows (shadow maps, contact shadows, selective casting)

### Technique: Shadow Mapping for Ground Plane Shadows
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: Shadows are crucial for creating depth and realism in 3D scenes.

**How it applies**: Enable shadows on your ground plane to receive the light emanating from your frosted glass objects. This creates the "light emanating outward through glass onto a dark ground plane" effect with realistic depth.

**Code snippet**:
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
```

**Gotchas/tips**:
- Each light that should cast shadows needs `castShadow = true`
- Meshes need `castShadow` and `receiveShadow` properties set
- For soft shadows, configure shadow map properties:
  - `light.shadow.mapSize.width` and `light.shadow.mapSize.height`
  - `light.shadow.radius` for soft shadow edges
- Performance impact increases with shadow-casting lights

---

## Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

### Technique: Performance Tips for Many Light Sources
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Techniques**:
1. **Use cheap lights for base illumination**: AmbientLight, HemisphereLight have minimal cost
2. **Many PointLights = performance concern**. Consider:
   - Using fewer lights with larger influence radius
   - Baking static lights into lightmaps
   - Using emissive materials + bloom post-processing instead of actual lights for some objects

**Gotchas/tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Summary: Recommended Approach for Your Aesthetic (Cross-Reference)

From the source documents:

1. **Base Setup**: Ultra-low ambient light (or none)
2. **Primary Lights**: PointLights inside each frosted glass object with neon colors
3. **Materials**: MeshPhysicalMaterial with transmission + roughness for frosted glass
4. **Shadows**: Enable shadow mapping, cast from internal lights onto ground plane
5. **Performance**: Many PointLights = performance concern. Consider:
   - Using fewer lights with larger influence radius
   - Baking static lights into lightmaps
   - Using emissive materials + bloom post-processing instead of actual lights for some objects

# Three.js Lighting Techniques — Organized by Handbook Section

---

## Section 1: Aesthetic Identity

### Technique: Cool Color Temperature for Dramatic Atmosphere
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: Color temperature — cool tones (blue) for dramatic effect

**How it applies**:
- TRON aesthetic uses cool neon colors: cyan, electric blue, purple
- Apply to all lights for cohesive atmosphere
- Ground plane can receive cool-tinted shadows
- Creates the cold, digital, futuristic feel

**Code snippet**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

## Section 2: Scene Foundation (renderer, camera, ground, ambient light)

### Technique: AmbientLight for Dark Scene Base
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: AmbientLight provides uniform base illumination without direction or shadows.

**How it applies**: For a dark scene, use a VERY low intensity AmbientLight (or none at all) to maintain the moody, dark atmosphere. A subtle ambient can prevent pure black areas while keeping the TRON-like minimal aesthetic.

**Code snippet**:
```javascript
// For dark moody scene, use very low intensity
const ambientLight = new THREE.AmbientLight(0x111122, 0.1);
scene.add(ambientLight);
```

**Key parameters**:
- Color: `0x111122` (dark blue tint)
- Intensity: `0.1` (very low for dark scenes)

**Gotchas/tips**:
- AmbientLight does NOT cast shadows
- Keep intensity extremely low (0.05-0.2) for dark scenes
- A slightly colored ambient (cool blue) can enhance the moody atmosphere
- AmbientLight is "cheap" — minimal performance cost

---

### Technique: HemisphereLight for Ground Plane Ambient
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: HemisphereLight — sky-to-ground gradient for natural lighting

**How it applies**:
- For dark ground plane: set ground color to dark blue/black
- Sky color can be subtle dark blue for ambient fill
- Creates subtle gradient lighting on ground plane from internal lights
- Cheaper than multiple fill lights

**Code snippet**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Key parameters**:
- Sky color: `0x004466` (dark teal blue)
- Ground color: `0x000011` (near black)
- Intensity: `0.3` (low)

**Gotchas/tips**:
- HemisphereLight is "cheap" for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Technique: Cinematic Night Scene Setup
**Source**: Mastering Three.js Lighting: Illuminating Your 3d World

**Technique**: Low-intensity ambient + cool directional light for cinematic night scenes

**How it applies**:
- Foundation for dark TRON aesthetic
- Cool blue directional light provides subtle rim/back lighting
- Low ambient keeps scene dark while cool directional adds atmospheric color
- Orthographic camera works well with this setup for stylized look

**Code snippet**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Technique: IBL (Image-Based Lighting) for Atmospheric Depth
**Source**: Enlightening 3D Worlds: Mastering Three.js (2025)

**Technique**: IBL uses environment maps to create photorealistic lighting conditions.

**How it applies**: For your dark scene, use a dark/subtle environment map to add atmospheric depth without adding extra light sources. This can enhance the moody atmosphere and provide subtle reflections on glass surfaces.

**Code snippet**:
```javascript
// Load environment map for IBL
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromScene(scene).texture;
scene.environment = envMap;
```

**Gotchas/tips**:
- Can enhance the glow effect on glass materials
- For dark scene, consider a custom dark environment map
- PBR materials respond to environment maps for realistic reflections

---

## Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

### Technique: PBR (Physically Based Rendering) for Glass Materials
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: PBR simulates real-world material properties by mimicking how light interacts with different surfaces.

**How it applies**: CRITICAL for your frosted glass / translucent mesh primitives. Use MeshPhysicalMaterial (Three.js PBR material) with:
- `transmission` for glass-like transparency
- `roughness` for frosted effect
- `thickness` for volumetric appearance

**Code snippet**:
```javascript
// PBR material for frosted glass effect
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.5,        // Higher = more frosted
  transmission: 0.9,     // Glass-like transparency
  thickness: 0.5,        // For volumetric effect
  transparent: true
});
```

**Key parameters**:
- `metalness: 0` — non-metallic for glass
- `roughness: 0.5` — controls frost level (higher = more frosted)
- `transmission: 0.9` — glass-like transparency
- `thickness: 0.5` — volumetric effect
- `transparent: true` — required for transmission

**Gotchas/tips**:
- MeshPhysicalMaterial is more expensive than MeshStandardMaterial
- `transmission` requires `transparent: true`
- `roughness` controls the frost level — higher = more diffuse glow
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

### Technique: PointLight for Internal Mesh Lights
**Source**: Enlightening 3D Worlds + Mastering Three.js Lighting (combined)

**Technique**: PointLight radiates light in all directions from a single point in space.

**How it applies**: PERFECT for your frosted glass primitives with internal lights. Place a PointLight inside each translucent mesh to create the "light emanating outward through glass" effect. Use colored lights (cyan, magenta, etc.) for TRON-like neon aesthetic.

**Code snippet**:
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);

// For TRON cyan internal light
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Key parameters**:
- First param: color (hex)
- Second param: intensity
- Third param: distance limit (lights fade to black at this distance)

**Gotchas/tips**:
- The third parameter (100) is the distance limit — lights fade to black at this distance
- For many small light sources, be aware that each PointLight adds render cost
- Consider using a lower intensity with higher count for distributed glow effect
- For performance with many lights, you may need to use deferred rendering or light clustering
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Technique: RectAreaLight for Panel/Screen Glow
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: RectAreaLight — rectangular emitter for window/panel light

**How it applies**:
- Perfect for TRON-style light panels and screens
- Can create glowing rectangular shapes on walls/floor
- Soft, diffuse light emanating from a defined rectangular area
- Works well for geometric, minimalist TRON aesthetic

**Code snippet**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Key parameters**:
- Color: `0x00ffff` (cyan)
- Intensity: `1.0`
- Width: `2`
- Height: `2`

**Gotchas/tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Technique: SpotLight for Focused Dramatic Effects
**Source**: Enlightening 3D Worlds + Mastering Three.js Lighting (combined)

**Technique**: SpotLight creates a cone-shaped beam of light with target tracking capability.

**How it applies**: Could be used for dramatic focused lighting effects in your TRON-like scene — think of focused neon beams cutting through the dark environment. The target tracking allows for dynamic light direction.

**Code snippet**:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
spotlight.angle = Math.PI / 6; // 30 degrees
spotlight.penumbra = 0.5; // soft edges
scene.add(spotlight);
scene.add(spotlight.target);
```

**Key parameters**:
- `angle`: cone angle (Math.PI / 6 = 30 degrees)
- `penumbra`: soft edge factor (0.5 = soft edges)

**Gotchas/tips**:
- Both the spotlight AND its target must be added to the scene
- Good for creating focused pools of light on your dark ground plane
- Can create dramatic TRON-like light trails when animated
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Technique: Three-Point Lighting (Adapted for Dark Scenes)
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: Three-point lighting setup (key, fill, rim)

**How it applies**:
- For dark TRON scene, invert the typical setup
- KEY: Internal point lights in mesh primitives (the main visible glow)
- FILL: Very low ambient or hemisphere for subtle visibility
- RIM: Cool directional or spot from behind for edge definition
- Separates glowing objects from dark background

**Code snippet**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/tips**:
- For internal mesh lights, the "key" is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Technique: Combining Lights for Atmospheric Effects
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: Combining multiple light types creates atmospheric effects and mood.

**How it applies**: ESSENTIAL for your TRON-like aesthetic. Combine:
- Low ambient for base darkness
- Colored PointLights inside glass objects
- Soft shadows for depth

**Code snippet**:
```javascript
// Soft ambient for moody interiors
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.15);
scene.add(ambientLight);

// Multiple colored point lights for neon effect
const cyanLight = new THREE.PointLight(0x00ffff, 0.8, 50);
const magentaLight = new THREE.PointLight(0xff00ff, 0.6, 50);
```

**Gotchas/tips**:
- "Soft ambient for moody interiors" directly from the source
- Balance light intensities carefully — too many lights will wash out the dark aesthetic
- For TRON-like look, use complementary neon colors

---

## Section 5: Shadows (shadow maps, contact shadows, selective casting)

### Technique: Shadow Mapping for Ground Plane Shadows
**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: Shadows are crucial for creating depth and realism in 3D scenes.

**How it applies**: Enable shadows on your ground plane to receive the light emanating from your frosted glass objects. This creates the "light emanating outward through glass onto a dark ground plane" effect with realistic depth.

**Code snippet**:
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
```

**Gotchas/tips**:
- Each light that should cast shadows needs `castShadow = true`
- Meshes need `castShadow` and `receiveShadow` properties set
- For soft shadows, configure shadow map properties:
  - `light.shadow.mapSize.width` and `light.shadow.mapSize.height`
  - `light.shadow.radius` for soft shadow edges
- Performance impact increases with shadow-casting lights

---

## Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

### Technique: Performance Tips for Many Light Sources
**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Techniques**:
1. **Use cheap lights for base illumination**: AmbientLight, HemisphereLight have minimal cost
2. **Many PointLights = performance concern**. Consider:
   - Using fewer lights with larger influence radius
   - Baking static lights into lightmaps
   - Using emissive materials + bloom post-processing instead of actual lights for some objects

**Gotchas/tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Summary: Recommended Approach for Your Aesthetic (Cross-Reference)

From the source documents:

1. **Base Setup**: Ultra-low ambient light (or none)
2. **Primary Lights**: PointLights inside each frosted glass object with neon colors
3. **Materials**: MeshPhysicalMaterial with transmission + roughness for frosted glass
4. **Shadows**: Enable shadow mapping, cast from internal lights onto ground plane
5. **Performance**: Many PointLights = performance concern. Consider:
   - Using fewer lights with larger influence radius
   - Baking static lights into lightmaps
   - Using emissive materials + bloom post-processing instead of actual lights for some objects
# Three.js Lighting Techniques - Categorized Handbook

## Section 3: Frosted Glass Materials

### 5. Beer's Law Light Attenuation

**Key Parameters:**
- `transmittance`: Start at 5.0 (>1.0) for brighter results
- `FOG_DENSITY`: 0.3-0.5 for good frosted glass effect
- `STEP_SIZE`: 0.1 typical

**Code:**
```glsl
// Beer's Law: I = I₀ × e^(-density × distance)
float transmittance = exp(-density * distance);

// Full volumetric accumulation with Beer's Law:
float transmittance = 5.0;  // Start >1.0 for brighter result
vec3 accumulatedLight = vec3(0.0);

for (int i = 0; i < NUM_STEPS; i++) {
  float attenuation = exp(-0.3 * distanceToLight);
  vec3 luminance = lightColor * LIGHT_INTENSITY * attenuation;
  
  float stepDensity = FOG_DENSITY * shapeFactor;
  stepDensity = max(stepDensity, 0.0);
  
  // Beer's Law for absorption at each step
  float stepTransmittance = exp(-stepDensity * STEP_SIZE);
  transmittance *= stepTransmittance;
  accumulatedLight += luminance * transmittance * stepDensity * STEP_SIZE;
  
  t += STEP_SIZE;
}

vec3 finalColor = inputColor.rgb + accumulatedLight;
```

**Gotchas/Tips:**
- Start transmittance >1.0 (e.g., 5.0) to avoid overly dark results
- Density parameter controls how 'foggy' the glass appears
- Higher values = more diffuse, milkier glass
- Lower values = clearer, more transparent glass

---

### 6. Henyey-Greenstein Phase Function

**Key Parameters:**
- `g`: 0.3-0.5 for frosted glass
- `mu`: dot(rayDir, -lightDir) - cosine of scattering angle

**Code:**
```glsl
// g near 0 = isotropic scattering (even in all directions)
// g positive = forward scattering (toward viewer)  
// g negative = backward scattering (away from viewer)

float HGPhase(float mu, float g) {
  float gg = g * g;
  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);
  float scatter = (1.0 - gg) / pow(denom, 1.5);
  return scatter;
}

// Usage:
float mu = dot(rayDir, -lightDir);  // Cosine of scattering angle
float g = 0.5;  // Forward scattering
float scatterPhase = HGPhase(mu, g);
vec3 luminance = lightColor * intensity * attenuation * scatterPhase;
```

**Gotchas/Tips:**
- For frosted glass: g = 0.3-0.5 works well
- Higher g = more focused beam (like spotlight through glass)
- Lower g = more diffuse glow (like frosted bulb)
- Negative g creates interesting rim-lighting effects

---

## Section 4: Internal Lighting

### 7. SDF-Based Light Volume Shaping

**Key Parameters:**
- `smoothEdgeWidth`: 0.1 for soft falloff at edges
- `shapeFactor`: smoothstep result for light shaping

**Code:**
```glsl
// Cylinder SDF - for tubular neon-like objects
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + projectionLength * axisDir;
  float distanceToAxis = length(p - closestPointOnAxis);
  return distanceToAxis - radius;
}

// Sphere SDF - for rounded glass primitives
float sdSphere(vec3 p, vec3 center, float radius) {
  return length(p - center) - radius;
}

// Box SDF - for rectangular glass blocks
float sdBox(vec3 p, vec3 center, vec3 halfSize) {
  vec3 q = abs(p - center) - halfSize;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Apply with soft edges for glow:
float smoothEdgeWidth = 0.1;
float sdfVal = sdSphere(samplePos, objectCenter, objectRadius);
float shapeFactor = smoothstep(0.0, -smoothEdgeWidth, sdfVal);

// Use in light accumulation:
fogAmount += attenuation * lightIntensity * shapeFactor;
```

**Gotchas/Tips:**
- smoothstep creates soft falloff at edges - adjust smoothEdgeWidth for sharper or softer glow
- Can combine multiple SDFs with min/max for complex shapes
- See Inigo Quilez's SDF dictionary for more primitives: iq.ua.es/articles
- For frosted glass, use slightly larger SDF radius than mesh for soft glow extending beyond surface

---

## Section 5: Shadows

### 2. Cube Camera for Omnidirectional Shadows

**Key Parameters:**
- `0`: CubeCamera
- `1`: WebGLCubeRenderTarget
- `2`: shadow maps
- `3`: 6 faces per light

**Gotchas/Tips:**
- This is a workaround, not production-grade
- MUST restore original materials after cube camera render
- Performance scales with scene complexity × 6 faces per light
- For static scenes, render shadow maps once and reuse

---

### 3. Cube Shadow Sampling in Fragment Shader

**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `CUBE_CAMERA_FAR`: Must match cube camera far plane
- `samples`: 20 for PCF soft shadows
- `PCF offset`: 0.01 adjustable based on scene scale

**Code:**
```glsl
uniform samplerCube shadowMapCube;
uniform vec3 lightPosition;
uniform float shadowBias;
uniform float CUBE_CAMERA_FAR;

float calculateShadowCube(vec3 worldPosition) {
  vec3 dirToLight = worldPosition - lightPosition;
  float distToLight = length(dirToLight);
  
  vec3 direction = normalize(dirToLight);
  float sampledDist = texture(shadowMapCube, direction).r;
  float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
  
  if (distToLight > shadowMapDist + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}

// For softer shadows, use PCF (Percentage Closer Filtering):
float calculateShadowCubeSoft(vec3 worldPosition, vec3 normal) {
  float shadow = 0.0;
  float bias = shadowBias;
  int samples = 20;
  vec3 sampleOffsetDirections[20] = /* ... array of offsets ... */;
  
  for (int i = 0; i < samples; i++) {
    vec3 dirToLight = worldPosition - lightPosition;
    float distToLight = length(dirToLight);
    vec3 direction = normalize(dirToLight);
    
    float sampledDist = texture(shadowMapCube, 
      direction + sampleOffsetDirections[i] * 0.01).r;
    float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
    
    if (distToLight > shadowMapDist + bias) {
      shadow += 1.0;
    }
  }
  return 1.0 - (shadow / float(samples));
}
```

**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne (self-shadowing speckles)
- For soft shadows, implement PCF by sampling multiple directions with small offsets
- The 0.01 offset in PCF should be adjusted based on your scene scale

---

### 10. Shadow Map Setup for Directional/Spot Lights

**Key Parameters:**
- `shadowMapSize`: 512 = balance, 256 = performance, 1024 = high quality
- `FOV`: Should match light's cone angle
- `near/far`: Should tightly bound scene for better depth precision

**Code:**
```javascript
const lightCamera = new THREE.PerspectiveCamera(90, 1.0, 0.1, 100);
lightCamera.fov = coneAngle;  // Match to light cone angle

const shadowFBO = new THREE.WebGLRenderTarget(shadowMapSize, shadowMapSize, {
  depth: true,
  depthTexture: new THREE.DepthTexture(
    shadowMapSize, 
    shadowMapSize, 
    THREE.FloatType
  ),
});

// Render shadow map each frame (or once if static):
lightCamera.position.copy(lightPosition);
lightCamera.lookAt(lightTarget);
lightCamera.updateMatrixWorld();
lightCamera.updateProjectionMatrix();

renderer.setRenderTarget(shadowFBO);
renderer.clear(false, true, false);
renderer.render(scene, lightCamera);
renderer.setRenderTarget(null);
```

**Gotchas/Tips:**
- FOV should match your light's cone angle
- Near/far planes should tightly bound scene for better depth precision
- Shadow map resolution: 512 = good balance, 256 = performance, 1024 = high quality
- For static objects, render shadow map ONCE and reuse

---

### 11. Shadow Calculation from Light View

**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `lightViewMatrix`: Light's view transformation
- `lightProjectionMatrix`: Light's projection transformation

**Code:**
```glsl
uniform sampler2D shadowMap;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;
uniform float shadowBias;

float calculateShadow(vec3 worldPosition) {
  // Transform to light's clip space
  vec4 lightClipPos = lightProjectionMatrix * lightViewMatrix * vec4(worldPosition, 1.0);
  vec3 lightNDC = lightClipPos.xyz / lightClipPos.w;

  // Convert to shadow map UV coordinates  
  vec2 shadowCoord = lightNDC.xy * 0.5 + 0.5;
  float lightDepth = lightNDC.z * 0.5 + 0.5;

  // Check bounds - outside shadow map = assume lit
  if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
      shadowCoord.y < 0.0 || shadowCoord.y > 1.0 ||
      lightDepth > 1.0) {
    return 1.0;
  }

  float shadowMapDepth = texture2D(shadowMap, shadowCoord).x;

  // Compare depths with bias
  if (lightDepth > shadowMapDepth + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}
```

**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne
- Use continue not break in loops - points beyond shadow may still be lit
- For soft shadows, sample multiple neighboring texels (PCF)
- Three.js/WebGL uses OpenGL UV convention (Y up in NDC)

---

## Section 6: Post-Processing & Bloom

### 4. Blue Noise Dithering

**Key Parameters:**
- `NUM_STEPS`: 50 (reduced from 200-250)
- `frame % 32`: Prevents float precision loss
- `1024.0`: Should match blue noise texture size

**Code:**
```glsl
uniform sampler2D blueNoiseTexture;
uniform int frame;

// At start of raymarching loop:
float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame % 32) / sqrt(0.5));
float t = STEP_SIZE * offset;  // Start ray at randomized offset

// Now can use significantly fewer steps:
const int NUM_STEPS = 50;   // Instead of 200-250
const float STEP_SIZE = 0.1;
```

**Gotchas/Tips:**
- frame % 32 prevents float precision loss (don't use larger modulus)
- Blue noise texture should be wrapping/repeat mode
- The 1024.0 divisor should match your blue noise texture size
- Works best combined with temporal anti-aliasing (TAA) for even smoother results
- Download blue noise textures from: momentsingraphics.de

---

### 8. World Position Reconstruction from Screen Space

**Key Parameters:**
- `EffectAttribute.DEPTH`: Required to access depth buffer
- `projectionMatrixInverse`: First matrix to apply
- `viewMatrixInverse`: Second matrix to apply

**Code:**
```glsl
// GLSL
vec3 getWorldPosition(vec2 uv, float depth) {
  float clipZ = depth * 2.0 - 1.0;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, clipZ, 1.0);

  vec4 view = projectionMatrixInverse * clip;
  vec4 world = viewMatrixInverse * view;

  return world.xyz / world.w;  // Perspective divide is MANDATORY
}

// JavaScript (postprocessing)
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor() {
    const uniforms = new Map([
      ['projectionMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['viewMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['cameraPosition', new THREE.Uniform(new THREE.Vector3())],
      ['cameraFar', new THREE.Uniform(500)],
    ]);
    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,  // Exposes depthBuffer
      uniforms,
    });
  }
}
```

**Gotchas/Tips:**
- Matrix multiplication order is CRITICAL: projectionMatrixInverse THEN viewMatrixInverse
- The /world.w perspective divide is mandatory or positions will be wrong
- Requires EffectAttribute.DEPTH to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

### 9. Depth-Based Stopping for Volumetric Effects

**Key Parameters:**
- `sceneDepth`: From depth buffer via world position reconstruction
- `cameraFar`: Camera far plane distance

**Code:**
```glsl
// Calculate distance to closest scene geometry
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  // Stop if we've hit scene geometry or exceeded far plane
  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  
  // ... accumulate light ...
  t += STEP_SIZE;
}
```

**Gotchas/Tips:**
- Essential for preventing light leaking through walls
- sceneDepth comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

## Summary

| Section | Techniques |
|---------|------------|
| 3. Frosted Glass Materials | 2 |
| 4. Internal Lighting | 1 |
| 5. Shadows | 4 |
| 6. Post-Processing & Bloom | 3 |

**Total techniques extracted:** 10

*Note: Fog/atmosphere techniques (Item 12 in source) were skipped per design rules.*
### Section 1: Aesthetic Identity

**Technique**: Cool Color Temperature for Dramatic Atmosphere

**Key Parameters**:
- color: 0x6688ff (cool blue)
- color: 0x00ffff (TRON cyan)
- intensity: 0.8-1.0

**Code**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/Tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

### Section 1: Aesthetic Identity

**Technique**: Three-Point Lighting (Adapted for Dark Scenes)

**Key Parameters**:
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)

**Code**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/Tips**:
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Low-Intensity Ambient Light for Dark Scenes

**Key Parameters**:
- color: 0x404040 (dark gray)
- intensity: 0.1-0.5 for dark scenes

**Code**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/Tips**:
- AmbientLight is 'cheap' — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: HemisphereLight for Ground Plane Ambient

**Key Parameters**:
- skyColor: 0x004466 (dark blue)
- groundColor: 0x000011 (near black)
- intensity: 0.2-0.3

**Code**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Gotchas/Tips**:
- HemisphereLight is 'cheap' for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Cinematic Night Scene Setup

**Key Parameters**:
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)

**Code**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/Tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

**No techniques found in context**

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: PointLight for Internal Mesh Lights

**Key Parameters**:
- color: 0xffffff or neon colors (0x00ffff, 0xff00ff)
- intensity: 0.5-0.8
- position: inside mesh primitive
- distance: 10 (for decay)

**Code**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/Tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: RectAreaLight for Panel/Screen Glow

**Key Parameters**:
- color: 0x00ffff (TRON cyan)
- intensity: 1.0
- width: 2
- height: 2

**Code**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Gotchas/Tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: SpotLight for Focused Dramatic Effects

**Key Parameters**:
- color: 0x00ffff
- intensity: 1.0
- angle: Math.PI / 6 (30 degrees)
- penumbra: 0.5

**Code**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/Tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Cube Camera for Omnidirectional Point Light Shadows

**Key Parameters**:
- SHADOW_MAP_SIZE: 256-1024
- CUBE_CAMERA_NEAR: 0.1
- CUBE_CAMERA_FAR: 100
- format: THREE.RGBAFormat
- type: THREE.FloatType

**Code**:
```javascript
const shadowCubeRenderTarget = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: false,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});

const shadowCubeCamera = new THREE.CubeCamera(
  CUBE_CAMERA_NEAR,  // 0.1
  CUBE_CAMERA_FAR,   // 100 (adjust to scene scale)
  shadowCubeRenderTarget
);

// Position at each internal light source
shadowCubeCamera.position.copy(internalLightPosition);
```

**Gotchas/Tips**:
- MAJOR PERFORMANCE COST: 6x scene renders per frame per light
- For many small lights: only enable shadows for key lights
- Use lower resolution for distant lights
- Update shadows only when objects move (not every frame)
- Typical SHADOW_MAP_SIZE: 512 for balance, 256 for performance, 1024 for high quality

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Custom Shadow Material for Cube Depth

**Key Parameters**:
- lightPosition: Vector3 uniform
- shadowFar: float uniform (CUBE_CAMERA_FAR)
- side: THREE.DoubleSide

**Code**:
```javascript
const shadowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 lightPosition;
    uniform float shadowFar;
    varying vec3 vWorldPosition;
    void main() {
      float distance = length(vWorldPosition);
      float normalizedDistance = clamp(distance / shadowFar, 0.0, 1.0);
      gl_FragColor = vec4(normalizedDistance, 0.0, 0.0, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  uniforms: {
    lightPosition: { value: new THREE.Vector3() },
    shadowFar: { value: CUBE_CAMERA_FAR },
  },
});

// Render process:
scene.overrideMaterial = shadowMaterial;
shadowCubeCamera.update(renderer, scene);
scene.overrideMaterial = null;  // MUST restore original material
```

**Gotchas/Tips**:
- REQUIRED for cube camera point light shadows
- Three.js lacks native CubeDepthTexture, so custom shader is needed
- MUST restore scene.overrideMaterial to null after rendering
- Normalized distance values allow accurate shadow determination

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Disabling Shadows for Internal Lights

**Key Parameters**:
- castShadow: false

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for 'fake' glow without light cost

---

### Section 6: Post-Processing & Bloom (UnrealBloomPass, selective bloom, EffectComposer)

**No techniques found in context**

---

### Section 7: GPU Particle Effects (instanced particles, recycling, GPU animation)

**No techniques found in context**

---

### Section 8: Resource Primitives Catalog (shapes, resource mappings, containment)

**No techniques found in context**

---

### Section 9: PCB Trace Connections (glowing lines, animated flow)

**No techniques found in context**

---

### Section 10: State Visualization & Animation (create/destroy/modify animations, state-driven materials)

**No techniques found in context**

---

### Section 11: Interaction Model (mouse/touch/keyboard, tooltip, selection)

**No techniques found in context**

---

### Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

**Technique**: Performance Tips for Many Light Sources

**Key Parameters**:
- castShadow: false for non-essential lights
- Use cheap lights (AmbientLight, HemisphereLight) for base illumination

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- Minimize shadow-casting lights: Each shadow-casting light adds a render pass
- Use light helpers during development: For positioning lights visually
- Interactive sliders for tuning: Real-time adjustment of intensity, color, position
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

### Section 13: Data Contracts & Integration (state format, API, sync)

**No techniques found in context**

---

### Section 14: Putting It All Together (complete setup, pipeline, parameter table)

**Technique**: Recommended Setup for TRON Dark Scene

**Key Parameters**:
- ambient: 0x050510, intensity 0.1
- hemi: skyColor 0x001122, groundColor 0x000005, intensity 0.2
- internalLight: 0x00ffff, intensity 0.5, distance 10
- shadowLight: 0x6688cc, intensity 0.3
- rimLight: 0x0088ff, intensity 0.4, position (-5, 3, -5)

**Code**:
```javascript
// 1. Very low ambient for base visibility
const ambient = new THREE.AmbientLight(0x050510, 0.1);

// 2. Hemisphere for subtle ground/sky gradient
const hemi = new THREE.HemisphereLight(0x001122, 0x000005, 0.2);

// 3. Internal point lights inside each glowing mesh (no shadows)
const internalLight1 = new THREE.PointLight(0x00ffff, 0.5, 10);
internalLight1.castShadow = false;

// 4. Optional: single shadow-casting light for ground shadows
const shadowLight = new THREE.DirectionalLight(0x6688cc, 0.3);
shadowLight.castShadow = true;

// 5. Rim/edge lighting for object separation
const rimLight = new THREE.PointLight(0x0088ff, 0.4);
rimLight.position.set(-5, 3, -5);

scene.add(ambient, hemi, internalLight1, shadowLight, rimLight);
```

**Gotchas/Tips**:
- Combines all lighting techniques into complete dark scene setup
- Very low ambient prevents pure black while maintaining dark atmosphere
- Single shadow-casting directional light for ground plane shadows only
- Rim light separates glowing objects from dark background

---

### Section 1: Aesthetic Identity

**Technique**: Cool Color Temperature for Dramatic Atmosphere

**Key Parameters**:
- color: 0x6688ff (cool blue)
- color: 0x00ffff (TRON cyan)
- intensity: 0.8-1.0

**Code**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/Tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

### Section 1: Aesthetic Identity

**Technique**: Three-Point Lighting (Adapted for Dark Scenes)

**Key Parameters**:
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)

**Code**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/Tips**:
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Low-Intensity Ambient Light for Dark Scenes

**Key Parameters**:
- color: 0x404040 (dark gray)
- intensity: 0.1-0.5 for dark scenes

**Code**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/Tips**:
- AmbientLight is 'cheap' — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: HemisphereLight for Ground Plane Ambient

**Key Parameters**:
- skyColor: 0x004466 (dark blue)
- groundColor: 0x000011 (near black)
- intensity: 0.2-0.3

**Code**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Gotchas/Tips**:
- HemisphereLight is 'cheap' for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Cinematic Night Scene Setup

**Key Parameters**:
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)

**Code**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/Tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

**No techniques found in context**

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: PointLight for Internal Mesh Lights

**Key Parameters**:
- color: 0xffffff or neon colors (0x00ffff, 0xff00ff)
- intensity: 0.5-0.8
- position: inside mesh primitive
- distance: 10 (for decay)

**Code**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/Tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: RectAreaLight for Panel/Screen Glow

**Key Parameters**:
- color: 0x00ffff (TRON cyan)
- intensity: 1.0
- width: 2
- height: 2

**Code**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Gotchas/Tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: SpotLight for Focused Dramatic Effects

**Key Parameters**:
- color: 0x00ffff
- intensity: 1.0
- angle: Math.PI / 6 (30 degrees)
- penumbra: 0.5

**Code**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/Tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Cube Camera for Omnidirectional Point Light Shadows

**Key Parameters**:
- SHADOW_MAP_SIZE: 256-1024
- CUBE_CAMERA_NEAR: 0.1
- CUBE_CAMERA_FAR: 100
- format: THREE.RGBAFormat
- type: THREE.FloatType

**Code**:
```javascript
const shadowCubeRenderTarget = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: false,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});

const shadowCubeCamera = new THREE.CubeCamera(
  CUBE_CAMERA_NEAR,  // 0.1
  CUBE_CAMERA_FAR,   // 100 (adjust to scene scale)
  shadowCubeRenderTarget
);

// Position at each internal light source
shadowCubeCamera.position.copy(internalLightPosition);
```

**Gotchas/Tips**:
- MAJOR PERFORMANCE COST: 6x scene renders per frame per light
- For many small lights: only enable shadows for key lights
- Use lower resolution for distant lights
- Update shadows only when objects move (not every frame)
- Typical SHADOW_MAP_SIZE: 512 for balance, 256 for performance, 1024 for high quality

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Custom Shadow Material for Cube Depth

**Key Parameters**:
- lightPosition: Vector3 uniform
- shadowFar: float uniform (CUBE_CAMERA_FAR)
- side: THREE.DoubleSide

**Code**:
```javascript
const shadowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 lightPosition;
    uniform float shadowFar;
    varying vec3 vWorldPosition;
    void main() {
      float distance = length(vWorldPosition);
      float normalizedDistance = clamp(distance / shadowFar, 0.0, 1.0);
      gl_FragColor = vec4(normalizedDistance, 0.0, 0.0, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  uniforms: {
    lightPosition: { value: new THREE.Vector3() },
    shadowFar: { value: CUBE_CAMERA_FAR },
  },
});

// Render process:
scene.overrideMaterial = shadowMaterial;
shadowCubeCamera.update(renderer, scene);
scene.overrideMaterial = null;  // MUST restore original material
```

**Gotchas/Tips**:
- REQUIRED for cube camera point light shadows
- Three.js lacks native CubeDepthTexture, so custom shader is needed
- MUST restore scene.overrideMaterial to null after rendering
- Normalized distance values allow accurate shadow determination

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Disabling Shadows for Internal Lights

**Key Parameters**:
- castShadow: false

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for 'fake' glow without light cost

---

### Section 6: Post-Processing & Bloom (UnrealBloomPass, selective bloom, EffectComposer)

**No techniques found in context**

---

### Section 7: GPU Particle Effects (instanced particles, recycling, GPU animation)

**No techniques found in context**

---

### Section 8: Resource Primitives Catalog (shapes, resource mappings, containment)

**No techniques found in context**

---

### Section 9: PCB Trace Connections (glowing lines, animated flow)

**No techniques found in context**

---

### Section 10: State Visualization & Animation (create/destroy/modify animations, state-driven materials)

**No techniques found in context**

---

### Section 11: Interaction Model (mouse/touch/keyboard, tooltip, selection)

**No techniques found in context**

---

### Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

**Technique**: Performance Tips for Many Light Sources

**Key Parameters**:
- castShadow: false for non-essential lights
- Use cheap lights (AmbientLight, HemisphereLight) for base illumination

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- Minimize shadow-casting lights: Each shadow-casting light adds a render pass
- Use light helpers during development: For positioning lights visually
- Interactive sliders for tuning: Real-time adjustment of intensity, color, position
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

### Section 13: Data Contracts & Integration (state format, API, sync)

**No techniques found in context**

---

### Section 14: Putting It All Together (complete setup, pipeline, parameter table)

**Technique**: Recommended Setup for TRON Dark Scene

**Key Parameters**:
- ambient: 0x050510, intensity 0.1
- hemi: skyColor 0x001122, groundColor 0x000005, intensity 0.2
- internalLight: 0x00ffff, intensity 0.5, distance 10
- shadowLight: 0x6688cc, intensity 0.3
- rimLight: 0x0088ff, intensity 0.4, position (-5, 3, -5)

**Code**:
```javascript
// 1. Very low ambient for base visibility
const ambient = new THREE.AmbientLight(0x050510, 0.1);

// 2. Hemisphere for subtle ground/sky gradient
const hemi = new THREE.HemisphereLight(0x001122, 0x000005, 0.2);

// 3. Internal point lights inside each glowing mesh (no shadows)
const internalLight1 = new THREE.PointLight(0x00ffff, 0.5, 10);
internalLight1.castShadow = false;

// 4. Optional: single shadow-casting light for ground shadows
const shadowLight = new THREE.DirectionalLight(0x6688cc, 0.3);
shadowLight.castShadow = true;

// 5. Rim/edge lighting for object separation
const rimLight = new THREE.PointLight(0x0088ff, 0.4);
rimLight.position.set(-5, 3, -5);

scene.add(ambient, hemi, internalLight1, shadowLight, rimLight);
```

**Gotchas/Tips**:
- Combines all lighting techniques into complete dark scene setup
- Very low ambient prevents pure black while maintaining dark atmosphere
- Single shadow-casting directional light for ground plane shadows only
- Rim light separates glowing objects from dark background

---

### Section 1: Aesthetic Identity

**Technique**: Cool Color Temperature for Dramatic Atmosphere

**Key Parameters**:
- color: 0x6688ff (cool blue)
- color: 0x00ffff (TRON cyan)
- intensity: 0.8-1.0

**Code**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/Tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

### Section 1: Aesthetic Identity

**Technique**: Three-Point Lighting (Adapted for Dark Scenes)

**Key Parameters**:
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)

**Code**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/Tips**:
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Low-Intensity Ambient Light for Dark Scenes

**Key Parameters**:
- color: 0x404040 (dark gray)
- intensity: 0.1-0.5 for dark scenes

**Code**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/Tips**:
- AmbientLight is 'cheap' — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: HemisphereLight for Ground Plane Ambient

**Key Parameters**:
- skyColor: 0x004466 (dark blue)
- groundColor: 0x000011 (near black)
- intensity: 0.2-0.3

**Code**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Gotchas/Tips**:
- HemisphereLight is 'cheap' for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Cinematic Night Scene Setup

**Key Parameters**:
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)

**Code**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/Tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

**No techniques found in context**

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: PointLight for Internal Mesh Lights

**Key Parameters**:
- color: 0xffffff or neon colors (0x00ffff, 0xff00ff)
- intensity: 0.5-0.8
- position: inside mesh primitive
- distance: 10 (for decay)

**Code**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/Tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: RectAreaLight for Panel/Screen Glow

**Key Parameters**:
- color: 0x00ffff (TRON cyan)
- intensity: 1.0
- width: 2
- height: 2

**Code**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Gotchas/Tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: SpotLight for Focused Dramatic Effects

**Key Parameters**:
- color: 0x00ffff
- intensity: 1.0
- angle: Math.PI / 6 (30 degrees)
- penumbra: 0.5

**Code**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/Tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Cube Camera for Omnidirectional Point Light Shadows

**Key Parameters**:
- SHADOW_MAP_SIZE: 256-1024
- CUBE_CAMERA_NEAR: 0.1
- CUBE_CAMERA_FAR: 100
- format: THREE.RGBAFormat
- type: THREE.FloatType

**Code**:
```javascript
const shadowCubeRenderTarget = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: false,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});

const shadowCubeCamera = new THREE.CubeCamera(
  CUBE_CAMERA_NEAR,  // 0.1
  CUBE_CAMERA_FAR,   // 100 (adjust to scene scale)
  shadowCubeRenderTarget
);

// Position at each internal light source
shadowCubeCamera.position.copy(internalLightPosition);
```

**Gotchas/Tips**:
- MAJOR PERFORMANCE COST: 6x scene renders per frame per light
- For many small lights: only enable shadows for key lights
- Use lower resolution for distant lights
- Update shadows only when objects move (not every frame)
- Typical SHADOW_MAP_SIZE: 512 for balance, 256 for performance, 1024 for high quality

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Custom Shadow Material for Cube Depth

**Key Parameters**:
- lightPosition: Vector3 uniform
- shadowFar: float uniform (CUBE_CAMERA_FAR)
- side: THREE.DoubleSide

**Code**:
```javascript
const shadowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 lightPosition;
    uniform float shadowFar;
    varying vec3 vWorldPosition;
    void main() {
      float distance = length(vWorldPosition);
      float normalizedDistance = clamp(distance / shadowFar, 0.0, 1.0);
      gl_FragColor = vec4(normalizedDistance, 0.0, 0.0, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  uniforms: {
    lightPosition: { value: new THREE.Vector3() },
    shadowFar: { value: CUBE_CAMERA_FAR },
  },
});

// Render process:
scene.overrideMaterial = shadowMaterial;
shadowCubeCamera.update(renderer, scene);
scene.overrideMaterial = null;  // MUST restore original material
```

**Gotchas/Tips**:
- REQUIRED for cube camera point light shadows
- Three.js lacks native CubeDepthTexture, so custom shader is needed
- MUST restore scene.overrideMaterial to null after rendering
- Normalized distance values allow accurate shadow determination

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Disabling Shadows for Internal Lights

**Key Parameters**:
- castShadow: false

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for 'fake' glow without light cost

---

### Section 6: Post-Processing & Bloom (UnrealBloomPass, selective bloom, EffectComposer)

**No techniques found in context**

---

### Section 7: GPU Particle Effects (instanced particles, recycling, GPU animation)

**No techniques found in context**

---

### Section 8: Resource Primitives Catalog (shapes, resource mappings, containment)

**No techniques found in context**

---

### Section 9: PCB Trace Connections (glowing lines, animated flow)

**No techniques found in context**

---

### Section 10: State Visualization & Animation (create/destroy/modify animations, state-driven materials)

**No techniques found in context**

---

### Section 11: Interaction Model (mouse/touch/keyboard, tooltip, selection)

**No techniques found in context**

---

### Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

**Technique**: Performance Tips for Many Light Sources

**Key Parameters**:
- castShadow: false for non-essential lights
- Use cheap lights (AmbientLight, HemisphereLight) for base illumination

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- Minimize shadow-casting lights: Each shadow-casting light adds a render pass
- Use light helpers during development: For positioning lights visually
- Interactive sliders for tuning: Real-time adjustment of intensity, color, position
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

### Section 13: Data Contracts & Integration (state format, API, sync)

**No techniques found in context**

---

### Section 14: Putting It All Together (complete setup, pipeline, parameter table)

**Technique**: Recommended Setup for TRON Dark Scene

**Key Parameters**:
- ambient: 0x050510, intensity 0.1
- hemi: skyColor 0x001122, groundColor 0x000005, intensity 0.2
- internalLight: 0x00ffff, intensity 0.5, distance 10
- shadowLight: 0x6688cc, intensity 0.3
- rimLight: 0x0088ff, intensity 0.4, position (-5, 3, -5)

**Code**:
```javascript
// 1. Very low ambient for base visibility
const ambient = new THREE.AmbientLight(0x050510, 0.1);

// 2. Hemisphere for subtle ground/sky gradient
const hemi = new THREE.HemisphereLight(0x001122, 0x000005, 0.2);

// 3. Internal point lights inside each glowing mesh (no shadows)
const internalLight1 = new THREE.PointLight(0x00ffff, 0.5, 10);
internalLight1.castShadow = false;

// 4. Optional: single shadow-casting light for ground shadows
const shadowLight = new THREE.DirectionalLight(0x6688cc, 0.3);
shadowLight.castShadow = true;

// 5. Rim/edge lighting for object separation
const rimLight = new THREE.PointLight(0x0088ff, 0.4);
rimLight.position.set(-5, 3, -5);

scene.add(ambient, hemi, internalLight1, shadowLight, rimLight);
```

**Gotchas/Tips**:
- Combines all lighting techniques into complete dark scene setup
- Very low ambient prevents pure black while maintaining dark atmosphere
- Single shadow-casting directional light for ground plane shadows only
- Rim light separates glowing objects from dark background

---

### Section 1: Aesthetic Identity

**Technique**: Cool Color Temperature for Dramatic Atmosphere

**Key Parameters**:
- color: 0x6688ff (cool blue)
- color: 0x00ffff (TRON cyan)
- intensity: 0.8-1.0

**Code**:
```javascript
// Cool blue light for dramatic atmosphere
const coolLight = new THREE.PointLight(0x6688ff, 1.0);
// Or for TRON cyan
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```

**Gotchas/Tips**:
- Balance cool lights with occasional warm accent for visual interest
- Color temperature affects perceived brightness — cooler can feel dimmer
- Combine with fog of similar color for atmospheric depth

---

### Section 1: Aesthetic Identity

**Technique**: Three-Point Lighting (Adapted for Dark Scenes)

**Key Parameters**:
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)

**Code**:
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```

**Gotchas/Tips**:
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Low-Intensity Ambient Light for Dark Scenes

**Key Parameters**:
- color: 0x404040 (dark gray)
- intensity: 0.1-0.5 for dark scenes

**Code**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/Tips**:
- AmbientLight is 'cheap' — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: HemisphereLight for Ground Plane Ambient

**Key Parameters**:
- skyColor: 0x004466 (dark blue)
- groundColor: 0x000011 (near black)
- intensity: 0.2-0.3

**Code**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Gotchas/Tips**:
- HemisphereLight is 'cheap' for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

### Section 2: Scene Foundation (renderer, camera, ground, ambient light)

**Technique**: Cinematic Night Scene Setup

**Key Parameters**:
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)

**Code**:
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```

**Gotchas/Tips**:
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

### Section 3: Frosted Glass Materials (MeshPhysicalMaterial, transmission, emissive)

**No techniques found in context**

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: PointLight for Internal Mesh Lights

**Key Parameters**:
- color: 0xffffff or neon colors (0x00ffff, 0xff00ff)
- intensity: 0.5-0.8
- position: inside mesh primitive
- distance: 10 (for decay)

**Code**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/Tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: RectAreaLight for Panel/Screen Glow

**Key Parameters**:
- color: 0x00ffff (TRON cyan)
- intensity: 1.0
- width: 2
- height: 2

**Code**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Gotchas/Tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

### Section 4: Internal Lighting (PointLight, many lights, RectAreaLight)

**Technique**: SpotLight for Focused Dramatic Effects

**Key Parameters**:
- color: 0x00ffff
- intensity: 1.0
- angle: Math.PI / 6 (30 degrees)
- penumbra: 0.5

**Code**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/Tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Cube Camera for Omnidirectional Point Light Shadows

**Key Parameters**:
- SHADOW_MAP_SIZE: 256-1024
- CUBE_CAMERA_NEAR: 0.1
- CUBE_CAMERA_FAR: 100
- format: THREE.RGBAFormat
- type: THREE.FloatType

**Code**:
```javascript
const shadowCubeRenderTarget = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: false,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});

const shadowCubeCamera = new THREE.CubeCamera(
  CUBE_CAMERA_NEAR,  // 0.1
  CUBE_CAMERA_FAR,   // 100 (adjust to scene scale)
  shadowCubeRenderTarget
);

// Position at each internal light source
shadowCubeCamera.position.copy(internalLightPosition);
```

**Gotchas/Tips**:
- MAJOR PERFORMANCE COST: 6x scene renders per frame per light
- For many small lights: only enable shadows for key lights
- Use lower resolution for distant lights
- Update shadows only when objects move (not every frame)
- Typical SHADOW_MAP_SIZE: 512 for balance, 256 for performance, 1024 for high quality

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Custom Shadow Material for Cube Depth

**Key Parameters**:
- lightPosition: Vector3 uniform
- shadowFar: float uniform (CUBE_CAMERA_FAR)
- side: THREE.DoubleSide

**Code**:
```javascript
const shadowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 lightPosition;
    uniform float shadowFar;
    varying vec3 vWorldPosition;
    void main() {
      float distance = length(vWorldPosition);
      float normalizedDistance = clamp(distance / shadowFar, 0.0, 1.0);
      gl_FragColor = vec4(normalizedDistance, 0.0, 0.0, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  uniforms: {
    lightPosition: { value: new THREE.Vector3() },
    shadowFar: { value: CUBE_CAMERA_FAR },
  },
});

// Render process:
scene.overrideMaterial = shadowMaterial;
shadowCubeCamera.update(renderer, scene);
scene.overrideMaterial = null;  // MUST restore original material
```

**Gotchas/Tips**:
- REQUIRED for cube camera point light shadows
- Three.js lacks native CubeDepthTexture, so custom shader is needed
- MUST restore scene.overrideMaterial to null after rendering
- Normalized distance values allow accurate shadow determination

---

### Section 5: Shadows (shadow maps, contact shadows, selective casting)

**Technique**: Disabling Shadows for Internal Lights

**Key Parameters**:
- castShadow: false

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for 'fake' glow without light cost

---

### Section 6: Post-Processing & Bloom (UnrealBloomPass, selective bloom, EffectComposer)

**No techniques found in context**

---

### Section 7: GPU Particle Effects (instanced particles, recycling, GPU animation)

**No techniques found in context**

---

### Section 8: Resource Primitives Catalog (shapes, resource mappings, containment)

**No techniques found in context**

---

### Section 9: PCB Trace Connections (glowing lines, animated flow)

**No techniques found in context**

---

### Section 10: State Visualization & Animation (create/destroy/modify animations, state-driven materials)

**No techniques found in context**

---

### Section 11: Interaction Model (mouse/touch/keyboard, tooltip, selection)

**No techniques found in context**

---

### Section 12: Performance Guide (light budget, instancing, LOD, shadow budget)

**Technique**: Performance Tips for Many Light Sources

**Key Parameters**:
- castShadow: false for non-essential lights
- Use cheap lights (AmbientLight, HemisphereLight) for base illumination

**Code**:
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/Tips**:
- Minimize shadow-casting lights: Each shadow-casting light adds a render pass
- Use light helpers during development: For positioning lights visually
- Interactive sliders for tuning: Real-time adjustment of intensity, color, position
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

### Section 13: Data Contracts & Integration (state format, API, sync)

**No techniques found in context**

---

### Section 14: Putting It All Together (complete setup, pipeline, parameter table)

**Technique**: Recommended Setup for TRON Dark Scene

**Key Parameters**:
- ambient: 0x050510, intensity 0.1
- hemi: skyColor 0x001122, groundColor 0x000005, intensity 0.2
- internalLight: 0x00ffff, intensity 0.5, distance 10
- shadowLight: 0x6688cc, intensity 0.3
- rimLight: 0x0088ff, intensity 0.4, position (-5, 3, -5)

**Code**:
```javascript
// 1. Very low ambient for base visibility
const ambient = new THREE.AmbientLight(0x050510, 0.1);

// 2. Hemisphere for subtle ground/sky gradient
const hemi = new THREE.HemisphereLight(0x001122, 0x000005, 0.2);

// 3. Internal point lights inside each glowing mesh (no shadows)
const internalLight1 = new THREE.PointLight(0x00ffff, 0.5, 10);
internalLight1.castShadow = false;

// 4. Optional: single shadow-casting light for ground shadows
const shadowLight = new THREE.DirectionalLight(0x6688cc, 0.3);
shadowLight.castShadow = true;

// 5. Rim/edge lighting for object separation
const rimLight = new THREE.PointLight(0x0088ff, 0.4);
rimLight.position.set(-5, 3, -5);

scene.add(ambient, hemi, internalLight1, shadowLight, rimLight);
```

**Gotchas/Tips**:
- Combines all lighting techniques into complete dark scene setup
- Very low ambient prevents pure black while maintaining dark atmosphere
- Single shadow-casting directional light for ground plane shadows only
- Rim light separates glowing objects from dark background

---

## Section 12
### Shadow LOD
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Only key lights cast shadows

## Section 12
### Static Shadows
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Update only when objects move

## Section 12
### Distance-Based Shadow Resolution
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Lower resolution for distant lights

## Section 12
### Skip Shadows for Accent Lights
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- For tiny accent lights entirely

## Section 12
### Fake Small Lights
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** Emissive materials, Bloom post-processing
**Gotchas/Tips:**
- Use emissive materials + bloom instead of actual point lights

## Section 12
### Deferred Rendering
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Consider for 5+ lights

## Section 12
### Early Exit Checks
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Always include depth/far-plane checks

## Section 12
### Shadow Format Optimization
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** Half-float formats
**Gotchas/Tips:**
- Compress shadow data, use half-float formats

---

**Chunk 6 Summary:** 8 techniques extracted from Section 12 (Performance Guide), all focused on shadow optimization and lighting performance strategies. No code snippets present in this chunk.Test## Section 6 (Partial)
### Volumetric Lighting Effect (Basic Implementation)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor() {
    const uniforms = new Map([
      ['projectionMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['viewMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['cameraPosition', new THREE.Uniform(new THREE.Vector3())],
      ['cameraFar', new THREE.Uniform(500)],
    ]);
    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,  // Exposes depthBuffer
      uniforms,
    });
  }
}
```
**Key Parameters:**
- projectionMatrixInverse: THREE.Matrix4
- viewMatrixInverse: THREE.Matrix4
- cameraPosition: THREE.Vector3
- cameraFar: 500 (default)
**Gotchas/Tips:**
- Matrix multiplication order is CRITICAL: projectionMatrixInverse THEN viewMatrixInverse
- The /world.w perspective divide is mandatory or positions will be wrong
- Requires EffectAttribute.DEPTH to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

## Section 9
### Depth-Based Stopping for Volumetric Effects
**Code:**
```glsl
// Calculate distance to closest scene geometry
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  // Stop if we've hit scene geometry or exceeded far plane
  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  
  // ... accumulate light ...
  t += STEP_SIZE;
}
```
**Key Parameters:**
- sceneDepth: From depth buffer via world position reconstruction
- cameraFar: Camera far plane distance
**Gotchas/Tips:**
- Essential for preventing light leaking through walls
- sceneDepth comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

## Section 6.1
### Volumetric Lighting Post-Processing Effect (Complete)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor(
    cameraFar = 500,
    projectionMatrixInverse = new THREE.Matrix4(),
    viewMatrixInverse = new THREE.Matrix4(),
    cameraPosition = new THREE.Vector3(),
    lightDirection = new THREE.Vector3(),
    lightPosition = new THREE.Vector3(),
    coneAngle = 40.0
  ) {
    const uniforms = new Map([
      ['cameraFar', new THREE.Uniform(cameraFar)],
      ['projectionMatrixInverse', new THREE.Uniform(projectionMatrixInverse)],
      ['viewMatrixInverse', new THREE.Uniform(viewMatrixInverse)],
      ['cameraPosition', new THREE.Uniform(cameraPosition)],
      ['lightDirection', new THREE.Uniform(lightDirection)],
      ['lightPosition', new THREE.Uniform(lightPosition)],
      ['coneAngle', new THREE.Uniform(coneAngle)],
    ]);

    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    // Update matrices each frame
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    // ... update other uniforms
  }
}
```
**Key Parameters:**
- cameraFar: 500 (default) - Camera far plane distance
- coneAngle: 40.0 (default) - Light cone angle in degrees
- EffectAttribute.DEPTH: required - Enables depth buffer access in shader
**Gotchas/Tips:**
- EffectAttribute.DEPTH required to access depthBuffer in shader
- Update uniforms in update(), not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---

## Section 12
### Performance Tips for Many Light Sources
**Code:**
N/A (conceptual techniques)
**Key Parameters:**
- N/A
**Gotchas/Tips:**
- Use cheap lights for base illumination: AmbientLight, HemisphereLight have minimal cost
- Many PointLights = performance concern. Consider:
  - Using fewer lights with larger influence radius
  - Baking static lights into lightmaps
  - Using emissive materials + bloom post-processing instead of actual lights for some objects
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Section 1
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:**
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)
**Gotchas/Tips:**
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 2
### Cinematic Night Scene Setup
**Code:**
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```
**Key Parameters:**
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)
**Gotchas/Tips:**
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

## Section 3
### Frosted Glass Materials
**Code:**
N/A (section truncated in document)
**Key Parameters:**
- MeshPhysicalMaterial with transmission + roughness
**Gotchas/Tips:**
- Uses transmission and roughness for frosted glass effect
## Section 6 (Partial)
### Volumetric Lighting Effect (Basic Implementation)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor() {
    const uniforms = new Map([
      ['projectionMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['viewMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['cameraPosition', new THREE.Uniform(new THREE.Vector3())],
      ['cameraFar', new THREE.Uniform(500)],
    ]);
    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,  // Exposes depthBuffer
      uniforms,
    });
  }
}
```
**Key Parameters:**
- projectionMatrixInverse: THREE.Matrix4
- viewMatrixInverse: THREE.Matrix4
- cameraPosition: THREE.Vector3
- cameraFar: 500 (default)
**Gotchas/Tips:**
- Matrix multiplication order is CRITICAL: projectionMatrixInverse THEN viewMatrixInverse
- The /world.w perspective divide is mandatory or positions will be wrong
- Requires EffectAttribute.DEPTH to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

## Section 9
### Depth-Based Stopping for Volumetric Effects
**Code:**
```glsl
// Calculate distance to closest scene geometry
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  // Stop if we've hit scene geometry or exceeded far plane
  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  
  // ... accumulate light ...
  t += STEP_SIZE;
}
```
**Key Parameters:**
- sceneDepth: From depth buffer via world position reconstruction
- cameraFar: Camera far plane distance
**Gotchas/Tips:**
- Essential for preventing light leaking through walls
- sceneDepth comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

## Section 6.1
### Volumetric Lighting Post-Processing Effect (Complete)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor(
    cameraFar = 500,
    projectionMatrixInverse = new THREE.Matrix4(),
    viewMatrixInverse = new THREE.Matrix4(),
    cameraPosition = new THREE.Vector3(),
    lightDirection = new THREE.Vector3(),
    lightPosition = new THREE.Vector3(),
    coneAngle = 40.0
  ) {
    const uniforms = new Map([
      ['cameraFar', new THREE.Uniform(cameraFar)],
      ['projectionMatrixInverse', new THREE.Uniform(projectionMatrixInverse)],
      ['viewMatrixInverse', new THREE.Uniform(viewMatrixInverse)],
      ['cameraPosition', new THREE.Uniform(cameraPosition)],
      ['lightDirection', new THREE.Uniform(lightDirection)],
      ['lightPosition', new THREE.Uniform(lightPosition)],
      ['coneAngle', new THREE.Uniform(coneAngle)],
    ]);

    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    // Update matrices each frame
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    // ... update other uniforms
  }
}
```
**Key Parameters:**
- cameraFar: 500 (default) - Camera far plane distance
- coneAngle: 40.0 (default) - Light cone angle in degrees
- EffectAttribute.DEPTH: required - Enables depth buffer access in shader
**Gotchas/Tips:**
- EffectAttribute.DEPTH required to access depthBuffer in shader
- Update uniforms in update(), not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---

## Section 12
### Performance Tips for Many Light Sources
**Code:**
N/A (conceptual techniques)
**Key Parameters:**
- N/A
**Gotchas/Tips:**
- Use cheap lights for base illumination: AmbientLight, HemisphereLight have minimal cost
- Many PointLights = performance concern. Consider:
  - Using fewer lights with larger influence radius
  - Baking static lights into lightmaps
  - Using emissive materials + bloom post-processing instead of actual lights for some objects
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Section 1
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:**
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)
**Gotchas/Tips:**
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 2
### Cinematic Night Scene Setup
**Code:**
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```
**Key Parameters:**
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)
**Gotchas/Tips:**
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

## Section 3
### Frosted Glass Materials
**Code:**
N/A (section truncated in document)
**Key Parameters:**
- MeshPhysicalMaterial with transmission + roughness
**Gotchas/Tips:**
- Uses transmission and roughness for frosted glass effect
## Section 3 (continuation)
### HGPhase (Henvey-Greenstein Phase Function)
**Code:**
```javascript
float HGPhase(float mu, float g) {
  float gg = g * g;
  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);
  float scatter = (1.0 - gg) / pow(denom, 1.5);
  return scatter;
}

// Usage:
float mu = dot(rayDir, -lightDir);
float g = 0.5;
float scatterPhase = HGPhase(mu, g);
vec3 luminance = lightColor * intensity * attenuation * scatterPhase;
```
**Key Parameters:** - mu: cosine of scattering angle
- g: scattering parameter (0.5 for forward)
**Gotchas/Tips:** - For frosted glass: g = 0.3-0.5
- Higher g = focused beam
- Lower g = diffuse glow
- Negative g = rim-lighting effects

---

## Section 4
### PointLight for Internal Mesh Lights
**Code:**
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);

// For TRON cyan internal light
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```
**Key Parameters:** - First param: color (hex)
- Second param: intensity
- Third param: distance limit
**Gotchas/Tips:** - Third parameter is distance limit
- Each PointLight adds render cost
- Consider lower intensity with higher count
- Each shadow-casting PointLight adds render pass
- Disable shadows on most for performance

---

## Section 4
### RectAreaLight for Panel/Screen Glow
**Code:**
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```
**Key Parameters:** - Color: 0x00ffff (cyan)
- Intensity: 1.0
- Width: 2
- Height: 2
**Gotchas/Tips:** - Requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Section 4
### SpotLight for Focused Dramatic Effects
**Code:**
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
spotlight.angle = Math.PI / 6; // 30 degrees
spotlight.penumbra = 0.5; // soft edges
scene.add(spotlight);
scene.add(spotlight.target);
```
**Key Parameters:** - angle: cone angle (Math.PI / 6 = 30 degrees)
- penumbra: soft edge factor (0.5 = soft edges)
**Gotchas/Tips:** - Both spotlight AND its target must be added to scene
- Good for focused pools of light
- Can cast shadows - use selectively for performance
- Penumbra creates soft glow at edges

---

## Section 4
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source)
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:** - Key light: main source
- Fill light: softens shadows
- Rim light: separates subject from background
**Gotchas/Tips:** - For internal mesh lights, 'key' is PointLight inside each mesh
- Reduce fill light intensity for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 4
### Combining Lights for Atmospheric Effects
**Code:**
```javascript
// Soft ambient for moody interiors
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.15);
scene.add(ambientLight);

// Multiple colored point lights for neon effect
const cyanLight = new THREE.PointLight(0x00ffff, 0.8, 50);
const magentaLight = new THREE.PointLight(0xff00ff, 0.6, 50);
```
**Key Parameters:** - Ambient: color 0x0a0a1a, intensity 0.15
- Cyan point light: 0x00ffff, intensity 0.8, distance 50
- Magenta point light: 0xff00ff, intensity 0.6, distance 50
**Gotchas/Tips:** - Soft ambient for moody interiors
- Balance intensities carefully - too many lights wash out dark aesthetic
- Use complementary neon colors for TRON-like look

---

## Section 7
### SDF-Based Light Volume Shaping
**Code:**
```javascript
// Cylinder SDF - for tubular neon-like objects
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + projectionLength * axisDir;
  float distanceToAxis = length(p - closestPointOnAxis);
  return distanceToAxis - radius;
}

// Sphere SDF - for rounded glass primitives
float sdSphere(vec3 p, vec3 center, float radius) {
  return length(p - center) - radius;
}

// Box SDF - for rectangular glass blocks
float sdBox(vec3 p, vec3 center, vec3 halfSize) {
  vec3 q = abs(p - center) - halfSize;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Apply with soft edges for glow:
float smoothEdgeWidth = 0.1;
float sdfVal = sdSphere(samplePos, objectCenter, objectRadius);
float shapeFactor = smoothstep(0.0, -smoothEdgeWidth, sdfVal);

// Use in light accumulation:
fogAmount += attenuation * lightIntensity * shapeFactor;
```
**Key Parameters:** - smoothEdgeWidth: 0.1 for soft falloff at edges
- shapeFactor: smoothstep result for light shaping
**Gotchas/Tips:** - smoothstep creates soft falloff at edges - adjust smoothEdgeWidth for sharp/soft edges (truncated in source)

---

test output## Section 5
### Shadow Mapping for Ground Plane Shadows
**Code:**
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
```
**Gotchas/Tips:**
- Each light that should cast shadows needs `castShadow = true`
- Meshes need `castShadow` and `receiveShadow` properties set
- For soft shadows, configure shadow map properties: `light.shadow.mapSize.width` and `light.shadow.mapSize.height`, `light.shadow.radius` for soft shadow edges
- Performance impact increases with shadow-casting lights

## Section 5
### Cube Camera for Omnidirectional Shadows
**Key Parameters:**
- `0`: CubeCamera
- `1`: WebGLCubeRenderTarget
- `2`: shadow maps
- `3`: 6 faces per light
**Gotchas/Tips:**
- This is a workaround, not production-grade
- MUST restore original materials after cube camera render
- Performance scales with scene complexity × 6 faces per light
- For static scenes, render shadow maps once and reuse

## Section 5
### Cube Shadow Sampling in Fragment Shader
**Code:**
```javascript
uniform samplerCube shadowMapCube;
uniform vec3 lightPosition;
uniform float shadowBias;
uniform float CUBE_CAMERA_FAR;

float calculateShadowCube(vec3 worldPosition) {
  vec3 dirToLight = worldPosition - lightPosition;
  float distToLight = length(dirToLight);
  
  vec3 direction = normalize(dirToLight);
  float sampledDist = texture(shadowMapCube, direction).r;
  float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
  
  if (distToLight > shadowMapDist + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}
```
**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `CUBE_CAMERA_FAR`: Must match cube camera far plane
- `samples`: 20 for PCF soft shadows
- `PCF offset`: 0.01 adjustable based on scene scale
**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne (self-shadowing speckles)
- For soft shadows, implement PCF by sampling multiple directions with small offsets
- The 0.01 offset in PCF should be adjusted based on your scene scale

## Section 5
### Shadow Map Setup for Directional/Spot Lights
**Code:**
```javascript
const lightCamera = new THREE.PerspectiveCamera(90, 1.0, 0.1, 100);
lightCamera.fov = coneAngle;  // Match to light cone angle

const shadowFBO = new THREE.WebGLRenderTarget(shadowMapSize, shadowMapSize, {
  depth: true,
  depthTexture: new THREE.DepthTexture(
    shadowMapSize, 
    shadowMapSize, 
    THREE.FloatType
  ),
});

// Render shadow map each frame (or once if static):
lightCamera.position.copy(lightPosition);
lightCamera.lookAt(lightTarget);
lightCamera.updateMatrixWorld();
lightCamera.updateProjectionMatrix();

renderer.setRenderTarget(shadowFBO);
renderer.clear(false, true, false);
renderer.render(scene, lightCamera);
renderer.setRenderTarget(null);
```
**Key Parameters:**
- `shadowMapSize`: 512 = balance, 256 = performance, 1024 = high quality
- `FOV`: Should match light's cone angle
- `near/far`: Should tightly bound scene for better depth precision
**Gotchas/Tips:**
- FOV should match your light's cone angle
- Near/far planes should tightly bound scene for better depth precision
- Shadow map resolution: 512 = good balance, 256 = performance, 1024 = high quality
- For static objects, render shadow map ONCE and reuse

## Section 5
### Shadow Calculation from Light View
**Code:**
```javascript
uniform sampler2D shadowMap;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;
uniform float shadowBias;

float calculateShadow(vec3 worldPosition) {
  // Transform to light's clip space
  vec4 lightClipPos = lightProjectionMatrix * lightViewMatrix * vec4(worldPosition, 1.0);
  vec3 lightNDC = lightClipPos.xyz / lightClipPos.w;

  // Convert to shadow map UV coordinates  
  vec2 shadowCoord = lightNDC.xy * 0.5 + 0.5;
  float lightDepth = lightNDC.z * 0.5 + 0.5;

  // Check bounds - outside shadow map = assume lit
  if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
      shadowCoord.y < 0.0 || shadowCoord.y > 1.0 ||
      lightDepth > 1.0) {
    return 1.0;
  }

  float shadowMapDepth = texture2D(shadowMap, shadowCoord).x;

  // Compare depths with bias
  if (lightDepth > shadowMapDepth + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}
```
**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `lightViewMatrix`: Light's view transformation
- `lightProjectionMatrix`: Light's projection transformation
**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne
- Use continue not break in loops - points beyond shadow may still be lit
- For soft shadows, sample multiple neighboring texels (PCF)
- Three.js/WebGL uses OpenGL UV convention (Y up in NDC)

## Section 6
### Blue Noise Dithering
**Code:**
```javascript
uniform sampler2D blueNoiseTexture;
uniform int frame;

// At start of raymarching loop:
float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame % 32) / sqrt(0.5));
float t = STEP_SIZE * offset;  // Start ray at randomized offset

// Now can use significantly fewer steps:
const int NUM_STEPS = 50;   // Instead of 200-250
const float STEP_SIZE = 0.1;
```
**Key Parameters:**
- `NUM_STEPS`: 50 (reduced from 200-250)
- `frame % 32`: Prevents float precision loss
- `1024.0`: Should match blue noise texture size
**Gotchas/Tips:**
- frame % 32 prevents float precision loss (don't use larger modulus)
- Blue noise texture should be wrapping/repeat mode
- The 1024.0 divisor should match your blue noise texture size
- Works best combined with temporal anti-aliasing (TAA) for even smoother results
- Download blue noise textures from: momentsingraphics.de

## Section 6
### World Position Reconstruction from Screen Space
**Code:**
```javascript
// GLSL
vec3 getWorldPosition(vec2 uv, float depth) {
  float clipZ = depth * 2.0 - 1.0;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, clipZ, 1.0);

  vec4 view = projectionMatrixInverse * clip;
  vec4 world = viewMatrixInverse * view;

  return world.xyz / world.w;  // Perspective divide is MANDATORY
}
```
**Key Parameters:**
- `EffectAttribute.DEPTH`: Required to access depth buffer
- `projectionMatrixInverse`: First matrix to apply
- `viewMatrixInverse`: Second matrix to apply

## Section 12
### Shadow LOD
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Only key lights cast shadows

## Section 12
### Static Shadows
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Update only when objects move

## Section 12
### Distance-Based Shadow Resolution
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Lower resolution for distant lights

## Section 12
### Skip Shadows for Accent Lights
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- For tiny accent lights entirely

## Section 12
### Fake Small Lights
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** Emissive materials, Bloom post-processing
**Gotchas/Tips:**
- Use emissive materials + bloom instead of actual point lights

## Section 12
### Deferred Rendering
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Consider for 5+ lights

## Section 12
### Early Exit Checks
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** *(None specified)*
**Gotchas/Tips:**
- Always include depth/far-plane checks

## Section 12
### Shadow Format Optimization
**Code:**
```javascript
*(No code snippet in this chunk)*
```
**Key Parameters:** Half-float formats
**Gotchas/Tips:**
- Compress shadow data, use half-float formats

---

**Chunk 6 Summary:** 8 techniques extracted from Section 12 (Performance Guide), all focused on shadow optimization and lighting performance strategies. No code snippets present in this chunk.Test## Section 6 (Partial)
### Volumetric Lighting Effect (Basic Implementation)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor() {
    const uniforms = new Map([
      ['projectionMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['viewMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['cameraPosition', new THREE.Uniform(new THREE.Vector3())],
      ['cameraFar', new THREE.Uniform(500)],
    ]);
    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,  // Exposes depthBuffer
      uniforms,
    });
  }
}
```
**Key Parameters:**
- projectionMatrixInverse: THREE.Matrix4
- viewMatrixInverse: THREE.Matrix4
- cameraPosition: THREE.Vector3
- cameraFar: 500 (default)
**Gotchas/Tips:**
- Matrix multiplication order is CRITICAL: projectionMatrixInverse THEN viewMatrixInverse
- The /world.w perspective divide is mandatory or positions will be wrong
- Requires EffectAttribute.DEPTH to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

## Section 9
### Depth-Based Stopping for Volumetric Effects
**Code:**
```glsl
// Calculate distance to closest scene geometry
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  // Stop if we've hit scene geometry or exceeded far plane
  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  
  // ... accumulate light ...
  t += STEP_SIZE;
}
```
**Key Parameters:**
- sceneDepth: From depth buffer via world position reconstruction
- cameraFar: Camera far plane distance
**Gotchas/Tips:**
- Essential for preventing light leaking through walls
- sceneDepth comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

## Section 6.1
### Volumetric Lighting Post-Processing Effect (Complete)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor(
    cameraFar = 500,
    projectionMatrixInverse = new THREE.Matrix4(),
    viewMatrixInverse = new THREE.Matrix4(),
    cameraPosition = new THREE.Vector3(),
    lightDirection = new THREE.Vector3(),
    lightPosition = new THREE.Vector3(),
    coneAngle = 40.0
  ) {
    const uniforms = new Map([
      ['cameraFar', new THREE.Uniform(cameraFar)],
      ['projectionMatrixInverse', new THREE.Uniform(projectionMatrixInverse)],
      ['viewMatrixInverse', new THREE.Uniform(viewMatrixInverse)],
      ['cameraPosition', new THREE.Uniform(cameraPosition)],
      ['lightDirection', new THREE.Uniform(lightDirection)],
      ['lightPosition', new THREE.Uniform(lightPosition)],
      ['coneAngle', new THREE.Uniform(coneAngle)],
    ]);

    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    // Update matrices each frame
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    // ... update other uniforms
  }
}
```
**Key Parameters:**
- cameraFar: 500 (default) - Camera far plane distance
- coneAngle: 40.0 (default) - Light cone angle in degrees
- EffectAttribute.DEPTH: required - Enables depth buffer access in shader
**Gotchas/Tips:**
- EffectAttribute.DEPTH required to access depthBuffer in shader
- Update uniforms in update(), not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---

## Section 12
### Performance Tips for Many Light Sources
**Code:**
N/A (conceptual techniques)
**Key Parameters:**
- N/A
**Gotchas/Tips:**
- Use cheap lights for base illumination: AmbientLight, HemisphereLight have minimal cost
- Many PointLights = performance concern. Consider:
  - Using fewer lights with larger influence radius
  - Baking static lights into lightmaps
  - Using emissive materials + bloom post-processing instead of actual lights for some objects
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Section 1
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:**
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)
**Gotchas/Tips:**
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 2
### Cinematic Night Scene Setup
**Code:**
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```
**Key Parameters:**
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)
**Gotchas/Tips:**
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

## Section 3
### Frosted Glass Materials
**Code:**
N/A (section truncated in document)
**Key Parameters:**
- MeshPhysicalMaterial with transmission + roughness
**Gotchas/Tips:**
- Uses transmission and roughness for frosted glass effect
## Section 6 (Partial)
### Volumetric Lighting Effect (Basic Implementation)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor() {
    const uniforms = new Map([
      ['projectionMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['viewMatrixInverse', new THREE.Uniform(new THREE.Matrix4())],
      ['cameraPosition', new THREE.Uniform(new THREE.Vector3())],
      ['cameraFar', new THREE.Uniform(500)],
    ]);
    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,  // Exposes depthBuffer
      uniforms,
    });
  }
}
```
**Key Parameters:**
- projectionMatrixInverse: THREE.Matrix4
- viewMatrixInverse: THREE.Matrix4
- cameraPosition: THREE.Vector3
- cameraFar: 500 (default)
**Gotchas/Tips:**
- Matrix multiplication order is CRITICAL: projectionMatrixInverse THEN viewMatrixInverse
- The /world.w perspective divide is mandatory or positions will be wrong
- Requires EffectAttribute.DEPTH to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

## Section 9
### Depth-Based Stopping for Volumetric Effects
**Code:**
```glsl
// Calculate distance to closest scene geometry
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  // Stop if we've hit scene geometry or exceeded far plane
  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  
  // ... accumulate light ...
  t += STEP_SIZE;
}
```
**Key Parameters:**
- sceneDepth: From depth buffer via world position reconstruction
- cameraFar: Camera far plane distance
**Gotchas/Tips:**
- Essential for preventing light leaking through walls
- sceneDepth comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

## Section 6.1
### Volumetric Lighting Post-Processing Effect (Complete)
**Code:**
```javascript
import { Effect, EffectAttribute } from 'postprocessing';

class VolumetricLightingEffectImpl extends Effect {
  constructor(
    cameraFar = 500,
    projectionMatrixInverse = new THREE.Matrix4(),
    viewMatrixInverse = new THREE.Matrix4(),
    cameraPosition = new THREE.Vector3(),
    lightDirection = new THREE.Vector3(),
    lightPosition = new THREE.Vector3(),
    coneAngle = 40.0
  ) {
    const uniforms = new Map([
      ['cameraFar', new THREE.Uniform(cameraFar)],
      ['projectionMatrixInverse', new THREE.Uniform(projectionMatrixInverse)],
      ['viewMatrixInverse', new THREE.Uniform(viewMatrixInverse)],
      ['cameraPosition', new THREE.Uniform(cameraPosition)],
      ['lightDirection', new THREE.Uniform(lightDirection)],
      ['lightPosition', new THREE.Uniform(lightPosition)],
      ['coneAngle', new THREE.Uniform(coneAngle)],
    ]);

    super('VolumetricLightingEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    // Update matrices each frame
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    // ... update other uniforms
  }
}
```
**Key Parameters:**
- cameraFar: 500 (default) - Camera far plane distance
- coneAngle: 40.0 (default) - Light cone angle in degrees
- EffectAttribute.DEPTH: required - Enables depth buffer access in shader
**Gotchas/Tips:**
- EffectAttribute.DEPTH required to access depthBuffer in shader
- Update uniforms in update(), not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---

## Section 12
### Performance Tips for Many Light Sources
**Code:**
N/A (conceptual techniques)
**Key Parameters:**
- N/A
**Gotchas/Tips:**
- Use cheap lights for base illumination: AmbientLight, HemisphereLight have minimal cost
- Many PointLights = performance concern. Consider:
  - Using fewer lights with larger influence radius
  - Baking static lights into lightmaps
  - Using emissive materials + bloom post-processing instead of actual lights for some objects
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Balance light intensities carefully — too many lights will wash out the dark aesthetic

---

## Section 1
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source) — adapt for internal point lights
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:**
- keyLight: SpotLight, intensity 1.5
- fillLight: AmbientLight, intensity 0.5
- rimLight: PointLight, intensity 0.8, position (0, 5, -10)
**Gotchas/Tips:**
- For internal mesh lights, the 'key' is the PointLight inside each mesh
- Reduce fill light intensity dramatically for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 2
### Cinematic Night Scene Setup
**Code:**
```javascript
// For cinematic night scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
```
**Key Parameters:**
- color: 0xffffff (or 0x6688cc for cool moonlight)
- intensity: 0.2-0.4 for night scenes
- position: (5, 10, 5)
**Gotchas/Tips:**
- Reduce intensity from 1.0 to ~0.2-0.4 for night scenes
- Use cool blue color (0x6688cc or similar) instead of white for moonlight feel
- DirectionalLight can cast shadows onto ground plane

---

## Section 3
### Frosted Glass Materials
**Code:**
N/A (section truncated in document)
**Key Parameters:**
- MeshPhysicalMaterial with transmission + roughness
**Gotchas/Tips:**
- Uses transmission and roughness for frosted glass effect
## Section 3 (continuation)
### HGPhase (Henvey-Greenstein Phase Function)
**Code:**
```javascript
float HGPhase(float mu, float g) {
  float gg = g * g;
  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);
  float scatter = (1.0 - gg) / pow(denom, 1.5);
  return scatter;
}

// Usage:
float mu = dot(rayDir, -lightDir);
float g = 0.5;
float scatterPhase = HGPhase(mu, g);
vec3 luminance = lightColor * intensity * attenuation * scatterPhase;
```
**Key Parameters:** - mu: cosine of scattering angle
- g: scattering parameter (0.5 for forward)
**Gotchas/Tips:** - For frosted glass: g = 0.3-0.5
- Higher g = focused beam
- Lower g = diffuse glow
- Negative g = rim-lighting effects

---

## Section 4
### PointLight for Internal Mesh Lights
**Code:**
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);

// For TRON cyan internal light
const tronLight = new THREE.PointLight(0x00ffff, 0.8);
```
**Key Parameters:** - First param: color (hex)
- Second param: intensity
- Third param: distance limit
**Gotchas/Tips:** - Third parameter is distance limit
- Each PointLight adds render cost
- Consider lower intensity with higher count
- Each shadow-casting PointLight adds render pass
- Disable shadows on most for performance

---

## Section 4
### RectAreaLight for Panel/Screen Glow
**Code:**
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```
**Key Parameters:** - Color: 0x00ffff (cyan)
- Intensity: 1.0
- Width: 2
- Height: 2
**Gotchas/Tips:** - Requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Section 4
### SpotLight for Focused Dramatic Effects
**Code:**
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
spotlight.angle = Math.PI / 6; // 30 degrees
spotlight.penumbra = 0.5; // soft edges
scene.add(spotlight);
scene.add(spotlight.target);
```
**Key Parameters:** - angle: cone angle (Math.PI / 6 = 30 degrees)
- penumbra: soft edge factor (0.5 = soft edges)
**Gotchas/Tips:** - Both spotlight AND its target must be added to scene
- Good for focused pools of light
- Can cast shadows - use selectively for performance
- Penumbra creates soft glow at edges

---

## Section 4
### Three-Point Lighting (Adapted for Dark Scenes)
**Code:**
```javascript
// Key light (main source)
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);

// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);

// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);

scene.add(keyLight, fillLight, rimLight);
```
**Key Parameters:** - Key light: main source
- Fill light: softens shadows
- Rim light: separates subject from background
**Gotchas/Tips:** - For internal mesh lights, 'key' is PointLight inside each mesh
- Reduce fill light intensity for dark scenes (0.1-0.2)
- Rim light helps define silhouette against dark background

---

## Section 4
### Combining Lights for Atmospheric Effects
**Code:**
```javascript
// Soft ambient for moody interiors
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.15);
scene.add(ambientLight);

// Multiple colored point lights for neon effect
const cyanLight = new THREE.PointLight(0x00ffff, 0.8, 50);
const magentaLight = new THREE.PointLight(0xff00ff, 0.6, 50);
```
**Key Parameters:** - Ambient: color 0x0a0a1a, intensity 0.15
- Cyan point light: 0x00ffff, intensity 0.8, distance 50
- Magenta point light: 0xff00ff, intensity 0.6, distance 50
**Gotchas/Tips:** - Soft ambient for moody interiors
- Balance intensities carefully - too many lights wash out dark aesthetic
- Use complementary neon colors for TRON-like look

---

## Section 7
### SDF-Based Light Volume Shaping
**Code:**
```javascript
// Cylinder SDF - for tubular neon-like objects
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + projectionLength * axisDir;
  float distanceToAxis = length(p - closestPointOnAxis);
  return distanceToAxis - radius;
}

// Sphere SDF - for rounded glass primitives
float sdSphere(vec3 p, vec3 center, float radius) {
  return length(p - center) - radius;
}

// Box SDF - for rectangular glass blocks
float sdBox(vec3 p, vec3 center, vec3 halfSize) {
  vec3 q = abs(p - center) - halfSize;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Apply with soft edges for glow:
float smoothEdgeWidth = 0.1;
float sdfVal = sdSphere(samplePos, objectCenter, objectRadius);
float shapeFactor = smoothstep(0.0, -smoothEdgeWidth, sdfVal);

// Use in light accumulation:
fogAmount += attenuation * lightIntensity * shapeFactor;
```
**Key Parameters:** - smoothEdgeWidth: 0.1 for soft falloff at edges
- shapeFactor: smoothstep result for light shaping
**Gotchas/Tips:** - smoothstep creates soft falloff at edges - adjust smoothEdgeWidth for sharp/soft edges (truncated in source)

---

test output## Section 5
### Shadow Mapping for Ground Plane Shadows
**Code:**
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
```
**Gotchas/Tips:**
- Each light that should cast shadows needs `castShadow = true`
- Meshes need `castShadow` and `receiveShadow` properties set
- For soft shadows, configure shadow map properties: `light.shadow.mapSize.width` and `light.shadow.mapSize.height`, `light.shadow.radius` for soft shadow edges
- Performance impact increases with shadow-casting lights

## Section 5
### Cube Camera for Omnidirectional Shadows
**Key Parameters:**
- `0`: CubeCamera
- `1`: WebGLCubeRenderTarget
- `2`: shadow maps
- `3`: 6 faces per light
**Gotchas/Tips:**
- This is a workaround, not production-grade
- MUST restore original materials after cube camera render
- Performance scales with scene complexity × 6 faces per light
- For static scenes, render shadow maps once and reuse

## Section 5
### Cube Shadow Sampling in Fragment Shader
**Code:**
```javascript
uniform samplerCube shadowMapCube;
uniform vec3 lightPosition;
uniform float shadowBias;
uniform float CUBE_CAMERA_FAR;

float calculateShadowCube(vec3 worldPosition) {
  vec3 dirToLight = worldPosition - lightPosition;
  float distToLight = length(dirToLight);
  
  vec3 direction = normalize(dirToLight);
  float sampledDist = texture(shadowMapCube, direction).r;
  float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
  
  if (distToLight > shadowMapDist + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}
```
**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `CUBE_CAMERA_FAR`: Must match cube camera far plane
- `samples`: 20 for PCF soft shadows
- `PCF offset`: 0.01 adjustable based on scene scale
**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne (self-shadowing speckles)
- For soft shadows, implement PCF by sampling multiple directions with small offsets
- The 0.01 offset in PCF should be adjusted based on your scene scale

## Section 5
### Shadow Map Setup for Directional/Spot Lights
**Code:**
```javascript
const lightCamera = new THREE.PerspectiveCamera(90, 1.0, 0.1, 100);
lightCamera.fov = coneAngle;  // Match to light cone angle

const shadowFBO = new THREE.WebGLRenderTarget(shadowMapSize, shadowMapSize, {
  depth: true,
  depthTexture: new THREE.DepthTexture(
    shadowMapSize, 
    shadowMapSize, 
    THREE.FloatType
  ),
});

// Render shadow map each frame (or once if static):
lightCamera.position.copy(lightPosition);
lightCamera.lookAt(lightTarget);
lightCamera.updateMatrixWorld();
lightCamera.updateProjectionMatrix();

renderer.setRenderTarget(shadowFBO);
renderer.clear(false, true, false);
renderer.render(scene, lightCamera);
renderer.setRenderTarget(null);
```
**Key Parameters:**
- `shadowMapSize`: 512 = balance, 256 = performance, 1024 = high quality
- `FOV`: Should match light's cone angle
- `near/far`: Should tightly bound scene for better depth precision
**Gotchas/Tips:**
- FOV should match your light's cone angle
- Near/far planes should tightly bound scene for better depth precision
- Shadow map resolution: 512 = good balance, 256 = performance, 1024 = high quality
- For static objects, render shadow map ONCE and reuse

## Section 5
### Shadow Calculation from Light View
**Code:**
```javascript
uniform sampler2D shadowMap;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;
uniform float shadowBias;

float calculateShadow(vec3 worldPosition) {
  // Transform to light's clip space
  vec4 lightClipPos = lightProjectionMatrix * lightViewMatrix * vec4(worldPosition, 1.0);
  vec3 lightNDC = lightClipPos.xyz / lightClipPos.w;

  // Convert to shadow map UV coordinates  
  vec2 shadowCoord = lightNDC.xy * 0.5 + 0.5;
  float lightDepth = lightNDC.z * 0.5 + 0.5;

  // Check bounds - outside shadow map = assume lit
  if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
      shadowCoord.y < 0.0 || shadowCoord.y > 1.0 ||
      lightDepth > 1.0) {
    return 1.0;
  }

  float shadowMapDepth = texture2D(shadowMap, shadowCoord).x;

  // Compare depths with bias
  if (lightDepth > shadowMapDepth + shadowBias) {
    return 0.0;  // In shadow
  }
  return 1.0;  // Lit
}
```
**Key Parameters:**
- `shadowBias`: 0.001-0.01 prevents shadow acne
- `lightViewMatrix`: Light's view transformation
- `lightProjectionMatrix`: Light's projection transformation
**Gotchas/Tips:**
- shadowBias (0.001-0.01) prevents shadow acne
- Use continue not break in loops - points beyond shadow may still be lit
- For soft shadows, sample multiple neighboring texels (PCF)
- Three.js/WebGL uses OpenGL UV convention (Y up in NDC)

## Section 6
### Blue Noise Dithering
**Code:**
```javascript
uniform sampler2D blueNoiseTexture;
uniform int frame;

// At start of raymarching loop:
float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame % 32) / sqrt(0.5));
float t = STEP_SIZE * offset;  // Start ray at randomized offset

// Now can use significantly fewer steps:
const int NUM_STEPS = 50;   // Instead of 200-250
const float STEP_SIZE = 0.1;
```
**Key Parameters:**
- `NUM_STEPS`: 50 (reduced from 200-250)
- `frame % 32`: Prevents float precision loss
- `1024.0`: Should match blue noise texture size
**Gotchas/Tips:**
- frame % 32 prevents float precision loss (don't use larger modulus)
- Blue noise texture should be wrapping/repeat mode
- The 1024.0 divisor should match your blue noise texture size
- Works best combined with temporal anti-aliasing (TAA) for even smoother results
- Download blue noise textures from: momentsingraphics.de

## Section 6
### World Position Reconstruction from Screen Space
**Code:**
```javascript
// GLSL
vec3 getWorldPosition(vec2 uv, float depth) {
  float clipZ = depth * 2.0 - 1.0;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, clipZ, 1.0);

  vec4 view = projectionMatrixInverse * clip;
  vec4 world = viewMatrixInverse * view;

  return world.xyz / world.w;  // Perspective divide is MANDATORY
}
```
**Key Parameters:**
- `EffectAttribute.DEPTH`: Required to access depth buffer
- `projectionMatrixInverse`: First matrix to apply
- `viewMatrixInverse`: Second matrix to apply

