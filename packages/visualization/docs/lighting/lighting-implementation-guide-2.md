
# Three.js Lighting Techniques Extraction
## Target Aesthetic: Dark TRON-like Scene with Frosted Glass & Internal Lights

---

## Technique 1: PointLight (Internal Light Sources)

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: PointLight radiates light in all directions from a single point in space.

**How it applies**: PERFECT for your frosted glass primitives with internal lights. Place a PointLight inside each translucent mesh to create the "light emanating outward through glass" effect. Use colored lights (cyan, magenta, etc.) for TRON-like neon aesthetic.

**Code snippet**:
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);
```

**Gotchas/tips**: 
- The third parameter (100) is the distance limit — lights fade to black at this distance
- For many small light sources, be aware that each PointLight adds render cost
- Consider using a lower intensity with higher count for distributed glow effect
- For performance with many lights, you may need to use deferred rendering or light clustering

---

## Technique 2: SpotLight (Focused Neon Beams)

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: SpotLight creates a cone-shaped beam of light with target tracking capability.

**How it applies**: Could be used for dramatic focused lighting effects in your TRON-like scene — think of focused neon beams cutting through the dark environment. The target tracking allows for dynamic light direction.

**Code snippet**:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight);
scene.add(spotlight.target);
```

**Gotchas/tips**:
- Both the spotlight AND its target must be added to the scene
- Good for creating focused pools of light on your dark ground plane
- Can create dramatic TRON-like light trails when animated

---

## Technique 3: AmbientLight (Dark Scene Base)

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: AmbientLight provides uniform base illumination without direction or shadows.

**How it applies**: For a dark scene, use a VERY low intensity AmbientLight (or none at all) to maintain the moody, dark atmosphere. A subtle ambient can prevent pure black areas while keeping the TRON-like minimal aesthetic.

**Code snippet**:
```javascript
// For dark moody scene, use very low intensity
const ambientLight = new THREE.AmbientLight(0x111122, 0.1);
scene.add(ambientLight);
```

**Gotchas/tips**:
- AmbientLight does NOT cast shadows
- Keep intensity extremely low (0.05-0.2) for dark scenes
- A slightly colored ambient (cool blue) can enhance the moody atmosphere

---

## Technique 4: Shadow Mapping (Ground Plane Shadows)

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

## Technique 5: Combining Lights for Atmospheric Effects

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

**Technique**: Combining multiple light types creates atmospheric effects and mood.

**How it applies**: ESSENTIAL for your TRON-like aesthetic. Combine:
- Low ambient for base darkness
- Colored PointLights inside glass objects
- Soft shadows for depth
- Potentially subtle fog for atmosphere

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

## Technique 6: PBR (Physically Based Rendering) for Glass Materials

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

**Gotchas/tips**:
- MeshPhysicalMaterial is more expensive than MeshStandardMaterial
- `transmission` requires `transparent: true`
- `roughness` controls the frost level — higher = more diffuse glow

---

## Technique 7: IBL (Image-Based Lighting) for Atmospheric Depth

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js (2025)

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

## Summary: Recommended Approach for Your Aesthetic

1. **Base Setup**: Ultra-low ambient light (or none)
2. **Primary Lights**: PointLights inside each frosted glass object with neon colors
3. **Materials**: MeshPhysicalMaterial with transmission + roughness for frosted glass
4. **Shadows**: Enable shadow mapping, cast from internal lights onto ground plane
5. **Atmosphere**: Subtle fog (THREE.Fog) + IBL for depth
6. **Performance**: Many PointLights = performance concern. Consider:
   - Using fewer lights with larger influence radius
   - Baking static lights into lightmaps
   - Using emissive materials + bloom post-processing instead of actual lights for some objects

# Three.js Lighting Techniques for Dark TRON-like Aesthetic

**Document Source**: Mastering Three.js Lighting: Illuminating Your 3D World (January 6, 2026)

---

## Technique 1: PointLight for Internal Mesh Lights

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: PointLight — radiates from a point in all directions (light bulb)

**How it applies**: 
- Place PointLights INSIDE frosted glass/translucent mesh primitives
- Each primitive becomes a glowing object with light emanating outward
- Use colored PointLights (cyan, magenta, electric blue) for TRON neon aesthetic
- Multiple PointLights create the internal glow effect through translucent materials

**Code snippet**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

## Technique 2: Low-Intensity Ambient Light for Dark Scenes

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: AmbientLight provides overall base illumination without direction; no shadows

**How it applies**:
- Dark scene base: use VERY low intensity ambient (e.g., 0.1 or less)
- Prevents pure black while maintaining dark atmosphere
- For TRON aesthetic: use dark blue or purple tinted ambient for subtle color cast
- Combines with internal point lights for "glow in darkness" effect

**Code snippet**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/tips**:
- AmbientLight is "cheap" — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

## Technique 3: Cinematic Night Scene Setup

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

## Technique 4: Cool Color Temperature for Dramatic Atmosphere

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

## Technique 5: HemisphereLight for Ground Plane Ambient

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

**Gotchas/tips**:
- HemisphereLight is "cheap" for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

## Technique 6: Three-Point Lighting (Adapted for Dark Scenes)

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

## Technique 7: RectAreaLight for Panel/Screen Glow

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

**Gotchas/tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Technique 8: SpotLight for Focused Dramatic Effects

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: SpotLight — cone-shaped beam with angle/penumbra control

**How it applies**:
- Selective illumination on specific objects
- Penumbra control for soft edge on spotlight cone
- Can mimic bloom effect on specific areas without post-processing
- Dramatic, focused lighting for key objects

**Code snippet**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

## Performance Tips for Many Light Sources

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Techniques**:
1. **Use cheap lights for base illumination**: AmbientLight, HemisphereLight have minimal cost
2. **Minimize shadow-casting lights**: Each shadow-casting light adds a render pass
3. **Use light helpers during development**: For positioning lights visually
4. **Interactive sliders for tuning**: Real-time adjustment of intensity, color, position

**How it applies to internal mesh lights**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for "fake" glow without light cost

**Code snippet** (disabling shadows):
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/tips**:
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

## Summary: Recommended Setup for TRON Dark Scene

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
# Three.js Lighting Techniques for Dark TRON-like Aesthetic

**Document Source**: Mastering Three.js Lighting: Illuminating Your 3D World (January 6, 2026)

---

## Technique 1: PointLight for Internal Mesh Lights

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: PointLight — radiates from a point in all directions (light bulb)

**How it applies**: 
- Place PointLights INSIDE frosted glass/translucent mesh primitives
- Each primitive becomes a glowing object with light emanating outward
- Use colored PointLights (cyan, magenta, electric blue) for TRON neon aesthetic
- Multiple PointLights create the internal glow effect through translucent materials

**Code snippet**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/tips**:
- Each shadow-casting PointLight adds a render pass — expensive for many lights
- For many small internal lights, consider disabling shadows on most
- Use lower intensity values for subtle internal glow vs. harsh point light

---

## Technique 2: Low-Intensity Ambient Light for Dark Scenes

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: AmbientLight provides overall base illumination without direction; no shadows

**How it applies**:
- Dark scene base: use VERY low intensity ambient (e.g., 0.1 or less)
- Prevents pure black while maintaining dark atmosphere
- For TRON aesthetic: use dark blue or purple tinted ambient for subtle color cast
- Combines with internal point lights for "glow in darkness" effect

**Code snippet**:
```javascript
// Fill light (softens shadows)
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(fillLight);
```

**Gotchas/tips**:
- AmbientLight is "cheap" — minimal performance cost
- No shadows, so won't interfere with selective shadow casting
- For darker scenes, reduce intensity significantly from the 0.5 example

---

## Technique 3: Cinematic Night Scene Setup

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

## Technique 4: Cool Color Temperature for Dramatic Atmosphere

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

## Technique 5: HemisphereLight for Ground Plane Ambient

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

**Gotchas/tips**:
- HemisphereLight is "cheap" for base illumination
- No shadows cast by this light type
- Use very low intensity for dark scenes
- Ground color should match/complement ground plane material

---

## Technique 6: Three-Point Lighting (Adapted for Dark Scenes)

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

## Technique 7: RectAreaLight for Panel/Screen Glow

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

**Gotchas/tips**:
- RectAreaLight requires RectAreaLightUniformsLib import
- Does not cast shadows by default
- Works best with MeshStandardMaterial or MeshPhysicalMaterial

---

## Technique 8: SpotLight for Focused Dramatic Effects

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Technique**: SpotLight — cone-shaped beam with angle/penumbra control

**How it applies**:
- Selective illumination on specific objects
- Penumbra control for soft edge on spotlight cone
- Can mimic bloom effect on specific areas without post-processing
- Dramatic, focused lighting for key objects

**Code snippet**:
```javascript
const spotLight = new THREE.SpotLight(0x00ffff, 1.0);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30 degrees
spotLight.penumbra = 0.5; // soft edges
scene.add(spotLight);
```

**Gotchas/tips**:
- Can cast shadows — use selectively for performance
- Penumbra creates soft glow effect at edges
- Target property controls where spotlight points

---

## Performance Tips for Many Light Sources

**Source**: Mastering Three.js Lighting: Illuminating Your 3D World

**Techniques**:
1. **Use cheap lights for base illumination**: AmbientLight, HemisphereLight have minimal cost
2. **Minimize shadow-casting lights**: Each shadow-casting light adds a render pass
3. **Use light helpers during development**: For positioning lights visually
4. **Interactive sliders for tuning**: Real-time adjustment of intensity, color, position

**How it applies to internal mesh lights**:
- For many small internal PointLights, disable shadows on most/all
- Use a single shadow-casting directional light for ground plane shadows
- Consider grouping nearby internal lights into single lights
- Use MeshBasicMaterial with emissive for "fake" glow without light cost

**Code snippet** (disabling shadows):
```javascript
const internalLight = new THREE.PointLight(0x00ffff, 0.5);
internalLight.castShadow = false; // default, but explicit for clarity
```

**Gotchas/tips**:
- WebXR and some devices have limits on number of lights
- Consider using InstancedMesh for multiple similar glowing objects
- Post-processing bloom can simulate light glow more efficiently than many lights

---

## Summary: Recommended Setup for TRON Dark Scene

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
# Three.js Lighting Techniques for Dark Scene with Frosted Glass/Neon Aesthetic

**Target Aesthetic**: Dark scene with orthographic camera, frosted glass/translucent mesh primitives with internal point lights, light emanating outward through glass onto dark ground plane, selective bloom/glow, soft shadows, subtle fog/atmosphere, TRON-like minimal neon aesthetic.

**Source Document**: [On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web](https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/) by Maxime Heckel (June 10, 2025)

---

## HIGHLY RELEVANT TECHNIQUES

---

### 1. Cube Camera for Omnidirectional Point Light Shadows

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Use a CubeCamera to capture 360° shadow information for point lights that emit light in all directions.

**How it applies**: ESSENTIAL for internal point lights inside frosted glass objects. Each frosted glass primitive with an internal light needs to cast light outward in all directions, interacting with the ground plane and other objects. The cube camera captures shadows from all 6 directions.

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
- **MAJOR PERFORMANCE COST**: 6x scene renders per frame per light
- For many small lights: (1) only enable shadows for key lights, (2) use lower resolution for distant lights, (3) update shadows only when objects move (not every frame), (4) consider shadow LOD system
- Typical SHADOW_MAP_SIZE: 512 for balance, 256 for performance, 1024 for high quality
- CUBE_CAMERA_NEAR/FAR should be set tightly around your scene for better depth precision

---

### 2. Custom Shadow Material for Cube Depth

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Custom shader material that outputs normalized distance to each face of a cube camera, since Three.js lacks native CubeDepthTexture.

**How it applies**: REQUIRED for cube camera point light shadows. Render the scene with this material to create a shadow cube map for each internal light source. The normalized distance values allow accurate shadow determination.

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
scene.overrideMaterial = null;  // MUST restore original materials
```

**Gotchas/Tips**:
- This is a workaround, not production-grade
- MUST restore original materials after cube camera render
- Performance scales with scene complexity × 6 faces per light
- For static scenes, render shadow maps once and reuse

---

### 3. Cube Shadow Sampling in Fragment Shader

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: GLSL function to sample an omnidirectional shadow cube map and determine if a point is in shadow.

**How it applies**: Include this in your custom materials (frosted glass shader, ground plane shader) to receive shadows from internal point lights. Creates the soft shadow edges where light emanates from inside glass objects onto the ground.

**Code**:
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

**Gotchas/Tips**:
- shadowBias (0.001-0.01) prevents shadow acne (self-shadowing speckles)
- For soft shadows, implement PCF by sampling multiple directions with small offsets
- The 0.01 offset in PCF should be adjusted based on your scene scale

---

### 4. Blue Noise Dithering

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Randomize ray start positions using a blue noise texture to reduce banding artifacts while dramatically reducing step count.

**How it applies**: CRITICAL PERFORMANCE OPTIMIZATION for many light sources. Allows reducing raymarching step count by ~5x (e.g., 50 steps instead of 250) while maintaining visual quality. Essential when rendering volumetric effects for multiple frosted glass objects.

**Code**:
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

**Gotchas/Tips**:
- `frame % 32` prevents float precision loss (don't use larger modulus)
- Blue noise texture should be wrapping/repeat mode
- The 1024.0 divisor should match your blue noise texture size
- Works best combined with temporal anti-aliasing (TAA) for even smoother results
- Download blue noise textures from: momentsingraphics.de

---

### 5. Beer's Law Light Attenuation

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Models exponential light absorption through a participating medium (fog, glass, smoke).

**How it applies**: PERFECT for modeling light passing through frosted glass. Beer's law creates the realistic falloff where light intensity decreases exponentially with distance traveled through the translucent glass medium. Creates the soft glow emanating from glass objects.

**Code**:
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

**Gotchas/Tips**:
- Start transmittance >1.0 (e.g., 5.0) to avoid overly dark results
- Density parameter controls how "foggy" the glass appears:
  - Higher values = more diffuse, milkier glass
  - Lower values = clearer, more transparent glass
- FOG_DENSITY around 0.3-0.5 gives good frosted glass effect

---

## MEDIUM RELEVANCE TECHNIQUES

---

### 6. Henyey-Greenstein Phase Function

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Controls the directionality of light scattering through participating media.

**How it applies**: Frosted glass scatters light directionally. Use this to control whether light tends to scatter forward (toward viewer) or backward. For TRON aesthetic where light glows outward from glass objects, g ≈ 0.3-0.5 gives realistic forward scattering.

**Code**:
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

**Gotchas/Tips**:
- For frosted glass: g = 0.3-0.5 works well
- Higher g = more focused beam (like spotlight through glass)
- Lower g = more diffuse glow (like frosted bulb)
- Negative g creates interesting rim-lighting effects

---

### 7. SDF-Based Light Volume Shaping

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Use signed distance functions to define the shape of volumetric light regions.

**How it applies**: Shape the light emanating from frosted glass objects to match their geometric form. Use cylinder SDFs for tube lights, sphere SDFs for rounded glass, box SDFs for rectangular blocks. Creates controlled glow with soft edges.

**Code**:
```glsl
// Cylinder SDF - for tubular neon-like objects
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + axisDir * projectionLength;
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

**Gotchas/Tips**:
- `smoothstep` creates soft falloff at edges - adjust `smoothEdgeWidth` for sharper or softer glow
- Can combine multiple SDFs with min/max for complex shapes
- See Inigo Quilez's SDF dictionary for more primitives: iq.ua.es/articles
- For frosted glass, use slightly larger SDF radius than mesh for soft glow extending beyond surface

---

### 8. World Position Reconstruction from Screen Space

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Convert 2D screen coordinates and depth buffer values into 3D world positions.

**How it applies**: Foundation for any post-processing volumetric effect. If implementing volumetric glow as a post-process pass rather than per-object, this function is essential for determining world-space ray directions.

**Code**:
```glsl
vec3 getWorldPosition(vec2 uv, float depth) {
  float clipZ = depth * 2.0 - 1.0;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, clipZ, 1.0);

  vec4 view = projectionMatrixInverse * clip;
  vec4 world = viewMatrixInverse * view;

  return world.xyz / world.w;  // Perspective divide is MANDATORY
}
```

```javascript
// In post-processing effect, pass the matrices:
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

**Gotchas/Tips**:
- Matrix multiplication order is CRITICAL: `projectionMatrixInverse` THEN `viewMatrixInverse`
- The `/world.w` perspective divide is mandatory or positions will be wrong
- Requires `EffectAttribute.DEPTH` to access depth buffer in post-processing
- For orthographic camera, the math is slightly different (no perspective divide)

---

### 9. Depth-Based Stopping for Volumetric Effects

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Use scene depth to terminate raymarching when hitting solid geometry.

**How it applies**: Prevents volumetric glow from incorrectly appearing through walls or other solid objects. Ensures light beams from frosted glass objects are properly occluded.

**Code**:
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

**Gotchas/Tips**:
- Essential for preventing light leaking through walls
- `sceneDepth` comes from depth buffer via world position reconstruction
- Also provides early exit optimization for performance

---

### 10. Shadow Map Setup for Directional/Spot Lights

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Create a virtual camera at the light source to generate a shadow map for directional or spotlight-type lights.

**How it applies**: If your frosted glass objects have directional internal lights (like a neon tube emitting primarily in one direction), use perspective camera shadow mapping instead of cube camera - MUCH more performant (1 render vs 6 renders).

**Code**:
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

**Gotchas/Tips**:
- FOV should match your light's cone angle
- Near/far planes should tightly bound scene for better depth precision
- Shadow map resolution: 512 = good balance, 256 = performance, 1024 = high quality
- For static objects, render shadow map ONCE and reuse

---

### 11. Shadow Calculation from Light View

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Transform world positions into light's view/projection space to sample shadow maps.

**How it applies**: Shader-side shadow sampling for receiving shadows from directional/spot lights. Use on ground plane and other objects to receive soft shadows from internal lights.

**Code**:
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

**Gotchas/Tips**:
- shadowBias (0.001-0.01) prevents shadow acne
- Use `continue` not `break` in loops - points beyond shadow may still be lit
- For soft shadows, sample multiple neighboring texels (PCF)
- Three.js/WebGL uses OpenGL UV convention (Y up in NDC)

---

### 12. FBM for Organic Fog/Atmosphere

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Fractal Brownian Motion creates organic, animated noise patterns for atmospheric effects.

**How it applies**: Add subtle atmospheric fog for the TRON aesthetic. Use VERY sparingly - just enough to show light beams and create depth, without obscuring the clean minimal look. Can be disabled for pure TRON-clean aesthetic.

**Code**:
```glsl
const float NOISE_FREQUENCY = 0.5;
const float NOISE_AMPLITUDE = 10.0;
const int NOISE_OCTAVES = 3;

float fbm(vec3 p) {
  vec3 q = p + time * 0.5 * vec3(1.0, -0.2, -1.0);  // Animated drift
  float f = 0.0;
  float scale = NOISE_FREQUENCY;
  float factor = NOISE_AMPLITUDE;

  for (int i = 0; i < NOISE_OCTAVES; i++) {
    f += scale * noise(q);
    q *= factor;
    factor += 0.21;
    scale *= 0.5;
  }
  return f;
}

// Combine with SDF for natural light volume:
float shapeFactor = -sdfVal + fbm(samplePos) * fogStrength;
```

**Gotchas/Tips**:
- Time-based offset creates animated drift - can disable for static scenes
- Use world-space coordinates for noise sampling to avoid artifacts
- For TRON aesthetic, keep fogStrength very low (0.1-0.3)
- The noise function can come from a texture or be computed in-shader

---

### 13. Post-Processing Volumetric Light Effect Framework

**Source**: On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web

**Technique**: Complete class structure for a post-processing volumetric lighting effect using the postprocessing library.

**How it applies**: If implementing volumetric glow as a full-screen post-process rather than per-object, this class handles uniform updates and depth buffer access automatically.

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

**Gotchas/Tips**:
- `EffectAttribute.DEPTH` required to access depthBuffer in shader
- Update uniforms in update(), not constructor
- For multiple lights: use array uniforms or multiple effect passes
- More efficient than per-object volumetric for scenes with many lights

---


## Performance Considerations for Many Small Light Sources

| Factor | Impact | Guidance for TRON/Frosted Glass Scene |
|--------|--------|----------------------------------------|
| **Step count** | Dominant raymarching cost | 250 steps = high quality; blue noise dithering enables ~50 steps. For many lights, aggressively reduce steps. |
| **Shadow map resolution** | Per-step texture read | 128² = fast/blocky, 512² = good balance, 1024² = expensive. Use lower res for distant lights. |
| **Cube camera shadows** | 6x scene renders per light | **CRITICAL BOTTLENECK** for many lights. Strategies: (1) shadow LOD - only key lights cast shadows, (2) static shadows - update only when objects move, (3) lower resolution for distant lights, (4) skip shadows entirely for tiny accent lights. |
| **Multiple lights** | Linear scaling | N shadow FBOs + N lookups per step. 2-3 lights manageable; 5+ needs optimization. Consider: light clustering, deferred rendering, or faking with emissive materials + bloom. |
| **FBM noise** | Multiple texture reads per step | Use small wrapping texture (256²) or generate in-shader with hash functions. Disable for TRON-clean aesthetic. |
| **Blue noise dithering** | Negligible cost | **ESSENTIAL** - Single texture read, huge quality/step-count win. Use it. |
| **Post-process vs per-object** | Architecture decision | Post-process volumetric: one pass for all lights but limited to screen-space. Per-object: more flexible but cost scales with object count. For many small frosted objects, consider hybrid: emissive materials + bloom for glow, shadows only from key lights. |
| **Early exit** | Free speedup | Depth/far-plane checks save work on close geometry. Always include. |
| **Bandwidth** | 1080p × 50 steps ≈ 500M texture accesses | Compress shadow data, reduce noise resolution, use half-float formats where possible. |


## Additional Recommendations for TRON/Neon Aesthetic

Based on the extracted techniques, here are specific recommendations for achieving the target aesthetic:

### For Frosted Glass with Internal Point Lights:

1. **Material Approach**: Create a custom shader material that:
   - Uses Beer's Law for light attenuation through glass
   - Applies Henyey-Greenstein with g ≈ 0.4 for forward scattering
   - Uses SDF to define light volume matching object shape

2. **Shadow Strategy** (performance-critical):
   - Only key objects cast shadows (cube camera = expensive)
   - Small accent lights: use emissive + bloom, skip shadows
   - Static objects: bake shadow maps once
   - Use shadow LOD based on distance

3. **Bloom/Glow**:
   - Not covered in source doc, but combine with:
     - postprocessing library's BloomEffect
     - Selective bloom by rendering glow objects to separate layer
     - UnrealBloomPass from Three.js examples

4. **Optimized Multi-Light Strategy**:
   - Use blue noise dithering (mandatory for many lights)
   - Consider deferred rendering for 5+ lights
   - Clustered/forward+ rendering for many small lights
   - Fake small lights with emissive materials + bloom instead of actual point lights
# Extracted Techniques for TRON-like Dark Scene with Internal Lighting

## 1. Point Light Inside Translucent Mesh

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Embedding a point light source inside a mesh primitive to create the effect of light emanating from within an object.

**How it applies**: This is the core technique for your frosted glass primitives. Place a point light at the center of each translucent mesh (sphere, cube, etc.) so light emanates outward through the glass material onto the dark ground plane.

**Code snippet**:
```javascript
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` relative to the parent group, placing it at the exact center of the mesh
- `distance` parameter controls how far the light reaches — adjust based on your scene scale
- For frosted glass, replace `MeshBasicMaterial` with `MeshPhysicalMaterial` featuring `transmission`, `roughness`, and `thickness` properties
- The intensity (2.5) is deliberately low because the internal light contributes less to overall scene illumination than external lights

---

## 2. Dynamic Light Intensity / Strobe Effect

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using refs and `useFrame` to dynamically control light intensity, creating flashing or pulsing effects with cooldown protection.

**How it applies**: For TRON-like neon aesthetics, you can create pulsing lights inside your glass primitives. The random timing creates organic variation; for more regular pulsing, use sinusoidal intensity changes.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame(() => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        lightningLightRef.current.position.x = (Math.random() - 0.5) * 10;
        lightningLightRef.current.intensity = 90;
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**For smooth pulsing (TRON-style)**:
```javascript
useFrame((state) => {
  if (lightRef.current) {
    // Sinusoidal pulse between 1.0 and 3.0 intensity
    lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 1.0;
  }
});
```

**Gotchas/tips**:
- **Never create `new Object3D()` in the animation loop** — use `useRef` to persist values across frames without GC pressure
- Ref-based cooldown (`lightningActive.current`) prevents overlapping flash cycles
- The `decay` parameter (0.8) creates realistic light falloff — experiment with values 0-2 for different effects
- Random position changes create varied visual interest

---

## 3. Post-Processing Bloom for Glow Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `EffectComposer` with `Bloom` pass to create selective glow on bright objects.

**How it applies**: Bloom is essential for the TRON neon aesthetic. The `threshold` parameter controls which objects glow — only objects brighter than the threshold will bloom. This enables selective glow on your light-emitting glass primitives.

**Code snippet**:
```javascript
import { EffectComposer, Bloom } from '@react-three/post-processing';

const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
        starPoints={2} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` means only objects with brightness > 0.9 will bloom — adjust to isolate your neon elements
- For selective bloom on specific objects, you can use render layers or ensure your glowing objects use emissive materials with high intensity
- Combine with `MeshBasicMaterial` or emissive `MeshStandardMaterial` on your glass primitives for maximum bloom effect
- Bloom is computationally expensive — consider disabling or reducing quality on mobile

---

## 4. Instanced Rendering for Many Mesh Primitives

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `instancedMesh` to render thousands of objects in a single draw call via matrix transforms.

**How it applies**: For "many small light sources" performance optimization. If you have dozens or hundreds of frosted glass primitives, instanced rendering dramatically reduces draw calls. Note: each instance shares the same geometry and material.

**Code snippet**:
```javascript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) particle.y = 20;
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- **Always set `instanceMatrix.needsUpdate = true`** after updating transforms, or instances freeze
- **Never create `new Object3D()` in the animation loop** — use `useMemo` to create a single dummy object at mount to avoid GC pressure
- For glass primitives with internal lights, you cannot use true instancing (each needs its own light) — consider grouping lights or using vertex shader-based fake lighting for distant objects
- Draw calls: `instancedMesh` collapses 1000 particles → 1 draw call

---

## 5. Time-Based Animation with useFrame

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `state.clock.elapsedTime` to drive all continuous motion — rotation, drift, pulsing.

**How it applies**: For TRON aesthetics, drive rotation of neon elements, subtle floating animation of glass primitives, and any ambient motion.

**Code snippet** (rotation):
```javascript
useFrame((state) => {
  if (meshRef.current) {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  }
});
```

**Code snippet** (sinusoidal drift for floating effect):
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
    // ...
  });
});
```

**Gotchas/tips**:
- The offset `i` in `Math.sin(time + i)` gives each object its own phase offset, preventing synchronized motion
- For smooth floating effect: `position.y = baseY + Math.sin(state.clock.elapsedTime * speed) * amplitude`
- All animated elements should use the same `state.clock.elapsedTime` for synchronized timing

---

## 6. Ref-Based State for Light Control

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `useRef` to persist state across frames without triggering re-renders or creating garbage collection pressure.

**How it applies**: Essential for controlling many lights efficiently — tracking active states, cooldowns, or animation progress for each light source.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame(() => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    if (lightningLightRef.current) {
      lightningLightRef.current.intensity = 90;
      setTimeout(() => {
        if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
        lightningActive.current = false;
      }, 400);
    }
  }
});
```

**Gotchas/tips**:
- Refs don't trigger re-renders when changed — use for animation state, not UI state
- Always check `if (ref.current)` before accessing — refs are null until after initial render
- For arrays of lights, use `useRef([])` and initialize in a `useEffect` or `useLayoutEffect`

---

## 7. Conditional Rendering for Performance

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Only mounting components that are currently visible or active, unmounting inactive effects entirely.

**How it applies**: For scenes with many objects, only render what's visible in the orthographic camera frustum. Disable or unmount lights/effects for off-screen objects.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.5} /></>;
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return <><Clouds intensity={0.8} /><Rain count={portalMode ? 100 : 800} /></>;
  } else if (weatherType === 'snowy') {
    return <><Clouds intensity={0.6} /><Snow count={portalMode ? 50 : 400} /></>;
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Conditional mounting prevents wasted polygon processing for inactive effects
- For orthographic camera, check if objects are within the camera's frustum before rendering
- Consider distance-based culling for lights: reduce intensity or disable lights beyond a threshold

---

## 8. Dark Scene / Night Mode Setup

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Replacing expensive atmospheric components (Sky) with simple black background for night scenes, adding star field for depth.

**How it applies**: For your dark TRON scene, skip the Sky component entirely. Use a dark or black background. Add subtle particle stars or grid lines for atmosphere.

**Code snippet**:
```javascript
// Night:
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

// Skip Sky at night - black background is better and faster
```

**Gotchas/tips**:
- **Skip Sky component at night** — it's computationally expensive and a black backdrop with Stars looks better and performs faster
- For TRON aesthetic, consider a subtle grid floor or atmospheric fog instead of stars
- Adjust `fog` near/far distances to create depth without obscuring nearby glowing objects

---

## 9. MeshLambertMaterial for Translucent Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshLambertMaterial` for volumetric translucent objects like clouds.

**How it applies**: For frosted glass, consider materials that respond to light without full PBR complexity. `MeshPhysicalMaterial` with transmission is ideal for glass, but `MeshLambertMaterial` can work for simpler translucent effects.

**Code snippet**:
```javascript
<DreiClouds material={new THREE.MeshLambertMaterial()}>
  <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
    color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
</DreiClouds>
```

**For frosted glass (recommended)**:
```javascript
<meshPhysicalMaterial
  color="#ffffff"
  transmission={0.9}
  roughness={0.3}
  thickness={0.5}
  transparent
  opacity={0.8}
/>
```

**Gotchas/tips**:
- `MeshLambertMaterial` is cheaper than `MeshStandardMaterial` but doesn't support transmission
- For true frosted glass, use `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Higher `roughness` values (0.3-0.6) create the frosted blur effect
- `thickness` controls how far light travels through the material — affects internal light scattering

---

## 10. Performance Optimization Summary

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Multiple strategies for maintaining performance with complex scenes.

**How it applies**: For many light sources and mesh primitives, these optimizations are critical:

| Concern | Strategy | Impact |
|---------|----------|--------|
| **Draw calls** | `instancedMesh` collapses 1000 particles → 1 draw call | Orders of magnitude fewer GPU calls |
| **Conditional rendering** | Only mount active components | No wasted polygon processing |
| **Memory lifecycle** | `useMemo` for arrays and dummy objects | Eliminates per-frame GC churn |
| **Light count** | Group lights, use vertex shader fake lighting for distant objects | Reduces GPU light calculations |
| **Portal textures** | 256px resolution keeps texture memory manageable | ~768 KB for 3 portals |

**Additional tips**:
- **Particle/object counts**: Portal mode drops counts by ~87.5% (800→100) — apply similar reduction for distant/simplified views
- **Texture memory**: Keep render textures and effects buffers at minimum viable resolution
- **GPU budget**: For many point lights, consider using `deferred` rendering or limiting light count in standard forward rendering

---

## 11. Orthographic Camera Considerations (Inferred)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber (inferred from scene setup)

**Technique**: Scene configuration for orthographic projection.

**How it applies**: Orthographic cameras lack depth perspective, which affects how lighting and shadows appear. Distance-based attenuation of point lights will appear differently than in perspective views.

**Code snippet** (setup):
```javascript
import { OrthographicCamera } from '@react-three/drei';

<OrthographicCamera
  makeDefault
  position={[0, 10, 10]}
  zoom={50}
  near={0.1}
  far={1000}
/>
```

**Gotchas/tips**:
- Point light `distance` and `decay` parameters behave differently in orthographic view — test visually
- Shadows from orthographic cameras use `OrthographicShadowMap` — configure shadow camera bounds tightly
- Bloom and post-processing work identically regardless of camera type

---

## 12. Portal Rendering for Nested Scenes (Optional)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshPortalMaterial` to render complete 3D scenes onto 2D planes, with smooth blending transitions.

**How it applies**: For frosted glass effects, you could render a scene "behind" the glass to a texture and display it on the glass surface with blur applied.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  useFrame(() => {
    if (materialRef.current) {
      const targetBlend = isFullscreen ? 1 : 0;
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0, targetBlend, 0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} resolution={256}>
          <WeatherVisualization weatherData={portalWeatherData} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `THREE.MathUtils.lerp` at factor 0.1 creates smooth ~10-frame blend transitions
- **Portal resolution 256 is the sweet spot** — higher values (512+) increase GPU memory per portal
- `roundedPlaneGeometry` from `maath` provides organic corners for glass panels# Extracted Techniques for TRON-like Dark Scene with Internal Lighting

## 1. Point Light Inside Translucent Mesh

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Embedding a point light source inside a mesh primitive to create the effect of light emanating from within an object.

**How it applies**: This is the core technique for your frosted glass primitives. Place a point light at the center of each translucent mesh (sphere, cube, etc.) so light emanates outward through the glass material onto the dark ground plane.

**Code snippet**:
```javascript
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` relative to the parent group, placing it at the exact center of the mesh
- `distance` parameter controls how far the light reaches — adjust based on your scene scale
- For frosted glass, replace `MeshBasicMaterial` with `MeshPhysicalMaterial` featuring `transmission`, `roughness`, and `thickness` properties
- The intensity (2.5) is deliberately low because the internal light contributes less to overall scene illumination than external lights

---

## 2. Dynamic Light Intensity / Strobe Effect

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using refs and `useFrame` to dynamically control light intensity, creating flashing or pulsing effects with cooldown protection.

**How it applies**: For TRON-like neon aesthetics, you can create pulsing lights inside your glass primitives. The random timing creates organic variation; for more regular pulsing, use sinusoidal intensity changes.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame(() => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        lightningLightRef.current.position.x = (Math.random() - 0.5) * 10;
        lightningLightRef.current.intensity = 90;
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**For smooth pulsing (TRON-style)**:
```javascript
useFrame((state) => {
  if (lightRef.current) {
    // Sinusoidal pulse between 1.0 and 3.0 intensity
    lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 1.0;
  }
});
```

**Gotchas/tips**:
- **Never create `new Object3D()` in the animation loop** — use `useRef` to persist values across frames without GC pressure
- Ref-based cooldown (`lightningActive.current`) prevents overlapping flash cycles
- The `decay` parameter (0.8) creates realistic light falloff — experiment with values 0-2 for different effects
- Random position changes create varied visual interest

---

## 3. Post-Processing Bloom for Glow Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `EffectComposer` with `Bloom` pass to create selective glow on bright objects.

**How it applies**: Bloom is essential for the TRON neon aesthetic. The `threshold` parameter controls which objects glow — only objects brighter than the threshold will bloom. This enables selective glow on your light-emitting glass primitives.

**Code snippet**:
```javascript
import { EffectComposer, Bloom } from '@react-three/post-processing';

const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
        starPoints={2} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` means only objects with brightness > 0.9 will bloom — adjust to isolate your neon elements
- For selective bloom on specific objects, you can use render layers or ensure your glowing objects use emissive materials with high intensity
- Combine with `MeshBasicMaterial` or emissive `MeshStandardMaterial` on your glass primitives for maximum bloom effect
- Bloom is computationally expensive — consider disabling or reducing quality on mobile

---

## 4. Instanced Rendering for Many Mesh Primitives

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `instancedMesh` to render thousands of objects in a single draw call via matrix transforms.

**How it applies**: For "many small light sources" performance optimization. If you have dozens or hundreds of frosted glass primitives, instanced rendering dramatically reduces draw calls. Note: each instance shares the same geometry and material.

**Code snippet**:
```javascript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) particle.y = 20;
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- **Always set `instanceMatrix.needsUpdate = true`** after updating transforms, or instances freeze
- **Never create `new Object3D()` in the animation loop** — use `useMemo` to create a single dummy object at mount to avoid GC pressure
- For glass primitives with internal lights, you cannot use true instancing (each needs its own light) — consider grouping lights or using vertex shader-based fake lighting for distant objects
- Draw calls: `instancedMesh` collapses 1000 particles → 1 draw call

---

## 5. Time-Based Animation with useFrame

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `state.clock.elapsedTime` to drive all continuous motion — rotation, drift, pulsing.

**How it applies**: For TRON aesthetics, drive rotation of neon elements, subtle floating animation of glass primitives, and any ambient motion.

**Code snippet** (rotation):
```javascript
useFrame((state) => {
  if (meshRef.current) {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  }
});
```

**Code snippet** (sinusoidal drift for floating effect):
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
    // ...
  });
});
```

**Gotchas/tips**:
- The offset `i` in `Math.sin(time + i)` gives each object its own phase offset, preventing synchronized motion
- For smooth floating effect: `position.y = baseY + Math.sin(state.clock.elapsedTime * speed) * amplitude`
- All animated elements should use the same `state.clock.elapsedTime` for synchronized timing

---

## 6. Ref-Based State for Light Control

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `useRef` to persist state across frames without triggering re-renders or creating garbage collection pressure.

**How it applies**: Essential for controlling many lights efficiently — tracking active states, cooldowns, or animation progress for each light source.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame(() => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    if (lightningLightRef.current) {
      lightningLightRef.current.intensity = 90;
      setTimeout(() => {
        if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
        lightningActive.current = false;
      }, 400);
    }
  }
});
```

**Gotchas/tips**:
- Refs don't trigger re-renders when changed — use for animation state, not UI state
- Always check `if (ref.current)` before accessing — refs are null until after initial render
- For arrays of lights, use `useRef([])` and initialize in a `useEffect` or `useLayoutEffect`

---

## 7. Conditional Rendering for Performance

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Only mounting components that are currently visible or active, unmounting inactive effects entirely.

**How it applies**: For scenes with many objects, only render what's visible in the orthographic camera frustum. Disable or unmount lights/effects for off-screen objects.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.5} /></>;
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return <><Clouds intensity={0.8} /><Rain count={portalMode ? 100 : 800} /></>;
  } else if (weatherType === 'snowy') {
    return <><Clouds intensity={0.6} /><Snow count={portalMode ? 50 : 400} /></>;
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Conditional mounting prevents wasted polygon processing for inactive effects
- For orthographic camera, check if objects are within the camera's frustum before rendering
- Consider distance-based culling for lights: reduce intensity or disable lights beyond a threshold

---

## 8. Dark Scene / Night Mode Setup

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Replacing expensive atmospheric components (Sky) with simple black background for night scenes, adding star field for depth.

**How it applies**: For your dark TRON scene, skip the Sky component entirely. Use a dark or black background. Add subtle particle stars or grid lines for atmosphere.

**Code snippet**:
```javascript
// Night:
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

// Skip Sky at night - black background is better and faster
```

**Gotchas/tips**:
- **Skip Sky component at night** — it's computationally expensive and a black backdrop with Stars looks better and performs faster
- For TRON aesthetic, consider a subtle grid floor or atmospheric fog instead of stars
- Adjust `fog` near/far distances to create depth without obscuring nearby glowing objects

---

## 9. MeshLambertMaterial for Translucent Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshLambertMaterial` for volumetric translucent objects like clouds.

**How it applies**: For frosted glass, consider materials that respond to light without full PBR complexity. `MeshPhysicalMaterial` with transmission is ideal for glass, but `MeshLambertMaterial` can work for simpler translucent effects.

**Code snippet**:
```javascript
<DreiClouds material={new THREE.MeshLambertMaterial()}>
  <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
    color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
</DreiClouds>
```

**For frosted glass (recommended)**:
```javascript
<meshPhysicalMaterial
  color="#ffffff"
  transmission={0.9}
  roughness={0.3}
  thickness={0.5}
  transparent
  opacity={0.8}
/>
```

**Gotchas/tips**:
- `MeshLambertMaterial` is cheaper than `MeshStandardMaterial` but doesn't support transmission
- For true frosted glass, use `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Higher `roughness` values (0.3-0.6) create the frosted blur effect
- `thickness` controls how far light travels through the material — affects internal light scattering

---

## 10. Performance Optimization Summary

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Multiple strategies for maintaining performance with complex scenes.

**How it applies**: For many light sources and mesh primitives, these optimizations are critical:

| Concern | Strategy | Impact |
|---------|----------|--------|
| **Draw calls** | `instancedMesh` collapses 1000 particles → 1 draw call | Orders of magnitude fewer GPU calls |
| **Conditional rendering** | Only mount active components | No wasted polygon processing |
| **Memory lifecycle** | `useMemo` for arrays and dummy objects | Eliminates per-frame GC churn |
| **Light count** | Group lights, use vertex shader fake lighting for distant objects | Reduces GPU light calculations |
| **Portal textures** | 256px resolution keeps texture memory manageable | ~768 KB for 3 portals |

**Additional tips**:
- **Particle/object counts**: Portal mode drops counts by ~87.5% (800→100) — apply similar reduction for distant/simplified views
- **Texture memory**: Keep render textures and effects buffers at minimum viable resolution
- **GPU budget**: For many point lights, consider using `deferred` rendering or limiting light count in standard forward rendering

---

## 11. Orthographic Camera Considerations (Inferred)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber (inferred from scene setup)

**Technique**: Scene configuration for orthographic projection.

**How it applies**: Orthographic cameras lack depth perspective, which affects how lighting and shadows appear. Distance-based attenuation of point lights will appear differently than in perspective views.

**Code snippet** (setup):
```javascript
import { OrthographicCamera } from '@react-three/drei';

<OrthographicCamera
  makeDefault
  position={[0, 10, 10]}
  zoom={50}
  near={0.1}
  far={1000}
/>
```

**Gotchas/tips**:
- Point light `distance` and `decay` parameters behave differently in orthographic view — test visually
- Shadows from orthographic cameras use `OrthographicShadowMap` — configure shadow camera bounds tightly
- Bloom and post-processing work identically regardless of camera type

---

## 12. Portal Rendering for Nested Scenes (Optional)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshPortalMaterial` to render complete 3D scenes onto 2D planes, with smooth blending transitions.

**How it applies**: For frosted glass effects, you could render a scene "behind" the glass to a texture and display it on the glass surface with blur applied.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  useFrame(() => {
    if (materialRef.current) {
      const targetBlend = isFullscreen ? 1 : 0;
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0, targetBlend, 0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} resolution={256}>
          <WeatherVisualization weatherData={portalWeatherData} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `THREE.MathUtils.lerp` at factor 0.1 creates smooth ~10-frame blend transitions
- **Portal resolution 256 is the sweet spot** — higher values (512+) increase GPU memory per portal
- `roundedPlaneGeometry` from `maath` provides organic corners for glass panels# Extracted Techniques for TRON-like Dark Scene with Internal Lighting

## 1. Point Light Inside Translucent Mesh

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Embedding a point light source inside a mesh primitive to create the effect of light emanating from within an object.

**How it applies**: This is the core technique for your frosted glass primitives. Place a point light at the center of each translucent mesh (sphere, cube, etc.) so light emanates outward through the glass material onto the dark ground plane.

**Code snippet**:
```javascript
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` relative to the parent group, placing it at the exact center of the mesh
- `distance` parameter controls how far the light reaches — adjust based on your scene scale
- For frosted glass, replace `MeshBasicMaterial` with `MeshPhysicalMaterial` featuring `transmission`, `roughness`, and `thickness` properties
- The intensity (2.5) is deliberately low because the internal light contributes less to overall scene illumination than external lights

---

## 2. Dynamic Light Intensity / Strobe Effect

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using refs and `useFrame` to dynamically control light intensity, creating flashing or pulsing effects with cooldown protection.

**How it applies**: For TRON-like neon aesthetics, you can create pulsing lights inside your glass primitives. The random timing creates organic variation; for more regular pulsing, use sinusoidal intensity changes.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame(() => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        lightningLightRef.current.position.x = (Math.random() - 0.5) * 10;
        lightningLightRef.current.intensity = 90;
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**For smooth pulsing (TRON-style)**:
```javascript
useFrame((state) => {
  if (lightRef.current) {
    // Sinusoidal pulse between 1.0 and 3.0 intensity
    lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 1.0;
  }
});
```

**Gotchas/tips**:
- **Never create `new Object3D()` in the animation loop** — use `useRef` to persist values across frames without GC pressure
- Ref-based cooldown (`lightningActive.current`) prevents overlapping flash cycles
- The `decay` parameter (0.8) creates realistic light falloff — experiment with values 0-2 for different effects
- Random position changes create varied visual interest

---

## 3. Post-Processing Bloom for Glow Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `EffectComposer` with `Bloom` pass to create selective glow on bright objects.

**How it applies**: Bloom is essential for the TRON neon aesthetic. The `threshold` parameter controls which objects glow — only objects brighter than the threshold will bloom. This enables selective glow on your light-emitting glass primitives.

**Code snippet**:
```javascript
import { EffectComposer, Bloom } from '@react-three/post-processing';

const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
        starPoints={2} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` means only objects with brightness > 0.9 will bloom — adjust to isolate your neon elements
- For selective bloom on specific objects, you can use render layers or ensure your glowing objects use emissive materials with high intensity
- Combine with `MeshBasicMaterial` or emissive `MeshStandardMaterial` on your glass primitives for maximum bloom effect
- Bloom is computationally expensive — consider disabling or reducing quality on mobile

---

## 4. Instanced Rendering for Many Mesh Primitives

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `instancedMesh` to render thousands of objects in a single draw call via matrix transforms.

**How it applies**: For "many small light sources" performance optimization. If you have dozens or hundreds of frosted glass primitives, instanced rendering dramatically reduces draw calls. Note: each instance shares the same geometry and material.

**Code snippet**:
```javascript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) particle.y = 20;
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- **Always set `instanceMatrix.needsUpdate = true`** after updating transforms, or instances freeze
- **Never create `new Object3D()` in the animation loop** — use `useMemo` to create a single dummy object at mount to avoid GC pressure
- For glass primitives with internal lights, you cannot use true instancing (each needs its own light) — consider grouping lights or using vertex shader-based fake lighting for distant objects
- Draw calls: `instancedMesh` collapses 1000 particles → 1 draw call

---

## 5. Time-Based Animation with useFrame

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `state.clock.elapsedTime` to drive all continuous motion — rotation, drift, pulsing.

**How it applies**: For TRON aesthetics, drive rotation of neon elements, subtle floating animation of glass primitives, and any ambient motion.

**Code snippet** (rotation):
```javascript
useFrame((state) => {
  if (meshRef.current) {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  }
});
```

**Code snippet** (sinusoidal drift for floating effect):
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
    // ...
  });
});
```

**Gotchas/tips**:
- The offset `i` in `Math.sin(time + i)` gives each object its own phase offset, preventing synchronized motion
- For smooth floating effect: `position.y = baseY + Math.sin(state.clock.elapsedTime * speed) * amplitude`
- All animated elements should use the same `state.clock.elapsedTime` for synchronized timing

---

## 6. Ref-Based State for Light Control

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `useRef` to persist state across frames without triggering re-renders or creating garbage collection pressure.

**How it applies**: Essential for controlling many lights efficiently — tracking active states, cooldowns, or animation progress for each light source.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame(() => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    if (lightningLightRef.current) {
      lightningLightRef.current.intensity = 90;
      setTimeout(() => {
        if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
        lightningActive.current = false;
      }, 400);
    }
  }
});
```

**Gotchas/tips**:
- Refs don't trigger re-renders when changed — use for animation state, not UI state
- Always check `if (ref.current)` before accessing — refs are null until after initial render
- For arrays of lights, use `useRef([])` and initialize in a `useEffect` or `useLayoutEffect`

---

## 7. Conditional Rendering for Performance

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Only mounting components that are currently visible or active, unmounting inactive effects entirely.

**How it applies**: For scenes with many objects, only render what's visible in the orthographic camera frustum. Disable or unmount lights/effects for off-screen objects.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.5} /></>;
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return <><Clouds intensity={0.8} /><Rain count={portalMode ? 100 : 800} /></>;
  } else if (weatherType === 'snowy') {
    return <><Clouds intensity={0.6} /><Snow count={portalMode ? 50 : 400} /></>;
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Conditional mounting prevents wasted polygon processing for inactive effects
- For orthographic camera, check if objects are within the camera's frustum before rendering
- Consider distance-based culling for lights: reduce intensity or disable lights beyond a threshold

---

## 8. Dark Scene / Night Mode Setup

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Replacing expensive atmospheric components (Sky) with simple black background for night scenes, adding star field for depth.

**How it applies**: For your dark TRON scene, skip the Sky component entirely. Use a dark or black background. Add subtle particle stars or grid lines for atmosphere.

**Code snippet**:
```javascript
// Night:
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

// Skip Sky at night - black background is better and faster
```

**Gotchas/tips**:
- **Skip Sky component at night** — it's computationally expensive and a black backdrop with Stars looks better and performs faster
- For TRON aesthetic, consider a subtle grid floor or atmospheric fog instead of stars
- Adjust `fog` near/far distances to create depth without obscuring nearby glowing objects

---

## 9. MeshLambertMaterial for Translucent Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshLambertMaterial` for volumetric translucent objects like clouds.

**How it applies**: For frosted glass, consider materials that respond to light without full PBR complexity. `MeshPhysicalMaterial` with transmission is ideal for glass, but `MeshLambertMaterial` can work for simpler translucent effects.

**Code snippet**:
```javascript
<DreiClouds material={new THREE.MeshLambertMaterial()}>
  <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
    color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
</DreiClouds>
```

**For frosted glass (recommended)**:
```javascript
<meshPhysicalMaterial
  color="#ffffff"
  transmission={0.9}
  roughness={0.3}
  thickness={0.5}
  transparent
  opacity={0.8}
/>
```

**Gotchas/tips**:
- `MeshLambertMaterial` is cheaper than `MeshStandardMaterial` but doesn't support transmission
- For true frosted glass, use `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Higher `roughness` values (0.3-0.6) create the frosted blur effect
- `thickness` controls how far light travels through the material — affects internal light scattering

---

## 10. Performance Optimization Summary

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Multiple strategies for maintaining performance with complex scenes.

**How it applies**: For many light sources and mesh primitives, these optimizations are critical:

| Concern | Strategy | Impact |
|---------|----------|--------|
| **Draw calls** | `instancedMesh` collapses 1000 particles → 1 draw call | Orders of magnitude fewer GPU calls |
| **Conditional rendering** | Only mount active components | No wasted polygon processing |
| **Memory lifecycle** | `useMemo` for arrays and dummy objects | Eliminates per-frame GC churn |
| **Light count** | Group lights, use vertex shader fake lighting for distant objects | Reduces GPU light calculations |
| **Portal textures** | 256px resolution keeps texture memory manageable | ~768 KB for 3 portals |

**Additional tips**:
- **Particle/object counts**: Portal mode drops counts by ~87.5% (800→100) — apply similar reduction for distant/simplified views
- **Texture memory**: Keep render textures and effects buffers at minimum viable resolution
- **GPU budget**: For many point lights, consider using `deferred` rendering or limiting light count in standard forward rendering

---

## 11. Orthographic Camera Considerations (Inferred)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber (inferred from scene setup)

**Technique**: Scene configuration for orthographic projection.

**How it applies**: Orthographic cameras lack depth perspective, which affects how lighting and shadows appear. Distance-based attenuation of point lights will appear differently than in perspective views.

**Code snippet** (setup):
```javascript
import { OrthographicCamera } from '@react-three/drei';

<OrthographicCamera
  makeDefault
  position={[0, 10, 10]}
  zoom={50}
  near={0.1}
  far={1000}
/>
```

**Gotchas/tips**:
- Point light `distance` and `decay` parameters behave differently in orthographic view — test visually
- Shadows from orthographic cameras use `OrthographicShadowMap` — configure shadow camera bounds tightly
- Bloom and post-processing work identically regardless of camera type

---

## 12. Portal Rendering for Nested Scenes (Optional)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshPortalMaterial` to render complete 3D scenes onto 2D planes, with smooth blending transitions.

**How it applies**: For frosted glass effects, you could render a scene "behind" the glass to a texture and display it on the glass surface with blur applied.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  useFrame(() => {
    if (materialRef.current) {
      const targetBlend = isFullscreen ? 1 : 0;
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0, targetBlend, 0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} resolution={256}>
          <WeatherVisualization weatherData={portalWeatherData} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `THREE.MathUtils.lerp` at factor 0.1 creates smooth ~10-frame blend transitions
- **Portal resolution 256 is the sweet spot** — higher values (512+) increase GPU memory per portal
- `roundedPlaneGeometry` from `maath` provides organic corners for glass panels# Extracted Techniques for TRON-like Dark Scene with Internal Lighting

## 1. Point Light Inside Translucent Mesh

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Embedding a point light source inside a mesh primitive to create the effect of light emanating from within an object.

**How it applies**: This is the core technique for your frosted glass primitives. Place a point light at the center of each translucent mesh (sphere, cube, etc.) so light emanates outward through the glass material onto the dark ground plane.

**Code snippet**:
```javascript
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` relative to the parent group, placing it at the exact center of the mesh
- `distance` parameter controls how far the light reaches — adjust based on your scene scale
- For frosted glass, replace `MeshBasicMaterial` with `MeshPhysicalMaterial` featuring `transmission`, `roughness`, and `thickness` properties
- The intensity (2.5) is deliberately low because the internal light contributes less to overall scene illumination than external lights

---

## 2. Dynamic Light Intensity / Strobe Effect

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using refs and `useFrame` to dynamically control light intensity, creating flashing or pulsing effects with cooldown protection.

**How it applies**: For TRON-like neon aesthetics, you can create pulsing lights inside your glass primitives. The random timing creates organic variation; for more regular pulsing, use sinusoidal intensity changes.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame(() => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        lightningLightRef.current.position.x = (Math.random() - 0.5) * 10;
        lightningLightRef.current.intensity = 90;
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**For smooth pulsing (TRON-style)**:
```javascript
useFrame((state) => {
  if (lightRef.current) {
    // Sinusoidal pulse between 1.0 and 3.0 intensity
    lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 1.0;
  }
});
```

**Gotchas/tips**:
- **Never create `new Object3D()` in the animation loop** — use `useRef` to persist values across frames without GC pressure
- Ref-based cooldown (`lightningActive.current`) prevents overlapping flash cycles
- The `decay` parameter (0.8) creates realistic light falloff — experiment with values 0-2 for different effects
- Random position changes create varied visual interest

---

## 3. Post-Processing Bloom for Glow Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `EffectComposer` with `Bloom` pass to create selective glow on bright objects.

**How it applies**: Bloom is essential for the TRON neon aesthetic. The `threshold` parameter controls which objects glow — only objects brighter than the threshold will bloom. This enables selective glow on your light-emitting glass primitives.

**Code snippet**:
```javascript
import { EffectComposer, Bloom } from '@react-three/post-processing';

const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
        starPoints={2} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` means only objects with brightness > 0.9 will bloom — adjust to isolate your neon elements
- For selective bloom on specific objects, you can use render layers or ensure your glowing objects use emissive materials with high intensity
- Combine with `MeshBasicMaterial` or emissive `MeshStandardMaterial` on your glass primitives for maximum bloom effect
- Bloom is computationally expensive — consider disabling or reducing quality on mobile

---

## 4. Instanced Rendering for Many Mesh Primitives

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `instancedMesh` to render thousands of objects in a single draw call via matrix transforms.

**How it applies**: For "many small light sources" performance optimization. If you have dozens or hundreds of frosted glass primitives, instanced rendering dramatically reduces draw calls. Note: each instance shares the same geometry and material.

**Code snippet**:
```javascript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) particle.y = 20;
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- **Always set `instanceMatrix.needsUpdate = true`** after updating transforms, or instances freeze
- **Never create `new Object3D()` in the animation loop** — use `useMemo` to create a single dummy object at mount to avoid GC pressure
- For glass primitives with internal lights, you cannot use true instancing (each needs its own light) — consider grouping lights or using vertex shader-based fake lighting for distant objects
- Draw calls: `instancedMesh` collapses 1000 particles → 1 draw call

---

## 5. Time-Based Animation with useFrame

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `state.clock.elapsedTime` to drive all continuous motion — rotation, drift, pulsing.

**How it applies**: For TRON aesthetics, drive rotation of neon elements, subtle floating animation of glass primitives, and any ambient motion.

**Code snippet** (rotation):
```javascript
useFrame((state) => {
  if (meshRef.current) {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  }
});
```

**Code snippet** (sinusoidal drift for floating effect):
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
    // ...
  });
});
```

**Gotchas/tips**:
- The offset `i` in `Math.sin(time + i)` gives each object its own phase offset, preventing synchronized motion
- For smooth floating effect: `position.y = baseY + Math.sin(state.clock.elapsedTime * speed) * amplitude`
- All animated elements should use the same `state.clock.elapsedTime` for synchronized timing

---

## 6. Ref-Based State for Light Control

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `useRef` to persist state across frames without triggering re-renders or creating garbage collection pressure.

**How it applies**: Essential for controlling many lights efficiently — tracking active states, cooldowns, or animation progress for each light source.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame(() => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    if (lightningLightRef.current) {
      lightningLightRef.current.intensity = 90;
      setTimeout(() => {
        if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
        lightningActive.current = false;
      }, 400);
    }
  }
});
```

**Gotchas/tips**:
- Refs don't trigger re-renders when changed — use for animation state, not UI state
- Always check `if (ref.current)` before accessing — refs are null until after initial render
- For arrays of lights, use `useRef([])` and initialize in a `useEffect` or `useLayoutEffect`

---

## 7. Conditional Rendering for Performance

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Only mounting components that are currently visible or active, unmounting inactive effects entirely.

**How it applies**: For scenes with many objects, only render what's visible in the orthographic camera frustum. Disable or unmount lights/effects for off-screen objects.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.5} /></>;
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return <><Clouds intensity={0.8} /><Rain count={portalMode ? 100 : 800} /></>;
  } else if (weatherType === 'snowy') {
    return <><Clouds intensity={0.6} /><Snow count={portalMode ? 50 : 400} /></>;
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Conditional mounting prevents wasted polygon processing for inactive effects
- For orthographic camera, check if objects are within the camera's frustum before rendering
- Consider distance-based culling for lights: reduce intensity or disable lights beyond a threshold

---

## 8. Dark Scene / Night Mode Setup

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Replacing expensive atmospheric components (Sky) with simple black background for night scenes, adding star field for depth.

**How it applies**: For your dark TRON scene, skip the Sky component entirely. Use a dark or black background. Add subtle particle stars or grid lines for atmosphere.

**Code snippet**:
```javascript
// Night:
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

// Skip Sky at night - black background is better and faster
```

**Gotchas/tips**:
- **Skip Sky component at night** — it's computationally expensive and a black backdrop with Stars looks better and performs faster
- For TRON aesthetic, consider a subtle grid floor or atmospheric fog instead of stars
- Adjust `fog` near/far distances to create depth without obscuring nearby glowing objects

---

## 9. MeshLambertMaterial for Translucent Effects

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshLambertMaterial` for volumetric translucent objects like clouds.

**How it applies**: For frosted glass, consider materials that respond to light without full PBR complexity. `MeshPhysicalMaterial` with transmission is ideal for glass, but `MeshLambertMaterial` can work for simpler translucent effects.

**Code snippet**:
```javascript
<DreiClouds material={new THREE.MeshLambertMaterial()}>
  <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
    color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
</DreiClouds>
```

**For frosted glass (recommended)**:
```javascript
<meshPhysicalMaterial
  color="#ffffff"
  transmission={0.9}
  roughness={0.3}
  thickness={0.5}
  transparent
  opacity={0.8}
/>
```

**Gotchas/tips**:
- `MeshLambertMaterial` is cheaper than `MeshStandardMaterial` but doesn't support transmission
- For true frosted glass, use `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Higher `roughness` values (0.3-0.6) create the frosted blur effect
- `thickness` controls how far light travels through the material — affects internal light scattering

---

## 10. Performance Optimization Summary

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Multiple strategies for maintaining performance with complex scenes.

**How it applies**: For many light sources and mesh primitives, these optimizations are critical:

| Concern | Strategy | Impact |
|---------|----------|--------|
| **Draw calls** | `instancedMesh` collapses 1000 particles → 1 draw call | Orders of magnitude fewer GPU calls |
| **Conditional rendering** | Only mount active components | No wasted polygon processing |
| **Memory lifecycle** | `useMemo` for arrays and dummy objects | Eliminates per-frame GC churn |
| **Light count** | Group lights, use vertex shader fake lighting for distant objects | Reduces GPU light calculations |
| **Portal textures** | 256px resolution keeps texture memory manageable | ~768 KB for 3 portals |

**Additional tips**:
- **Particle/object counts**: Portal mode drops counts by ~87.5% (800→100) — apply similar reduction for distant/simplified views
- **Texture memory**: Keep render textures and effects buffers at minimum viable resolution
- **GPU budget**: For many point lights, consider using `deferred` rendering or limiting light count in standard forward rendering

---

## 11. Orthographic Camera Considerations (Inferred)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber (inferred from scene setup)

**Technique**: Scene configuration for orthographic projection.

**How it applies**: Orthographic cameras lack depth perspective, which affects how lighting and shadows appear. Distance-based attenuation of point lights will appear differently than in perspective views.

**Code snippet** (setup):
```javascript
import { OrthographicCamera } from '@react-three/drei';

<OrthographicCamera
  makeDefault
  position={[0, 10, 10]}
  zoom={50}
  near={0.1}
  far={1000}
/>
```

**Gotchas/tips**:
- Point light `distance` and `decay` parameters behave differently in orthographic view — test visually
- Shadows from orthographic cameras use `OrthographicShadowMap` — configure shadow camera bounds tightly
- Bloom and post-processing work identically regardless of camera type

---

## 12. Portal Rendering for Nested Scenes (Optional)

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Using `MeshPortalMaterial` to render complete 3D scenes onto 2D planes, with smooth blending transitions.

**How it applies**: For frosted glass effects, you could render a scene "behind" the glass to a texture and display it on the glass surface with blur applied.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  useFrame(() => {
    if (materialRef.current) {
      const targetBlend = isFullscreen ? 1 : 0;
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0, targetBlend, 0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} resolution={256}>
          <WeatherVisualization weatherData={portalWeatherData} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `THREE.MathUtils.lerp` at factor 0.1 creates smooth ~10-frame blend transitions
- **Portal resolution 256 is the sweet spot** — higher values (512+) increase GPU memory per portal
- `roundedPlaneGeometry` from `maath` provides organic corners for glass panels# Three.js Lighting Techniques for Dark TRON-like Scene Aesthetic

## Target Scene Requirements
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

## 1. Baked emissive materials for light sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Baked emissive materials for light sources

**How it applies**: For frosted glass primitives with internal point lights, bake the light emanation pattern into emissiveMap. This creates the illusion of light glowing from within glass objects onto surrounding surfaces without real-time point light cost - essential for TRON aesthetic.

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Eliminates real-time shadow/light computation entirely
- Use toneMapped: false for neon elements to preserve brightness regardless of scene exposure
- Most effective for static geometry - requires rebaking if positions change
- Quality comes from asset pipeline (Blender) not runtime code
- CRITICAL for many small light sources - baking eliminates per-light render cost

---

## 2. Offline baked lightmaps for shadows on ground plane

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Offline baked lightmaps for shadows on ground plane

**How it applies**: Pre-bake the light spill from internal point lights through frosted glass onto the dark ground plane. Creates soft shadows emanating from glowing primitives without any real-time shadow computation.

**Code snippet**:
```javascript
const groundMaterial = new THREE.MeshBasicMaterial({
  map: bakedGroundAlbedo,
  lightMap: bakedLightMap,
  lightMapIntensity: 1.0
});
```

**Gotchas/tips**:
- All work done in 3D modeling app (Blender) - invest in pipeline
- Re-baking needed if object positions change
- Normal map baking recommended for lightweight, fast-loading assets
- Combine with SSAO for additional soft contact shadows

---

## 3. HDRI environment lighting without real-time sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: HDRI environment lighting without real-time sources

**How it applies**: For dark TRON scenes, use a subtle/dark HDRI as scene.environment to provide minimal ambient fill so non-illuminated areas aren't pure black, while maintaining dark moody aesthetic.

**Code snippet**:
```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromEquirectangular(darkHDRI).texture;
scene.environment = envMap;
// scene.background = null; // or very dark color for TRON aesthetic
```

**Gotchas/tips**:
- HDRI alone won't cast shadows - combine with baked lightmaps
- No real-time shadow computation needed when using HDRI-only
- Keep HDRI very dark/subtle to avoid washing out neon glows
- Bypasses real-time lights entirely for performance

---

## 4. Bloom for selective neon glow effects

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bloom for selective neon glow effects

**How it applies**: Apply bloom post-processing to create TRON-like neon glow on emissive objects. Use threshold parameter to control selective glow - only brightest materials bloom.

**Code snippet**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold - controls which bright objects bloom
);
composer.addPass(bloomPass);
```

**Gotchas/tips**:
- Apply bloom ONLY when viewport stabilizes for performance - not every frame
- Threshold parameter controls selective bloom (key for TRON aesthetic)
- Multiple bloom implementations available (UnrealBloomPass most common)
- MORE PERFORMANT than actual light sources for many glowing objects
- Combine with toneMapped: false materials for consistent bright output

---

## 5. Screen-space ambient occlusion for soft contact shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Screen-space ambient occlusion for soft contact shadows

**How it applies**: Add subtle soft shadows where frosted glass objects meet dark ground plane. Screen-space technique doesn't require actual light sources - works perfectly in dark scenes for atmospheric depth.

**Code snippet**:
```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
// or GTAO for higher quality:
// import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

**Gotchas/tips**:
- Screen-space technique - doesn't require actual light sources
- GTAO is higher quality but more expensive than SSAO
- Has performance cost - apply judiciously for many objects
- Perfect for soft atmospheric shadows in dark scenes

---

## 6. Apply expensive post-processing only when viewport stabilizes

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Apply expensive post-processing only when viewport stabilizes

**How it applies**: Critical optimization for many light sources with bloom. Apply DOF, bloom, AA only when camera stops moving - user won't notice missing effects during movement.

**Code snippet**:
```javascript
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let isStable = false;
let stabilityTimeout = null;

function checkStability() {
  const positionChanged = !camera.position.equals(lastCameraPosition);
  const rotationChanged = !camera.rotation.equals(lastCameraRotation);
  
  if (positionChanged || rotationChanged) {
    isStable = false;
    clearTimeout(stabilityTimeout);
    stabilityTimeout = setTimeout(() => { isStable = true; }, 500);
  }
  
  lastCameraPosition.copy(camera.position);
  lastCameraRotation.copy(camera.rotation);
}

// In render loop
function animate() {
  checkStability();
  
  if (isStable) {
    composer.render(); // Full post-processing
  } else {
    renderer.render(scene, camera); // Basic render only
  }
  
  requestAnimationFrame(animate);
}
```

**Gotchas/tips**:
- SIGNIFICANT performance savings for expensive bloom/DOF
- Critical for mobile/VR performance targets
- User won't notice missing bloom during rapid camera movement
- Essential when many objects require post-processing

---

## 7. Minimize transparent and reflective surfaces for performance

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Minimize transparent and reflective surfaces for performance

**How it applies**: Frosted glass requires transparency but it's expensive. Consider faking frosted appearance with baked textures instead of real-time transmission. Use transparency strategically on key objects only.

**Code snippet**:
```javascript
// Option A: Real transparency (EXPENSIVE - use sparingly)
const frostedGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  roughness: 0.5,
  thickness: 0.5,
  transparent: true
});

// Option B: Faked with baked texture (CHEAPER - recommended)
const frostedGlass = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,    // Pre-rendered frosted appearance
  transparent: false,          // No runtime transparency cost
  emissiveMap: internalGlowMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Transparent surfaces are EXPENSIVE - minimize for VR/mobile
- MeshPhysicalMaterial transmission is particularly expensive
- Consider baking frosted appearance instead of real-time transmission
- Reduces draw calls and overdraw significantly

---

## 8. Cap texture resolution at 2048px for device compatibility

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Cap texture resolution at 2048px for device compatibility

**How it applies**: When baking lightmaps for many small light-emitting objects, manage texture memory carefully. WebGL shader limits drop to 2048px on many devices. Use texture atlases.

**Code snippet**:
```javascript
// Ensure baked textures don't exceed 2048px for broad compatibility
const maxTextureSize = 2048;

// Use texture atlases for many small objects
// Combine multiple lightmaps into single atlas to reduce draw calls
```

**Gotchas/tips**:
- Max 4092px on some devices, DROPS TO 2048px on many
- 'All memory left is being used to store/display largest textures and meshes'
- CRITICAL when many emissive objects with individual lightmaps
- Texture atlases reduce draw calls for many small objects

---

## 9. Disable tone mapping for consistent neon brightness

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Disable tone mapping for consistent neon brightness

**How it applies**: For TRON neon elements, use toneMapped: false so they always appear at full brightness regardless of scene exposure settings. Creates consistent bright glow even in very dark scenes.

**Code snippet**:
```javascript
// Neon glow material - always full brightness
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,        // Cyan TRON color
  emissive: 0x00ffff,
  emissiveIntensity: 1.0,
  toneMapped: false       // Bypass scene tone mapping
});

// For internal point light simulation
const internalGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: new THREE.Color(0x00ffff),
  toneMapped: false
});
```

**Gotchas/tips**:
- Prevents neon elements from being dimmed by tone mapping
- Creates CONSISTENT bright appearance even in very dark scenes
- Combine with bloom for enhanced TRON glow effect
- Essential for orthographic camera dark scenes

---

## 10. Prefer WebGL over WebGPU for broad device support

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Prefer WebGL over WebGPU for broad device support

**How it applies**: For TRON scene with many light sources needing broad compatibility, stick with WebGL. WebGPU not viable for production if you need customers and devices to run with default settings.

**Code snippet**:
```javascript
// Use WebGLRenderer, NOT WebGPURenderer
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
```

**Gotchas/tips**:
- 'WebGPU is not an option if you plan to allow any customers and devices'
- WebGPU adoption still limited in production environments
- WebGL has MUCH BROADER browser/device support
- Critical for reaching wide audience

---

## 11. Progressive shadow rendering as real-time alternative

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Progressive shadow rendering as real-time alternative

**How it applies**: If baking isn't feasible (dynamic object positions), progressive shadow rendering provides soft shadows. More expensive but allows for dynamic scenes where frosted glass objects move.

**Code snippet**:
```javascript
// Progressive shadow maps for dynamic scenes
// (implementation depends on Three.js version and requirements)
// Consider for dynamic object positions where baking isn't possible
```

**Gotchas/tips**:
- More expensive than baked approach
- Useful when geometry changes dynamically
- Combine with SSAO for soft shadows
- Not recommended if you can bake instead

---

## 12. GLB/GLTF export from DCC tools for baked assets

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: GLB/GLTF export from DCC tools for baked assets

**How it applies**: Export frosted glass primitives and scene geometry as GLB/GLTF from Blender. All quality work happens in 3D modeling app - Three.js just displays the baked result.

**Code snippet**:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('tron-scene-baked.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**Gotchas/tips**:
- 'All the work is mostly done outside three, on your 3D modeling app'
- INVEST in Blender baking workflow - this is where quality comes from
- Normal map baking for lightweight assets
- Export furniture and geometry as GLB/GLTF

---

## Implementation Summary for TRON-like Dark Scene

### Core Strategy: BAKE EVERYTHING
The document is emphatic: **"Most of the quality comes from offline work, not Three.js code"**

1. **Bake all internal point light emanation** into emissive maps
2. **Bake shadows onto ground plane** into lightmaps
3. **Use unlit/emissive materials** in Three.js (eliminate real-time lights)
4. **Invest in Blender baking pipeline** - this is where quality comes from

### Recommended Post-Processing Stack
```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 1. SSAO for soft contact shadows
composer.addPass(new SSAOPass(scene, camera, width, height));

// 2. Bloom for neon glow (use threshold for selective glow)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.5, 0.4, 0.85
);
composer.addPass(bloomPass);
```

### Performance-Critical Optimizations

| Optimization | Why It Matters |
|--------------|----------------|
| Bake all lighting | Eliminates real-time light/shadow cost entirely |
| toneMapped: false | Consistent neon brightness in dark scenes |
| Apply bloom on stabilize | Don't run expensive effects every frame |
| Cap textures at 2048px | Broad device compatibility |
| Minimize transparency | Reduces draw calls and overdraw |
| Fake frosted glass | Avoid expensive MeshPhysicalMaterial transmission |
| Use WebGL not WebGPU | Broad customer/device support |

### Material Template for Frosted Glass with Internal Light
```javascript
// Faked frosted glass with internal glow (RECOMMENDED)
const frostedGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,      // Pre-baked frosted appearance
  emissiveMap: bakedGlowMap,     // Pre-baked internal light emanation
  emissive: new THREE.Color(0x00ffff),  // TRON cyan
  toneMapped: false              // Always bright
});
```

### What NOT To Do
- ❌ Don't use real-time point lights inside each primitive
- ❌ Don't use MeshPhysicalMaterial transmission for many frosted objects
- ❌ Don't apply bloom every frame during camera movement
- ❌ Don't exceed 2048px texture resolution
- ❌ Don't rely on WebGPU for production
# Three.js Lighting Techniques for Dark TRON-like Scene Aesthetic

## Target Scene Requirements
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

## 1. Baked emissive materials for light sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Baked emissive materials for light sources

**How it applies**: For frosted glass primitives with internal point lights, bake the light emanation pattern into emissiveMap. This creates the illusion of light glowing from within glass objects onto surrounding surfaces without real-time point light cost - essential for TRON aesthetic.

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Eliminates real-time shadow/light computation entirely
- Use toneMapped: false for neon elements to preserve brightness regardless of scene exposure
- Most effective for static geometry - requires rebaking if positions change
- Quality comes from asset pipeline (Blender) not runtime code
- CRITICAL for many small light sources - baking eliminates per-light render cost

---

## 2. Offline baked lightmaps for shadows on ground plane

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Offline baked lightmaps for shadows on ground plane

**How it applies**: Pre-bake the light spill from internal point lights through frosted glass onto the dark ground plane. Creates soft shadows emanating from glowing primitives without any real-time shadow computation.

**Code snippet**:
```javascript
const groundMaterial = new THREE.MeshBasicMaterial({
  map: bakedGroundAlbedo,
  lightMap: bakedLightMap,
  lightMapIntensity: 1.0
});
```

**Gotchas/tips**:
- All work done in 3D modeling app (Blender) - invest in pipeline
- Re-baking needed if object positions change
- Normal map baking recommended for lightweight, fast-loading assets
- Combine with SSAO for additional soft contact shadows

---

## 3. HDRI environment lighting without real-time sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: HDRI environment lighting without real-time sources

**How it applies**: For dark TRON scenes, use a subtle/dark HDRI as scene.environment to provide minimal ambient fill so non-illuminated areas aren't pure black, while maintaining dark moody aesthetic.

**Code snippet**:
```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromEquirectangular(darkHDRI).texture;
scene.environment = envMap;
// scene.background = null; // or very dark color for TRON aesthetic
```

**Gotchas/tips**:
- HDRI alone won't cast shadows - combine with baked lightmaps
- No real-time shadow computation needed when using HDRI-only
- Keep HDRI very dark/subtle to avoid washing out neon glows
- Bypasses real-time lights entirely for performance

---

## 4. Bloom for selective neon glow effects

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bloom for selective neon glow effects

**How it applies**: Apply bloom post-processing to create TRON-like neon glow on emissive objects. Use threshold parameter to control selective glow - only brightest materials bloom.

**Code snippet**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold - controls which bright objects bloom
);
composer.addPass(bloomPass);
```

**Gotchas/tips**:
- Apply bloom ONLY when viewport stabilizes for performance - not every frame
- Threshold parameter controls selective bloom (key for TRON aesthetic)
- Multiple bloom implementations available (UnrealBloomPass most common)
- MORE PERFORMANT than actual light sources for many glowing objects
- Combine with toneMapped: false materials for consistent bright output

---

## 5. Screen-space ambient occlusion for soft contact shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Screen-space ambient occlusion for soft contact shadows

**How it applies**: Add subtle soft shadows where frosted glass objects meet dark ground plane. Screen-space technique doesn't require actual light sources - works perfectly in dark scenes for atmospheric depth.

**Code snippet**:
```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
// or GTAO for higher quality:
// import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

**Gotchas/tips**:
- Screen-space technique - doesn't require actual light sources
- GTAO is higher quality but more expensive than SSAO
- Has performance cost - apply judiciously for many objects
- Perfect for soft atmospheric shadows in dark scenes

---

## 6. Apply expensive post-processing only when viewport stabilizes

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Apply expensive post-processing only when viewport stabilizes

**How it applies**: Critical optimization for many light sources with bloom. Apply DOF, bloom, AA only when camera stops moving - user won't notice missing effects during movement.

**Code snippet**:
```javascript
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let isStable = false;
let stabilityTimeout = null;

function checkStability() {
  const positionChanged = !camera.position.equals(lastCameraPosition);
  const rotationChanged = !camera.rotation.equals(lastCameraRotation);
  
  if (positionChanged || rotationChanged) {
    isStable = false;
    clearTimeout(stabilityTimeout);
    stabilityTimeout = setTimeout(() => { isStable = true; }, 500);
  }
  
  lastCameraPosition.copy(camera.position);
  lastCameraRotation.copy(camera.rotation);
}

// In render loop
function animate() {
  checkStability();
  
  if (isStable) {
    composer.render(); // Full post-processing
  } else {
    renderer.render(scene, camera); // Basic render only
  }
  
  requestAnimationFrame(animate);
}
```

**Gotchas/tips**:
- SIGNIFICANT performance savings for expensive bloom/DOF
- Critical for mobile/VR performance targets
- User won't notice missing bloom during rapid camera movement
- Essential when many objects require post-processing

---

## 7. Minimize transparent and reflective surfaces for performance

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Minimize transparent and reflective surfaces for performance

**How it applies**: Frosted glass requires transparency but it's expensive. Consider faking frosted appearance with baked textures instead of real-time transmission. Use transparency strategically on key objects only.

**Code snippet**:
```javascript
// Option A: Real transparency (EXPENSIVE - use sparingly)
const frostedGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  roughness: 0.5,
  thickness: 0.5,
  transparent: true
});

// Option B: Faked with baked texture (CHEAPER - recommended)
const frostedGlass = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,    // Pre-rendered frosted appearance
  transparent: false,          // No runtime transparency cost
  emissiveMap: internalGlowMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Transparent surfaces are EXPENSIVE - minimize for VR/mobile
- MeshPhysicalMaterial transmission is particularly expensive
- Consider baking frosted appearance instead of real-time transmission
- Reduces draw calls and overdraw significantly

---

## 8. Cap texture resolution at 2048px for device compatibility

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Cap texture resolution at 2048px for device compatibility

**How it applies**: When baking lightmaps for many small light-emitting objects, manage texture memory carefully. WebGL shader limits drop to 2048px on many devices. Use texture atlases.

**Code snippet**:
```javascript
// Ensure baked textures don't exceed 2048px for broad compatibility
const maxTextureSize = 2048;

// Use texture atlases for many small objects
// Combine multiple lightmaps into single atlas to reduce draw calls
```

**Gotchas/tips**:
- Max 4092px on some devices, DROPS TO 2048px on many
- 'All memory left is being used to store/display largest textures and meshes'
- CRITICAL when many emissive objects with individual lightmaps
- Texture atlases reduce draw calls for many small objects

---

## 9. Disable tone mapping for consistent neon brightness

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Disable tone mapping for consistent neon brightness

**How it applies**: For TRON neon elements, use toneMapped: false so they always appear at full brightness regardless of scene exposure settings. Creates consistent bright glow even in very dark scenes.

**Code snippet**:
```javascript
// Neon glow material - always full brightness
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,        // Cyan TRON color
  emissive: 0x00ffff,
  emissiveIntensity: 1.0,
  toneMapped: false       // Bypass scene tone mapping
});

// For internal point light simulation
const internalGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: new THREE.Color(0x00ffff),
  toneMapped: false
});
```

**Gotchas/tips**:
- Prevents neon elements from being dimmed by tone mapping
- Creates CONSISTENT bright appearance even in very dark scenes
- Combine with bloom for enhanced TRON glow effect
- Essential for orthographic camera dark scenes

---

## 10. Prefer WebGL over WebGPU for broad device support

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Prefer WebGL over WebGPU for broad device support

**How it applies**: For TRON scene with many light sources needing broad compatibility, stick with WebGL. WebGPU not viable for production if you need customers and devices to run with default settings.

**Code snippet**:
```javascript
// Use WebGLRenderer, NOT WebGPURenderer
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
```

**Gotchas/tips**:
- 'WebGPU is not an option if you plan to allow any customers and devices'
- WebGPU adoption still limited in production environments
- WebGL has MUCH BROADER browser/device support
- Critical for reaching wide audience

---

## 11. Progressive shadow rendering as real-time alternative

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Progressive shadow rendering as real-time alternative

**How it applies**: If baking isn't feasible (dynamic object positions), progressive shadow rendering provides soft shadows. More expensive but allows for dynamic scenes where frosted glass objects move.

**Code snippet**:
```javascript
// Progressive shadow maps for dynamic scenes
// (implementation depends on Three.js version and requirements)
// Consider for dynamic object positions where baking isn't possible
```

**Gotchas/tips**:
- More expensive than baked approach
- Useful when geometry changes dynamically
- Combine with SSAO for soft shadows
- Not recommended if you can bake instead

---

## 12. GLB/GLTF export from DCC tools for baked assets

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: GLB/GLTF export from DCC tools for baked assets

**How it applies**: Export frosted glass primitives and scene geometry as GLB/GLTF from Blender. All quality work happens in 3D modeling app - Three.js just displays the baked result.

**Code snippet**:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('tron-scene-baked.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**Gotchas/tips**:
- 'All the work is mostly done outside three, on your 3D modeling app'
- INVEST in Blender baking workflow - this is where quality comes from
- Normal map baking for lightweight assets
- Export furniture and geometry as GLB/GLTF

---

## Implementation Summary for TRON-like Dark Scene

### Core Strategy: BAKE EVERYTHING
The document is emphatic: **"Most of the quality comes from offline work, not Three.js code"**

1. **Bake all internal point light emanation** into emissive maps
2. **Bake shadows onto ground plane** into lightmaps
3. **Use unlit/emissive materials** in Three.js (eliminate real-time lights)
4. **Invest in Blender baking pipeline** - this is where quality comes from

### Recommended Post-Processing Stack
```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 1. SSAO for soft contact shadows
composer.addPass(new SSAOPass(scene, camera, width, height));

// 2. Bloom for neon glow (use threshold for selective glow)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.5, 0.4, 0.85
);
composer.addPass(bloomPass);
```

### Performance-Critical Optimizations

| Optimization | Why It Matters |
|--------------|----------------|
| Bake all lighting | Eliminates real-time light/shadow cost entirely |
| toneMapped: false | Consistent neon brightness in dark scenes |
| Apply bloom on stabilize | Don't run expensive effects every frame |
| Cap textures at 2048px | Broad device compatibility |
| Minimize transparency | Reduces draw calls and overdraw |
| Fake frosted glass | Avoid expensive MeshPhysicalMaterial transmission |
| Use WebGL not WebGPU | Broad customer/device support |

### Material Template for Frosted Glass with Internal Light
```javascript
// Faked frosted glass with internal glow (RECOMMENDED)
const frostedGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,      // Pre-baked frosted appearance
  emissiveMap: bakedGlowMap,     // Pre-baked internal light emanation
  emissive: new THREE.Color(0x00ffff),  // TRON cyan
  toneMapped: false              // Always bright
});
```

### What NOT To Do
- ❌ Don't use real-time point lights inside each primitive
- ❌ Don't use MeshPhysicalMaterial transmission for many frosted objects
- ❌ Don't apply bloom every frame during camera movement
- ❌ Don't exceed 2048px texture resolution
- ❌ Don't rely on WebGPU for production
# Three.js Lighting Techniques for Dark TRON-like Scene Aesthetic

## Target Scene Requirements
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

## 1. Baked emissive materials for light sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Baked emissive materials for light sources

**How it applies**: For frosted glass primitives with internal point lights, bake the light emanation pattern into emissiveMap. This creates the illusion of light glowing from within glass objects onto surrounding surfaces without real-time point light cost - essential for TRON aesthetic.

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Eliminates real-time shadow/light computation entirely
- Use toneMapped: false for neon elements to preserve brightness regardless of scene exposure
- Most effective for static geometry - requires rebaking if positions change
- Quality comes from asset pipeline (Blender) not runtime code
- CRITICAL for many small light sources - baking eliminates per-light render cost

---

## 2. Offline baked lightmaps for shadows on ground plane

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Offline baked lightmaps for shadows on ground plane

**How it applies**: Pre-bake the light spill from internal point lights through frosted glass onto the dark ground plane. Creates soft shadows emanating from glowing primitives without any real-time shadow computation.

**Code snippet**:
```javascript
const groundMaterial = new THREE.MeshBasicMaterial({
  map: bakedGroundAlbedo,
  lightMap: bakedLightMap,
  lightMapIntensity: 1.0
});
```

**Gotchas/tips**:
- All work done in 3D modeling app (Blender) - invest in pipeline
- Re-baking needed if object positions change
- Normal map baking recommended for lightweight, fast-loading assets
- Combine with SSAO for additional soft contact shadows

---

## 3. HDRI environment lighting without real-time sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: HDRI environment lighting without real-time sources

**How it applies**: For dark TRON scenes, use a subtle/dark HDRI as scene.environment to provide minimal ambient fill so non-illuminated areas aren't pure black, while maintaining dark moody aesthetic.

**Code snippet**:
```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromEquirectangular(darkHDRI).texture;
scene.environment = envMap;
// scene.background = null; // or very dark color for TRON aesthetic
```

**Gotchas/tips**:
- HDRI alone won't cast shadows - combine with baked lightmaps
- No real-time shadow computation needed when using HDRI-only
- Keep HDRI very dark/subtle to avoid washing out neon glows
- Bypasses real-time lights entirely for performance

---

## 4. Bloom for selective neon glow effects

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bloom for selective neon glow effects

**How it applies**: Apply bloom post-processing to create TRON-like neon glow on emissive objects. Use threshold parameter to control selective glow - only brightest materials bloom.

**Code snippet**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold - controls which bright objects bloom
);
composer.addPass(bloomPass);
```

**Gotchas/tips**:
- Apply bloom ONLY when viewport stabilizes for performance - not every frame
- Threshold parameter controls selective bloom (key for TRON aesthetic)
- Multiple bloom implementations available (UnrealBloomPass most common)
- MORE PERFORMANT than actual light sources for many glowing objects
- Combine with toneMapped: false materials for consistent bright output

---

## 5. Screen-space ambient occlusion for soft contact shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Screen-space ambient occlusion for soft contact shadows

**How it applies**: Add subtle soft shadows where frosted glass objects meet dark ground plane. Screen-space technique doesn't require actual light sources - works perfectly in dark scenes for atmospheric depth.

**Code snippet**:
```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
// or GTAO for higher quality:
// import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

**Gotchas/tips**:
- Screen-space technique - doesn't require actual light sources
- GTAO is higher quality but more expensive than SSAO
- Has performance cost - apply judiciously for many objects
- Perfect for soft atmospheric shadows in dark scenes

---

## 6. Apply expensive post-processing only when viewport stabilizes

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Apply expensive post-processing only when viewport stabilizes

**How it applies**: Critical optimization for many light sources with bloom. Apply DOF, bloom, AA only when camera stops moving - user won't notice missing effects during movement.

**Code snippet**:
```javascript
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let isStable = false;
let stabilityTimeout = null;

function checkStability() {
  const positionChanged = !camera.position.equals(lastCameraPosition);
  const rotationChanged = !camera.rotation.equals(lastCameraRotation);
  
  if (positionChanged || rotationChanged) {
    isStable = false;
    clearTimeout(stabilityTimeout);
    stabilityTimeout = setTimeout(() => { isStable = true; }, 500);
  }
  
  lastCameraPosition.copy(camera.position);
  lastCameraRotation.copy(camera.rotation);
}

// In render loop
function animate() {
  checkStability();
  
  if (isStable) {
    composer.render(); // Full post-processing
  } else {
    renderer.render(scene, camera); // Basic render only
  }
  
  requestAnimationFrame(animate);
}
```

**Gotchas/tips**:
- SIGNIFICANT performance savings for expensive bloom/DOF
- Critical for mobile/VR performance targets
- User won't notice missing bloom during rapid camera movement
- Essential when many objects require post-processing

---

## 7. Minimize transparent and reflective surfaces for performance

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Minimize transparent and reflective surfaces for performance

**How it applies**: Frosted glass requires transparency but it's expensive. Consider faking frosted appearance with baked textures instead of real-time transmission. Use transparency strategically on key objects only.

**Code snippet**:
```javascript
// Option A: Real transparency (EXPENSIVE - use sparingly)
const frostedGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  roughness: 0.5,
  thickness: 0.5,
  transparent: true
});

// Option B: Faked with baked texture (CHEAPER - recommended)
const frostedGlass = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,    // Pre-rendered frosted appearance
  transparent: false,          // No runtime transparency cost
  emissiveMap: internalGlowMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Transparent surfaces are EXPENSIVE - minimize for VR/mobile
- MeshPhysicalMaterial transmission is particularly expensive
- Consider baking frosted appearance instead of real-time transmission
- Reduces draw calls and overdraw significantly

---

## 8. Cap texture resolution at 2048px for device compatibility

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Cap texture resolution at 2048px for device compatibility

**How it applies**: When baking lightmaps for many small light-emitting objects, manage texture memory carefully. WebGL shader limits drop to 2048px on many devices. Use texture atlases.

**Code snippet**:
```javascript
// Ensure baked textures don't exceed 2048px for broad compatibility
const maxTextureSize = 2048;

// Use texture atlases for many small objects
// Combine multiple lightmaps into single atlas to reduce draw calls
```

**Gotchas/tips**:
- Max 4092px on some devices, DROPS TO 2048px on many
- 'All memory left is being used to store/display largest textures and meshes'
- CRITICAL when many emissive objects with individual lightmaps
- Texture atlases reduce draw calls for many small objects

---

## 9. Disable tone mapping for consistent neon brightness

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Disable tone mapping for consistent neon brightness

**How it applies**: For TRON neon elements, use toneMapped: false so they always appear at full brightness regardless of scene exposure settings. Creates consistent bright glow even in very dark scenes.

**Code snippet**:
```javascript
// Neon glow material - always full brightness
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,        // Cyan TRON color
  emissive: 0x00ffff,
  emissiveIntensity: 1.0,
  toneMapped: false       // Bypass scene tone mapping
});

// For internal point light simulation
const internalGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: new THREE.Color(0x00ffff),
  toneMapped: false
});
```

**Gotchas/tips**:
- Prevents neon elements from being dimmed by tone mapping
- Creates CONSISTENT bright appearance even in very dark scenes
- Combine with bloom for enhanced TRON glow effect
- Essential for orthographic camera dark scenes

---

## 10. Prefer WebGL over WebGPU for broad device support

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Prefer WebGL over WebGPU for broad device support

**How it applies**: For TRON scene with many light sources needing broad compatibility, stick with WebGL. WebGPU not viable for production if you need customers and devices to run with default settings.

**Code snippet**:
```javascript
// Use WebGLRenderer, NOT WebGPURenderer
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
```

**Gotchas/tips**:
- 'WebGPU is not an option if you plan to allow any customers and devices'
- WebGPU adoption still limited in production environments
- WebGL has MUCH BROADER browser/device support
- Critical for reaching wide audience

---

## 11. Progressive shadow rendering as real-time alternative

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Progressive shadow rendering as real-time alternative

**How it applies**: If baking isn't feasible (dynamic object positions), progressive shadow rendering provides soft shadows. More expensive but allows for dynamic scenes where frosted glass objects move.

**Code snippet**:
```javascript
// Progressive shadow maps for dynamic scenes
// (implementation depends on Three.js version and requirements)
// Consider for dynamic object positions where baking isn't possible
```

**Gotchas/tips**:
- More expensive than baked approach
- Useful when geometry changes dynamically
- Combine with SSAO for soft shadows
- Not recommended if you can bake instead

---

## 12. GLB/GLTF export from DCC tools for baked assets

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: GLB/GLTF export from DCC tools for baked assets

**How it applies**: Export frosted glass primitives and scene geometry as GLB/GLTF from Blender. All quality work happens in 3D modeling app - Three.js just displays the baked result.

**Code snippet**:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('tron-scene-baked.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**Gotchas/tips**:
- 'All the work is mostly done outside three, on your 3D modeling app'
- INVEST in Blender baking workflow - this is where quality comes from
- Normal map baking for lightweight assets
- Export furniture and geometry as GLB/GLTF

---

## Implementation Summary for TRON-like Dark Scene

### Core Strategy: BAKE EVERYTHING
The document is emphatic: **"Most of the quality comes from offline work, not Three.js code"**

1. **Bake all internal point light emanation** into emissive maps
2. **Bake shadows onto ground plane** into lightmaps
3. **Use unlit/emissive materials** in Three.js (eliminate real-time lights)
4. **Invest in Blender baking pipeline** - this is where quality comes from

### Recommended Post-Processing Stack
```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 1. SSAO for soft contact shadows
composer.addPass(new SSAOPass(scene, camera, width, height));

// 2. Bloom for neon glow (use threshold for selective glow)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.5, 0.4, 0.85
);
composer.addPass(bloomPass);
```

### Performance-Critical Optimizations

| Optimization | Why It Matters |
|--------------|----------------|
| Bake all lighting | Eliminates real-time light/shadow cost entirely |
| toneMapped: false | Consistent neon brightness in dark scenes |
| Apply bloom on stabilize | Don't run expensive effects every frame |
| Cap textures at 2048px | Broad device compatibility |
| Minimize transparency | Reduces draw calls and overdraw |
| Fake frosted glass | Avoid expensive MeshPhysicalMaterial transmission |
| Use WebGL not WebGPU | Broad customer/device support |

### Material Template for Frosted Glass with Internal Light
```javascript
// Faked frosted glass with internal glow (RECOMMENDED)
const frostedGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,      // Pre-baked frosted appearance
  emissiveMap: bakedGlowMap,     // Pre-baked internal light emanation
  emissive: new THREE.Color(0x00ffff),  // TRON cyan
  toneMapped: false              // Always bright
});
```

### What NOT To Do
- ❌ Don't use real-time point lights inside each primitive
- ❌ Don't use MeshPhysicalMaterial transmission for many frosted objects
- ❌ Don't apply bloom every frame during camera movement
- ❌ Don't exceed 2048px texture resolution
- ❌ Don't rely on WebGPU for production
# Three.js Lighting Techniques for Dark TRON-like Scene Aesthetic

## Target Scene Requirements
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

## 1. Baked emissive materials for light sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Baked emissive materials for light sources

**How it applies**: For frosted glass primitives with internal point lights, bake the light emanation pattern into emissiveMap. This creates the illusion of light glowing from within glass objects onto surrounding surfaces without real-time point light cost - essential for TRON aesthetic.

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Eliminates real-time shadow/light computation entirely
- Use toneMapped: false for neon elements to preserve brightness regardless of scene exposure
- Most effective for static geometry - requires rebaking if positions change
- Quality comes from asset pipeline (Blender) not runtime code
- CRITICAL for many small light sources - baking eliminates per-light render cost

---

## 2. Offline baked lightmaps for shadows on ground plane

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Offline baked lightmaps for shadows on ground plane

**How it applies**: Pre-bake the light spill from internal point lights through frosted glass onto the dark ground plane. Creates soft shadows emanating from glowing primitives without any real-time shadow computation.

**Code snippet**:
```javascript
const groundMaterial = new THREE.MeshBasicMaterial({
  map: bakedGroundAlbedo,
  lightMap: bakedLightMap,
  lightMapIntensity: 1.0
});
```

**Gotchas/tips**:
- All work done in 3D modeling app (Blender) - invest in pipeline
- Re-baking needed if object positions change
- Normal map baking recommended for lightweight, fast-loading assets
- Combine with SSAO for additional soft contact shadows

---

## 3. HDRI environment lighting without real-time sources

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: HDRI environment lighting without real-time sources

**How it applies**: For dark TRON scenes, use a subtle/dark HDRI as scene.environment to provide minimal ambient fill so non-illuminated areas aren't pure black, while maintaining dark moody aesthetic.

**Code snippet**:
```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromEquirectangular(darkHDRI).texture;
scene.environment = envMap;
// scene.background = null; // or very dark color for TRON aesthetic
```

**Gotchas/tips**:
- HDRI alone won't cast shadows - combine with baked lightmaps
- No real-time shadow computation needed when using HDRI-only
- Keep HDRI very dark/subtle to avoid washing out neon glows
- Bypasses real-time lights entirely for performance

---

## 4. Bloom for selective neon glow effects

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bloom for selective neon glow effects

**How it applies**: Apply bloom post-processing to create TRON-like neon glow on emissive objects. Use threshold parameter to control selective glow - only brightest materials bloom.

**Code snippet**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold - controls which bright objects bloom
);
composer.addPass(bloomPass);
```

**Gotchas/tips**:
- Apply bloom ONLY when viewport stabilizes for performance - not every frame
- Threshold parameter controls selective bloom (key for TRON aesthetic)
- Multiple bloom implementations available (UnrealBloomPass most common)
- MORE PERFORMANT than actual light sources for many glowing objects
- Combine with toneMapped: false materials for consistent bright output

---

## 5. Screen-space ambient occlusion for soft contact shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Screen-space ambient occlusion for soft contact shadows

**How it applies**: Add subtle soft shadows where frosted glass objects meet dark ground plane. Screen-space technique doesn't require actual light sources - works perfectly in dark scenes for atmospheric depth.

**Code snippet**:
```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
// or GTAO for higher quality:
// import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

**Gotchas/tips**:
- Screen-space technique - doesn't require actual light sources
- GTAO is higher quality but more expensive than SSAO
- Has performance cost - apply judiciously for many objects
- Perfect for soft atmospheric shadows in dark scenes

---

## 6. Apply expensive post-processing only when viewport stabilizes

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Apply expensive post-processing only when viewport stabilizes

**How it applies**: Critical optimization for many light sources with bloom. Apply DOF, bloom, AA only when camera stops moving - user won't notice missing effects during movement.

**Code snippet**:
```javascript
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let isStable = false;
let stabilityTimeout = null;

function checkStability() {
  const positionChanged = !camera.position.equals(lastCameraPosition);
  const rotationChanged = !camera.rotation.equals(lastCameraRotation);
  
  if (positionChanged || rotationChanged) {
    isStable = false;
    clearTimeout(stabilityTimeout);
    stabilityTimeout = setTimeout(() => { isStable = true; }, 500);
  }
  
  lastCameraPosition.copy(camera.position);
  lastCameraRotation.copy(camera.rotation);
}

// In render loop
function animate() {
  checkStability();
  
  if (isStable) {
    composer.render(); // Full post-processing
  } else {
    renderer.render(scene, camera); // Basic render only
  }
  
  requestAnimationFrame(animate);
}
```

**Gotchas/tips**:
- SIGNIFICANT performance savings for expensive bloom/DOF
- Critical for mobile/VR performance targets
- User won't notice missing bloom during rapid camera movement
- Essential when many objects require post-processing

---

## 7. Minimize transparent and reflective surfaces for performance

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Minimize transparent and reflective surfaces for performance

**How it applies**: Frosted glass requires transparency but it's expensive. Consider faking frosted appearance with baked textures instead of real-time transmission. Use transparency strategically on key objects only.

**Code snippet**:
```javascript
// Option A: Real transparency (EXPENSIVE - use sparingly)
const frostedGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  roughness: 0.5,
  thickness: 0.5,
  transparent: true
});

// Option B: Faked with baked texture (CHEAPER - recommended)
const frostedGlass = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,    // Pre-rendered frosted appearance
  transparent: false,          // No runtime transparency cost
  emissiveMap: internalGlowMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Transparent surfaces are EXPENSIVE - minimize for VR/mobile
- MeshPhysicalMaterial transmission is particularly expensive
- Consider baking frosted appearance instead of real-time transmission
- Reduces draw calls and overdraw significantly

---

## 8. Cap texture resolution at 2048px for device compatibility

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Cap texture resolution at 2048px for device compatibility

**How it applies**: When baking lightmaps for many small light-emitting objects, manage texture memory carefully. WebGL shader limits drop to 2048px on many devices. Use texture atlases.

**Code snippet**:
```javascript
// Ensure baked textures don't exceed 2048px for broad compatibility
const maxTextureSize = 2048;

// Use texture atlases for many small objects
// Combine multiple lightmaps into single atlas to reduce draw calls
```

**Gotchas/tips**:
- Max 4092px on some devices, DROPS TO 2048px on many
- 'All memory left is being used to store/display largest textures and meshes'
- CRITICAL when many emissive objects with individual lightmaps
- Texture atlases reduce draw calls for many small objects

---

## 9. Disable tone mapping for consistent neon brightness

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Disable tone mapping for consistent neon brightness

**How it applies**: For TRON neon elements, use toneMapped: false so they always appear at full brightness regardless of scene exposure settings. Creates consistent bright glow even in very dark scenes.

**Code snippet**:
```javascript
// Neon glow material - always full brightness
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,        // Cyan TRON color
  emissive: 0x00ffff,
  emissiveIntensity: 1.0,
  toneMapped: false       // Bypass scene tone mapping
});

// For internal point light simulation
const internalGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: new THREE.Color(0x00ffff),
  toneMapped: false
});
```

**Gotchas/tips**:
- Prevents neon elements from being dimmed by tone mapping
- Creates CONSISTENT bright appearance even in very dark scenes
- Combine with bloom for enhanced TRON glow effect
- Essential for orthographic camera dark scenes

---

## 10. Prefer WebGL over WebGPU for broad device support

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Prefer WebGL over WebGPU for broad device support

**How it applies**: For TRON scene with many light sources needing broad compatibility, stick with WebGL. WebGPU not viable for production if you need customers and devices to run with default settings.

**Code snippet**:
```javascript
// Use WebGLRenderer, NOT WebGPURenderer
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
```

**Gotchas/tips**:
- 'WebGPU is not an option if you plan to allow any customers and devices'
- WebGPU adoption still limited in production environments
- WebGL has MUCH BROADER browser/device support
- Critical for reaching wide audience

---

## 11. Progressive shadow rendering as real-time alternative

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Progressive shadow rendering as real-time alternative

**How it applies**: If baking isn't feasible (dynamic object positions), progressive shadow rendering provides soft shadows. More expensive but allows for dynamic scenes where frosted glass objects move.

**Code snippet**:
```javascript
// Progressive shadow maps for dynamic scenes
// (implementation depends on Three.js version and requirements)
// Consider for dynamic object positions where baking isn't possible
```

**Gotchas/tips**:
- More expensive than baked approach
- Useful when geometry changes dynamically
- Combine with SSAO for soft shadows
- Not recommended if you can bake instead

---

## 12. GLB/GLTF export from DCC tools for baked assets

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: GLB/GLTF export from DCC tools for baked assets

**How it applies**: Export frosted glass primitives and scene geometry as GLB/GLTF from Blender. All quality work happens in 3D modeling app - Three.js just displays the baked result.

**Code snippet**:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('tron-scene-baked.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**Gotchas/tips**:
- 'All the work is mostly done outside three, on your 3D modeling app'
- INVEST in Blender baking workflow - this is where quality comes from
- Normal map baking for lightweight assets
- Export furniture and geometry as GLB/GLTF

---

## Implementation Summary for TRON-like Dark Scene

### Core Strategy: BAKE EVERYTHING
The document is emphatic: **"Most of the quality comes from offline work, not Three.js code"**

1. **Bake all internal point light emanation** into emissive maps
2. **Bake shadows onto ground plane** into lightmaps
3. **Use unlit/emissive materials** in Three.js (eliminate real-time lights)
4. **Invest in Blender baking pipeline** - this is where quality comes from

### Recommended Post-Processing Stack
```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 1. SSAO for soft contact shadows
composer.addPass(new SSAOPass(scene, camera, width, height));

// 2. Bloom for neon glow (use threshold for selective glow)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.5, 0.4, 0.85
);
composer.addPass(bloomPass);
```

### Performance-Critical Optimizations

| Optimization | Why It Matters |
|--------------|----------------|
| Bake all lighting | Eliminates real-time light/shadow cost entirely |
| toneMapped: false | Consistent neon brightness in dark scenes |
| Apply bloom on stabilize | Don't run expensive effects every frame |
| Cap textures at 2048px | Broad device compatibility |
| Minimize transparency | Reduces draw calls and overdraw |
| Fake frosted glass | Avoid expensive MeshPhysicalMaterial transmission |
| Use WebGL not WebGPU | Broad customer/device support |

### Material Template for Frosted Glass with Internal Light
```javascript
// Faked frosted glass with internal glow (RECOMMENDED)
const frostedGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,      // Pre-baked frosted appearance
  emissiveMap: bakedGlowMap,     // Pre-baked internal light emanation
  emissive: new THREE.Color(0x00ffff),  // TRON cyan
  toneMapped: false              // Always bright
});
```

### What NOT To Do
- ❌ Don't use real-time point lights inside each primitive
- ❌ Don't use MeshPhysicalMaterial transmission for many frosted objects
- ❌ Don't apply bloom every frame during camera movement
- ❌ Don't exceed 2048px texture resolution
- ❌ Don't rely on WebGPU for production
# Three.js Lighting Techniques for Dark TRON-like Scene
## Complete Extraction from 5 Documentation Sources

**Target Aesthetic:**
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

# CATEGORY 1: FROSTED GLASS & TRANSLUCENT MATERIALS

---

## 1. MeshPhysicalMaterial with Transmission

**Source**: Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js

**Technique**: PBR material with transmission for realistic glass

**How it applies**: Use MeshPhysicalMaterial with transmission, roughness, and thickness to create frosted glass primitives that scatter light from internal point lights.

**Code snippet**:
```javascript
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.5,        // Higher = more frosted
  transmission: 0.9,     // Glass-like transparency
  thickness: 0.5,        // For volumetric effect
  transparent: true
});
```

**Gotchas/tips**:
- MeshPhysicalMaterial is more expensive than MeshStandardMaterial
- `transmission` requires `transparent: true`
- `roughness` controls frost level — higher = more diffuse glow
- For many objects, consider baking instead

---

## 2. Faked Frosted Glass with Baked Textures (CHEAPER - RECOMMENDED)

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Fake frosted appearance with pre-baked textures instead of real-time transmission

**How it applies**: For performance with many frosted glass primitives, bake the frosted appearance into textures. Combine with emissive maps for internal glow.

**Code snippet**:
```javascript
// Option A: Real transparency (EXPENSIVE - use sparingly)
const frostedGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  roughness: 0.5,
  thickness: 0.5,
  transparent: true
});

// Option B: Faked with baked texture (CHEAPER - recommended)
const frostedGlass = new THREE.MeshBasicMaterial({
  map: bakedFrostedTexture,    // Pre-rendered frosted appearance
  transparent: false,          // No runtime transparency cost
  emissiveMap: internalGlowMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Transparent surfaces are EXPENSIVE — minimize for VR/mobile
- MeshPhysicalMaterial transmission is particularly expensive
- Reduces draw calls and overdraw significantly
- Best for static objects

---

## 3. Beer's Law Light Attenuation Through Glass

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Exponential light absorption modeling for participating media

**How it applies**: Model light passing through frosted glass with exponential falloff. Creates soft glow emanating from glass objects.

**Code snippet**:
```glsl
// Beer's Law: I = I₀ × e^(-density × distance)
float transmittance = exp(-density * distance);

// Full volumetric accumulation:
float transmittance = 5.0;  // Start >1.0 for brighter result
vec3 accumulatedLight = vec3(0.0);

for (int i = 0; i < NUM_STEPS; i++) {
  float attenuation = exp(-0.3 * distanceToLight);
  vec3 luminance = lightColor * LIGHT_INTENSITY * attenuation;
  
  float stepDensity = FOG_DENSITY * shapeFactor;
  float stepTransmittance = exp(-stepDensity * STEP_SIZE);
  transmittance *= stepTransmittance;
  accumulatedLight += luminance * transmittance * stepDensity * STEP_SIZE;
  t += STEP_SIZE;
}
```

**Gotchas/tips**:
- Start transmittance >1.0 to avoid dark results
- FOG_DENSITY 0.3-0.5 gives good frosted glass effect
- Higher density = more diffuse, milkier glass

---

## 4. Henyey-Greenstein Phase Function

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Control directionality of light scattering through media

**How it applies**: Frosted glass scatters light directionally. g ≈ 0.3-0.5 gives realistic forward scattering for TRON aesthetic.

**Code snippet**:
```glsl
float HGPhase(float mu, float g) {
  float gg = g * g;
  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);
  return (1.0 - gg) / pow(denom, 1.5);
}

// Usage:
float mu = dot(rayDir, -lightDir);
float scatterPhase = HGPhase(mu, 0.5);  // Forward scattering
```

**Gotchas/tips**:
- g = 0.3-0.5 for frosted glass
- Higher g = more focused beam
- Negative g creates rim-lighting effects

---

# CATEGORY 2: INTERNAL POINT LIGHTS

---

## 5. Point Light Inside Translucent Mesh

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Embed point light at center of mesh for light-from-within effect

**How it applies**: CORE TECHNIQUE for frosted glass primitives. Place point light at center of each translucent mesh.

**Code snippet**:
```javascript
const GlowingSphere = () => (
  <group position={[0, 4.5, 0]}>
    <Sphere args={[2, 32, 32]} material={frostedMaterial} />
    <pointLight 
      position={[0, 0, 0]}  // Center of mesh
      intensity={2.5} 
      color="#00ffff"       // TRON cyan
      distance={25}
      decay={0.8}
    />
  </group>
);
```

**Gotchas/tips**:
- Position at [0,0,0] relative to parent for exact center
- `distance` controls light reach
- Lower intensity for internal vs external lights

---

## 6. Dynamic Pulsing Lights

**Source**: Creating an Immersive 3D Weather Visualization with React Three Fiber

**Technique**: Animate light intensity for pulsing effects

**How it applies**: Create pulsing lights for TRON-like animated neon effects.

**Code snippet**:
```javascript
// Smooth TRON-style pulsing
useFrame((state) => {
  if (lightRef.current) {
    lightRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 1.0;
  }
});

// Random flash with cooldown
const lightningActive = useRef(false);
useFrame(() => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    lightRef.current.intensity = 90;
    setTimeout(() => {
      lightRef.current.intensity = 0;
      lightningActive.current = false;
    }, 400);
  }
});
```

**Gotchas/tips**:
- **Never create `new Object3D()` in animation loop** — use useRef
- Ref-based cooldown prevents overlapping flash cycles

---

## 7. Colored PointLights for Neon Aesthetic

**Source**: Multiple docs

**Technique**: Use neon colors (cyan, magenta, electric blue)

**Code snippet**:
```javascript
const tronLight = new THREE.PointLight(0x00ffff, 0.8);  // Cyan
const coolLight = new THREE.PointLight(0x6688ff, 1.0);  // Blue
const magentaLight = new THREE.PointLight(0xff00ff, 0.6, 50);
```

**Gotchas/tips**:
- Balance cool with occasional warm accent
- Combine with fog of similar color

---

## 8. RectAreaLight for Panel Glow

**Source**: Mastering Three.js Lighting

**Technique**: Rectangular emitter for geometric light panels

**Code snippet**:
```javascript
const rectLight = new THREE.RectAreaLight(0x00ffff, 1.0, 2, 2);
rectLight.position.set(0, 1, -2);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

**Gotchas/tips**:
- Requires RectAreaLightUniformsLib import
- Does not cast shadows by default

---

# CATEGORY 3: SHADOWS FOR INTERNAL LIGHTS

---

## 9. Cube Camera for Omnidirectional Shadows

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: CubeCamera captures 360° shadow information for point lights

**How it applies**: ESSENTIAL for internal point lights that emit in all directions.

**Code snippet**:
```javascript
const shadowCubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: false,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});

const shadowCubeCamera = new THREE.CubeCamera(0.1, 100, shadowCubeRenderTarget);
shadowCubeCamera.position.copy(internalLightPosition);
```

**Gotchas/tips**:
- **MAJOR COST**: 6x scene renders per frame per light
- Only enable shadows for key lights
- Use lower resolution for distant lights (256-512)
- Update only when objects move

---

## 10. Custom Shadow Material for Cube Depth

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Custom shader outputting normalized distance for cube shadow maps

**Code snippet**:
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
    uniform float shadowFar;
    varying vec3 vWorldPosition;
    void main() {
      float distance = length(vWorldPosition);
      float normalizedDistance = clamp(distance / shadowFar, 0.0, 1.0);
      gl_FragColor = vec4(normalizedDistance, 0.0, 0.0, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  uniforms: { shadowFar: { value: 100 } }
});

// Render:
scene.overrideMaterial = shadowMaterial;
shadowCubeCamera.update(renderer, scene);
scene.overrideMaterial = null;  // MUST restore
```

---

## 11. Shadow Map for Directional/Spot Lights

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Virtual camera at light source for shadow map (1 render vs 6 for cube)

**How it applies**: If internal lights are directional (neon tube), use perspective shadow mapping - MUCH more performant.

**Code snippet**:
```javascript
const lightCamera = new THREE.PerspectiveCamera(90, 1.0, 0.1, 100);
const shadowFBO = new THREE.WebGLRenderTarget(512, 512, {
  depth: true,
  depthTexture: new THREE.DepthTexture(512, 512, THREE.FloatType),
});

lightCamera.position.copy(lightPosition);
lightCamera.lookAt(lightTarget);
renderer.setRenderTarget(shadowFBO);
renderer.render(scene, lightCamera);
renderer.setRenderTarget(null);
```

**Gotchas/tips**:
- FOV should match light cone angle
- Near/far should tightly bound scene
- For static objects, render once and reuse

---

# CATEGORY 4: BLOOM & SELECTIVE GLOW

---

## 12. UnrealBloomPass for Neon Glow

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bloom post-processing for TRON-like neon glow

**How it applies**: Apply bloom to emissive objects. Use threshold parameter for selective glow - only brightest materials bloom.

**Code snippet**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold - controls which objects bloom
);
composer.addPass(bloomPass);
```

**Gotchas/tips**:
- Threshold controls selective bloom (key for TRON aesthetic)
- MORE PERFORMANT than actual light sources for many glowing objects
- Combine with `toneMapped: false` for consistent bright output

---

## 13. toneMapped: false for Consistent Brightness

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bypass tone mapping for neon elements

**How it applies**: For TRON neon elements, use `toneMapped: false` so they always appear at full brightness regardless of scene exposure.

**Code snippet**:
```javascript
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,        // Cyan
  emissive: 0x00ffff,
  emissiveIntensity: 1.0,
  toneMapped: false       // Bypass scene tone mapping
});

const internalGlowMaterial = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: new THREE.Color(0x00ffff),
  toneMapped: false
});
```

**Gotchas/tips**:
- Prevents neon elements from being dimmed by tone mapping
- Creates CONSISTENT bright appearance even in very dark scenes
- Essential for orthographic camera dark scenes

---

## 14. Baked Emissive Materials

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Bake light emanation pattern into emissiveMap

**How it applies**: Creates illusion of light glowing from within glass objects onto surrounding surfaces without real-time point light cost.

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/tips**:
- Eliminates real-time shadow/light computation entirely
- CRITICAL for many small light sources - baking eliminates per-light cost
- Quality comes from asset pipeline (Blender)

---

# CATEGORY 5: DARK SCENE ATMOSPHERE

---

## 15. Low-Intensity Ambient Light

**Source**: Mastering Three.js Lighting; Enlightening 3D Worlds

**Technique**: Very low ambient (0.1 or less) for dark scenes

**How it applies**: Prevents pure black while maintaining dark TRON atmosphere.

**Code snippet**:
```javascript
// For dark moody scene
const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.1);
// Or cool blue tint:
const ambientLight = new THREE.AmbientLight(0x111122, 0.1);
scene.add(ambientLight);
```

**Gotchas/tips**:
- AmbientLight is "cheap" — minimal performance cost
- No shadows
- Use cool blue/purple tint for TRON aesthetic

---

## 16. HemisphereLight for Ground/Sky Gradient

**Source**: Mastering Three.js Lighting

**Technique**: Sky-to-ground gradient for natural ambient

**How it applies**: For dark ground plane: set ground color to dark blue/black, sky to subtle dark blue.

**Code snippet**:
```javascript
const hemiLight = new THREE.HemisphereLight(0x004466, 0x000011, 0.3);
scene.add(hemiLight);
// Parameters: skyColor, groundColor, intensity
```

**Gotchas/tips**:
- Cheap for base illumination
- No shadows
- Use very low intensity for dark scenes

---

## 17. Dark HDRI Environment

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Subtle/dark HDRI as scene.environment for minimal ambient fill

**Code snippet**:
```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromEquirectangular(darkHDRI).texture;
scene.environment = envMap;
// scene.background = null; // or very dark color
```

**Gotchas/tips**:
- HDRI alone won't cast shadows
- Keep HDRI very dark to avoid washing out neon glows
- Bypasses real-time lights for performance

---

## 18. Fog for Atmospheric Depth

**Source**: Multiple docs

**Technique**: Subtle fog for depth

**How it applies**: Creates atmospheric depth in dark scenes. Use similar color to ambient.

**Code snippet**:
```javascript
scene.fog = new THREE.Fog(0x000011, 10, 50);
// Or exponential:
scene.fog = new THREE.FogExp2(0x000011, 0.05);
```

---

# CATEGORY 6: PERFORMANCE OPTIMIZATIONS

---

## 19. Instanced Rendering for Many Primitives

**Source**: Creating an Immersive 3D Weather Visualization

**Technique**: InstancedMesh for thousands of objects in single draw call

**How it applies**: For many frosted glass primitives, dramatically reduces draw calls.

**Code snippet**:
```javascript
const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    particles.forEach((particle, i) => {
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#00ffff" />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- **Always set `instanceMatrix.needsUpdate = true`**
- **Never create `new Object3D()` in animation loop** — use useMemo
- 1000 particles → 1 draw call
- Each instance shares geometry/material

---

## 20. Blue Noise Dithering (CRITICAL for Many Lights)

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Randomize ray start positions to reduce banding, allowing ~5x fewer raymarching steps

**How it applies**: Allows 50 steps instead of 200-250 while maintaining quality. Essential for volumetric effects with multiple frosted glass objects.

**Code snippet**:
```glsl
uniform sampler2D blueNoiseTexture;
uniform int frame;

float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame % 32) / sqrt(0.5));
float t = STEP_SIZE * offset;

const int NUM_STEPS = 50;   // Instead of 200-250
```

**Gotchas/tips**:
- `frame % 32` prevents float precision loss
- Works best with temporal anti-aliasing (TAA)
- Download blue noise from momentsingraphics.de

---

## 21. Post-Processing Only When Stable

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Apply expensive effects only when camera stops moving

**Code snippet**:
```javascript
let lastCameraPosition = new THREE.Vector3();
let isStable = false;
let stabilityTimeout = null;

function checkStability() {
  if (!camera.position.equals(lastCameraPosition)) {
    isStable = false;
    clearTimeout(stabilityTimeout);
    stabilityTimeout = setTimeout(() => { isStable = true; }, 500);
  }
  lastCameraPosition.copy(camera.position);
}

function animate() {
  checkStability();
  if (isStable) {
    composer.render(); // Full post-processing
  } else {
    renderer.render(scene, camera); // Basic only
  }
}
```

**Gotchas/tips**:
- SIGNIFICANT savings for expensive bloom/DOF
- Critical for mobile/VR
- User won't notice missing bloom during movement

---

## 22. Texture Resolution Cap at 2048px

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Cap textures at 2048px for broad device compatibility

**Gotchas/tips**:
- Max 4096px on some devices, DROPS TO 2048px on many
- Use texture atlases for many small objects
- Critical when many emissive objects with individual lightmaps

---

## 23. Baked Lightmaps for Ground Shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Pre-bake light spill onto ground plane

**Code snippet**:
```javascript
const groundMaterial = new THREE.MeshBasicMaterial({
  map: bakedGroundAlbedo,
  lightMap: bakedLightMap,
  lightMapIntensity: 1.0
});
```

**Gotchas/tips**:
- All work done in Blender - invest in pipeline
- Combine with SSAO for additional soft contact shadows

---

## 24. SSAO for Soft Contact Shadows

**Source**: Achieving Realistic Ambience in Architectural Three.js Scenes

**Technique**: Screen-space ambient occlusion for soft shadows without light sources

**Code snippet**:
```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
// or GTAO for higher quality

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

**Gotchas/tips**:
- Screen-space - doesn't require actual light sources
- GTAO is higher quality but more expensive
- Perfect for soft atmospheric shadows in dark scenes

---

# CATEGORY 7: SDF-BASED LIGHT SHAPING

---

## 25. SDF for Light Volume Shaping

**Source**: On Shaping Light: Real-Time Volumetric Lighting

**Technique**: Use signed distance functions to define volumetric light regions

**How it applies**: Shape light emanating from frosted glass to match geometric form. Use cylinder SDFs for tubes, sphere for rounded glass, box for rectangular blocks.

**Code snippet**:
```glsl
// Sphere SDF
float sdSphere(vec3 p, vec3 center, float radius) {
  return length(p - center) - radius;
}

// Box SDF
float sdBox(vec3 p, vec3 center, vec3 halfSize) {
  vec3 q = abs(p - center) - halfSize;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Apply with soft edges:
float sdfVal = sdSphere(samplePos, objectCenter, objectRadius);
float shapeFactor = smoothstep(0.0, -0.1, sdfVal);
fogAmount += attenuation * lightIntensity * shapeFactor;
```

**Gotchas/tips**:
- smoothstep creates soft falloff
- Use slightly larger SDF radius than mesh for soft glow extending beyond surface
- See Inigo Quilez's SDF dictionary for more primitives

---

# COMPLETE IMPLEMENTATION TEMPLATE

```javascript
// === RENDERER ===
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.shadowMap.enabled = true;

// === SCENE ===
scene.background = new THREE.Color(0x000005);  // Near black
scene.fog = new THREE.Fog(0x000011, 10, 50);

// === BASE LIGHTING (very low) ===
const ambient = new THREE.AmbientLight(0x050510, 0.1);
const hemi = new THREE.HemisphereLight(0x001122, 0x000005, 0.2);
scene.add(ambient, hemi);

// === GLOWING PRIMITIVE ===
function createGlowingPrimitive(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);
  
  // Frosted glass mesh
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.5,
    transmission: 0.9,
    thickness: 0.5,
    transparent: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;  // Performance
  group.add(mesh);
  
  // Internal light
  const light = new THREE.PointLight(color, 2.0, 15);
  light.castShadow = false;  // Performance - use baked shadows instead
  group.add(light);
  
  return group;
}

// === POST-PROCESSING ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5, 0.4, 0.85  // strength, radius, threshold
);
composer.addPass(bloomPass);

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);

// === RENDER LOOP ===
function animate() {
  if (isStable) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}
```

---

# KEY PERFORMANCE GUIDELINES

| Technique | Performance Impact |
|-----------|-------------------|
| Baked emissive materials | ✅ Eliminates per-light cost |
| Fake frosted glass (baked) | ✅ Much cheaper than transmission |
| PointLight (no shadows) | ⚠️ Moderate per-light cost |
| PointLight (with shadows) | ❌ 6x render passes per light |
| InstancedMesh | ✅ 1000 objects → 1 draw call |
| Bloom post-processing | ⚠️ Apply when stable only |
| Blue noise dithering | ✅ 5x fewer raymarching steps |
| SSAO | ⚠️ Moderate cost |
| MeshPhysicalMaterial | ⚠️ More expensive than Basic |
| toneMapped: false | ✅ No cost |

---

# WHAT NOT TO DO

- ❌ Don't use real-time point lights with shadows for each small primitive
- ❌ Don't use MeshPhysicalMaterial transmission for many frosted objects (use baked)
- ❌ Don't apply bloom every frame during camera movement
- ❌ Don't exceed 2048px texture resolution
- ❌ Don't use WebGPU for production (limited support)
- ❌ Don't create `new Object3D()` in animation loops (GC pressure)
- ❌ Don't forget `instanceMatrix.needsUpdate = true` for instanced meshes# Relevant Techniques Extracted

## Source
Three.js Volumetric Lighting / Fog Implementation Tips (Section 3: Practical Tips & Gotchas)

---

### TRAA Halton Sequence Synchronization

**How it applies:** Performance optimization for scenes with many light sources. Ensures temporal anti-aliasing converges correctly rather than producing artifacts.

**Code snippet:**
```javascript
// 32-element Halton array matches TRAA's 32-sample jitter cycle
```

**Gotchas/tips:** If Halton count doesn't match TRAA's internal cycle, accumulation produces artifacts instead of converging. Critical for multi-pass rendering pipelines.

---

### Volumetric Material Transparency + Additive Blending

**How it applies:** Fog/atmosphere, glow effects, TRON neon aesthetic. Creates light accumulation that brightens fog/volumes where light overlaps — physically motivated for in-scattering.

**Code snippet:**
```javascript
material.transparent = true;
material.blending = THREE.AdditiveBlending;
```

**Gotchas/tips:** Material must be transparent to be excluded from depth pre-pass but included in scene pass. Additive blending makes fog brighten with light accumulation.

---

### DPR (Device Pixel Ratio) Disable for Performance

**How it applies:** Performance optimization for many light sources. Critical when multi-pass pipeline (depth + scene + TRAA) becomes expensive.

**Code snippet:**
```javascript
// renderer.setPixelRatio( window.devicePixelRatio ) // intentionally commented out
```

**Gotchas/tips:** At retina resolutions, multi-pass pipelines become very expensive. Intentionally disabling DPR trades visual sharpness for performance.

---

### Shadow Intensity Below 1.0 for Soft Fill

**How it applies:** Soft shadows, dark scenes. Prevents fully black shadows that look unrealistic in volumetric scenes where ambient scattering provides fill light.

**Code snippet:**
```javascript
light.shadow.intensity = 0.98;
```

**Gotchas/tips:** Using 1.0 creates fully black shadows. In volumetric scenes, ambient scattering would always provide some fill light, so 0.98 is more realistic.

---

### Spotlight Projection Map for Colored Light Cones

**How it applies:** Fog/atmosphere, internal point lights. Creates visually interesting colored volumetric light beams through fog.

**Code snippet:**
```javascript
spotlight.map = new THREE.TextureLoader().load('colors.png');
```

**Gotchas/tips:** A color texture used as spotlight projection map creates colored volumetric light cones — simple way to get visually interesting beams.

---

### Smoke Amount Noise Mix Logic

**How it applies:** Fog/atmosphere variation. Controls uniformity vs. noise contrast in volumetric effects.

**Code snippet:**
```javascript
smokeAmount.mix(1, density)
```

**Gotchas/tips:** When smokeAmount is 0, returns 1 (uniform fog with no noise). When high, noise contrast increases. Opposite of typical lerp — mixes between 'no noise' and 'full noise'.

---

# Extracted Techniques

Relevant to: dark scene, orthographic camera, frosted glass/translucent mesh, internal point lights, selective bloom/glow, soft shadows, fog/atmosphere, TRON neon aesthetic, many light sources performance.

---

## Temporal Reprojection Anti-Aliasing (TRAA) for Volumetrics

**Source:** TRAA for Volumetrics

**Relevant to:** fog/atmosphere, dark scene

**How it applies:** Ray-marched volumes are noisy with few steps causing banding. Jittering the ray-march offset each frame using Halton sequence + Interleaved Gradient Noise, then accumulating over 32 frames via TRAA transforms 12-step banding into smooth, high-quality fog.

**Code snippet:**
```
Halton sequence + Interleaved Gradient Noise
(accumulated over 32 frames)
```

**Gotchas/tips:** No specific gotchas mentioned in this section

---

## Depth Pre-Pass + Scene Pass + TRAA Pass

**Source:** Multi-Pass Architecture

**Relevant to:** many light sources performance

**How it applies:** Separates rendering into distinct passes: depth pre-pass for opaques only, scene pass with MRT for color and velocity, and TRAA pass for temporal blending. Transparent volumetric meshes are automatically excluded from depth pre-pass.

**Code snippet:**
```
| Pass | Purpose |
|------|---------|
| Depth Pre-Pass | Renders only opaques to get depth buffer |
| Scene Pass | Renders everything with MRT (output + velocity) |
| TRAA Pass | Uses color, depth, velocity to reproject and blend |
```

**Gotchas/tips:** Volumetric mesh must be transparent to be excluded from depth pre-pass automatically

---

## Depth-Aware Volumetric Occlusion

**Source:** Depth-Aware Volumetric Occlusion

**Relevant to:** fog/atmosphere

**How it applies:** Pre-pass depth is fed into volumetricMaterial.depthNode so ray marching terminates at opaque surfaces — volumetric fog correctly stops behind solid objects.

**Code snippet:**
```
volumetricMaterial.depthNode
```

**Gotchas/tips:** Requires depth pre-pass to be set up first

---

## Multi-Octave Noise for Density

**Source:** Multi-Octave Noise for Density

**Relevant to:** fog/atmosphere

**How it applies:** Three noise samples at different scales (0.1, 0.05, 0.02) multiplied together. Each moves at a different time scale, creating organic turbulence. The .add(.5) bias keeps values positive before multiplication.

**Code snippet:**
```
Three noise samples at scales 0.1, 0.05, 0.02 multiplied together
.add(.5) bias keeps values positive before multiplication
```

**Gotchas/tips:** The .add(.5) bias is critical to keep values positive before multiplication

---

## Three Shader Language (TSL) Node-Based Shading

**Source:** TSL (Three Shader Language) Pattern

**Relevant to:** fog/atmosphere, many light sources performance

**How it applies:** All shader logic is defined in JavaScript using TSL's node-based API (Fn, vec3, fract, texture3D, etc.) — no raw GLSL/WGSL. This is Three.js's WebGPU-era shader authoring approach.

**Code snippet:**
```
Fn, vec3, fract, texture3D
```

**Gotchas/tips:** This is Three.js's WebGPU-era approach — may not be compatible with WebGL-only setups

---

# Technique Extraction: Dissolve Effect with Shaders and Particles

## Source Document
**Codrops — "Dissolve Effect with Shaders and Particles" (Feb 2025)**

---

## 1. CubeMap vs HDRI for Controlled Bloom

**Source:** Section "1. Environment & Lighting Setup"

**Technique:** Use CubeMaps instead of HDRI for environment lighting when combining with bloom effects.

**How it applies to dark TRON aesthetic:**
- HDRI causes excessive reflections that bloom amplifies uncontrollably → creates unwanted bright spots
- CubeMaps simulate environmental lighting without introducing bright direct light sources
- Perfect for dark scenes where you want selective glow on specific objects (neon edges, internal lights) without blowing out the entire scene
- Use a dark CubeMap to maintain the moody atmosphere while still having ambient reflections on glass surfaces

**Code snippet:** (conceptual - no explicit code provided)
```javascript
// Prefer CubeMap loader over HDRI for bloom-heavy scenes
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([...]);
scene.environment = envMap;
// Use a dark/moody CubeMap to maintain TRON aesthetic
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Bloom control** | HDRI reflections get amplified by bloom; CubeMaps keep it controlled |
| **Mood preservation** | Dark CubeMaps maintain the moody atmosphere needed for neon aesthetics |

---

## 2. Shader Injection into Standard Materials

**Source:** Section "2. Dissolve Effect (Perlin Noise + Shader Injection)"

**Technique:** Hook custom GLSL into Three.js standard materials by replacing `#include <dithering_fragment>`

**How it applies to frosted glass / translucent meshes:**
- Inject custom fragment logic into MeshStandardMaterial or MeshPhysicalMaterial
- Can add glow edges, emission zones, or light emanation logic to glass materials
- Perfect for creating glowing edges on glass primitives that emanate light outward
- Enables per-fragment control over which parts of a glass mesh should glow

**Code snippet:**
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

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Injection point** | Replace at `#include <dithering_fragment>` to hook into standard materials without rewriting them |
| **Preserves PBR** | Standard material lighting/PBR still works; you're just adding to it |

---

## 3. Three-Zone Fragment Logic (Edge Glow Pattern)

**Source:** Section "2. Dissolve Effect (Perlin Noise + Shader Injection)" → "Three-Zone Fragment Logic"

**Technique:** Categorize fragments into zones: discard, edge (colored), and original material.

**How it applies to neon edge glow on glass:**
- Create glowing neon edges on glass primitives (like TRON light cycles)
- Edge zone gets a custom emission color that bloom will pick up
- Original material remains untouched → can have frosted glass center with glowing neon border
- Perlin noise creates organic, natural-looking edge transitions instead of harsh lines

**Code snippet:**
```glsl
// Three-zone logic per fragment:
// 1. Discard zone: noiseValue < uProgress → fragment discarded
// 2. Edge zone: uProgress < noiseValue < uProgress + uEdge → colored with uEdgeColor  
// 3. Original material → untouched

if(noise < uProgress) discard;

float edgeWidth = uProgress + uEdge;
if(noise > uProgress && noise < edgeWidth){
    gl_FragColor = vec4(vec3(uEdgeColor), noise);
}
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **uProgress range** | Must extend slightly beyond noise output range (e.g., beyond `[-1,1]`) to allow full dissolve/reverse |
| **Edge width** | Control `uEdge` uniform to adjust glow border thickness |

---

## 4. Perlin Noise for Organic Transitions

**Source:** Section "2. Dissolve Effect (Perlin Noise + Shader Injection)" → "Noise Fundamentals"

**Technique:** Use Perlin noise with amplitude and frequency controls for natural-looking patterns.

**How it applies to aesthetic:**
- Creates organic, non-regular patterns for glass surface effects
- Can animate noise to create subtle "living" effects on translucent surfaces
- Amplitude controls intensity range, frequency controls pattern intricacy
- Perfect for subtle fog/atmosphere effects or organic light patterns emanating from glass

**Code snippet:**
```glsl
float noise = cnoise(vPos * uFreq) * uAmp;
// Amplitude: scales intensity (noise outputs [-1,1], amp of 10 → [-10,10])
// Frequency: higher = more intricate patterns
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **GLSL `cnoise()`** | Per-pixel noise is acceptable performance-wise, but frequency/amplitude affect GPU workload |
| **Continuous output** | Perlin produces continuous values (unlike random) → natural-looking transitions |

---

## 5. Distance-Based Particle Sizing

**Source:** Section "3. Particle System" → "Vertex shader"

**Technique:** Calculate particle size inversely proportional to camera distance in vertex shader.

**How it applies to light emanating from glass:**
- Particles representing light emanation will size correctly in orthographic camera
- Creates depth perception even in orthographic view
- Particles shrink as they travel from source → simulates light falloff visually

**Code snippet:**
```glsl
// Vertex shader — size inversely proportional to camera distance
void main(){
    vec3 viewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_PointSize = uBaseSize / -viewPosition.z;
}
```

**Additional - Distance-based shrinking:**
```glsl
// Vertex shader with distance-based shrinking
float size = uBaseSize * uPixelDensity;
size = size / (aDist + 1.0);
gl_PointSize = size / -viewPosition.z;
```

```javascript
// Initialize distance array
particleDistArr[i] = 0.001;

// Update each frame
const dist = vec1.distanceTo(vec2);
particleDistArr[i] = dist;
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Orthographic** | Will need adjustment for orthographic camera since `viewPosition.z` behaves differently |
| **Pixel density** | Include `uPixelDensity` uniform for consistent sizing across devices |

---

## 6. Conditional Particle Rendering (Zone-Based)

**Source:** Section "3. Particle System" → "Fragment shader"

**Technique:** Particles only render within specific zones, matching mesh effects.

**How it applies to selective glow:**
- Particles only appear where you want glow (e.g., only at glass edges)
- Ensures particles align with glowing portions of meshes
- Creates cohesive effect where particles seem to emanate from glowing edges
- Perfect for TRON aesthetic where light "bleeds" from edges

**Code snippet:**
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

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Early discard** | Fragment discard is fast but not free — early discards help performance |
| **Zone alignment** | Use same `uProgress` and `uEdge` values as mesh shader to keep particles aligned |

---

## 7. Particle Attribute Arrays (Float32Array Buffers)

**Source:** Section "3. Particle System" → "Attribute Arrays"

**Technique:** Use typed arrays for particle position, velocity, and offset tracking.

**How it applies to many small light sources:**
- Efficient memory layout for managing hundreds/thousands of particles
- Each particle could represent a tiny light emanating from glass
- Typed arrays = better performance than JS objects for large counts
- Track initial, current, and velocity for each particle

**Code snippet:**
```javascript
let particleCount = meshGeo.attributes.position.count;
let particleMaxOffsetArr: Float32Array;    // max distance from origin
let particleInitPosArr: Float32Array;      // initial positions
let particleCurrPosArr: Float32Array;      // current positions
let particleVelocityArr: Float32Array;     // velocity vectors
let particleSpeedFactor = 0.02;
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Bounded count** | Particle count is bounded by vertex buffer size; test on target hardware |
| **Memory layout** | Float32Array is x3 for xyz coordinates — access via `i * 3 + 0/1/2` |

---

## 8. Particle Initialization Pattern

**Source:** Section "3. Particle System" → "Initialization"

**Technique:** Initialize particles from mesh geometry with random offsets and velocities.

**How it applies to light emanation from glass:**
- Start particles at mesh surface positions (glass primitives)
- Random upward velocity simulates light rising/floating
- Max offset defines how far light "emanates" before recycling

**Code snippet:**
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

---

## 9. Per-Frame Particle Update with Recycling

**Source:** Section "3. Particle System" → "Per-Frame Update with Recycling"

**Technique:** Update positions each frame and reset particles when they exceed max distance.

**How it applies to continuous light emanation:**
- Creates infinite, flowing light particles without memory growth
- Particles emanate from glass, travel outward, then recycle back to origin
- Simulates continuous light "breathing" or pulsing from translucent surfaces

**Code snippet:**
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

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Particle recycling** | Reset particles when they exceed `maxOffset` — prevents unbounded drift, memory growth, and perf degradation |
| **Vector creation** | Creating `new THREE.Vector3` in loop is expensive — consider reusing vectors |

---

## 10. Stacked Sine Waves for Organic Motion

**Source:** Section "3. Particle System" → "Wave-Like Motion (Stacked Sine Waves)"

**Technique:** Combine multiple sine waves at different frequencies for organic, non-repetitive particle movement.

**How it applies to subtle atmosphere/fog:**
- Creates floating, drifting particle motion that feels organic
- Perfect for subtle fog or atmosphere particles around glass objects
- Non-repetitive motion avoids looking mechanical/artificial
- Can simulate heat distortion or light wave effects

**Code snippet:**
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

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Stacked waves** | Multiple frequencies prevent repetitive motion patterns |
| **Amplitude control** | Expose `waveAmplitude` as uniform for runtime adjustment |

---

## 11. Rotating Textured Particles

**Source:** Section "3. Particle System" → "Rotating Textured Particles"

**Technique:** Rotate particle textures around center pivot using 2D rotation matrix in fragment shader.

**How it applies to TRON/neon aesthetic:**
- Rotate glowing particle textures for dynamic light effects
- Add visual interest to light emanation from glass
- Can animate rotation speed for pulsing/spinning glow effects
- Use neon-colored textures for TRON feel

**Code snippet:**
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

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Rotation pivot** | The 3-step shift→rotate→shift is mandatory. Skipping it rotates around the bottom-left corner, not center |
| **Angle varying** | Pass `vAngle` from vertex shader (can be based on time or position) |

---

## 12. Additive Blending for Glow Accumulation

**Source:** Section "3. Particle System" → "Rotating Textured Particles" (material settings)

**Technique:** Use `transparent = true` AND `blending = THREE.AdditiveBlending` for glowing particles.

**How it applies to neon glow/bloom:**
- Additive blending causes overlapping particles to accumulate brightness
- Creates natural glow effect where particles cluster
- Essential for TRON aesthetic — bright neon light builds up visually
- Works in conjunction with bloom post-processing

**Code snippet:**
```javascript
// Required material settings
particleMat.transparent = true;
particleMat.blending = THREE.AdditiveBlending;
```

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Both required** | Must set `transparent = true` AND `blending = THREE.AdditiveBlending`, or particles won't glow/accumulate |
| **Performance** | Additive blending is generally well-optimized on modern GPUs |

---

## 13. Selective Bloom via Two-Pass Rendering

**Source:** Section "4. Selective Bloom (Two-Pass Rendering)"

**Technique:** Render bloom pass with black background to isolate bloom targets, then composite with base scene.

**How it applies to selective glow on specific objects:**
- **Critical for TRON aesthetic**: Bloom only affects specific objects (neon edges, internal lights), not entire scene
- First pass: Black background + only bloom-target objects → creates isolated bloom texture
- Second pass: Full scene + bloom texture composited → selective glow without blowing out environment
- Dark ground plane stays dark while glass edges glow

**Code snippet:**
```javascript
// Pass 1: bloom only (black background isolates bloom targets)
scene.background = new THREE.Color(0x000000);
bloomComposer.render();

// Pass 2: combine base + bloom
scene.background = originalBackground;
finalComposer.render();
```

**How it works:**
- The final shader blends `tDiffuse` (base) with the bloom texture
- Bloom only affects the dissolving edge, not the environment
- Black background in pass 1 ensures bloom doesn't pick up unwanted elements

**Gotchas/tips:**
| Tip | Detail |
|-----|--------|
| **Two EffectComposer passes** | Monitor GPU cost — two full-screen passes have overhead |
| **Layer-based selection** | Can use Three.js layers to control which objects render in bloom pass |

---

## Summary: Most Relevant Techniques for Target Aesthetic

| Priority | Technique | Application |
|----------|-----------|-------------|
| ⭐⭐⭐ | **CubeMap > HDRI** | Dark scene with controlled bloom for neon glow |
| ⭐⭐⭐ | **Selective Bloom (Two-Pass)** | Bloom only on neon edges/glass, not whole scene |
| ⭐⭐⭐ | **Additive Blending** | Glow accumulation for TRON neon aesthetic |
| ⭐⭐⭐ | **Three-Zone Fragment Logic** | Glowing edges on glass primitives |
| ⭐⭐ | **Shader Injection** | Custom glow logic in standard materials |
| ⭐⭐ | **Distance-based Particle Sizing** | Light emanation with depth in orthographic |
| ⭐⭐ | **Zone-based Particle Rendering** | Particles only where glow exists |
| ⭐⭐ | **Particle Recycling** | Continuous light emanation, bounded performance |
| ⭐ | **Stacked Sine Waves** | Organic floating light/atmosphere |
| ⭐ | **Rotating Textured Particles** | Dynamic neon particle effects |
| ⭐ | **Perlin Noise** | Organic edge transitions on glass |

---

## Performance Considerations Summary

| Concern | Mitigation |
|---------|------------|
| **Many small light sources** | Use particles with additive blending instead of actual PointLights |
| **Attribute updates every frame** | Only touch visible portion of arrays |
| **Fragment discard** | Early discards help, but not free |
| **Particle count** | Bounded by vertex buffer size; test on target hardware |
| **Two-pass bloom** | Monitor GPU cost for two EffectComposer passes |
| **Per-pixel GLSL noise** | Acceptable performance, but frequency/amplitude affect workload |
# Techniques for Dark Scene, Neon Aesthetic, and Volumetric Effects

---

## 1. Volumetric Fog/Atmosphere

**Source:** 3D Noise Texture Generation + Scattering Node sections

**Technique:** Multi-octave 3D Perlin noise volumetric scattering

**How it applies:** Creates atmospheric fog/smoke effects ideal for dark scenes where light beams become visible through haze. The multi-octave sampling provides natural-looking density variation that reacts to internal point lights.

**Code snippet:**
```javascript
function createTexture3D() {
  let i = 0;
  const size = 128;
  const data = new Uint8Array( size * size * size );
  const scale = 10;
  const perlin = new ImprovedNoise();
  const repeatFactor = 5.0;

  for ( let z = 0; z < size; z ++ ) {
    for ( let y = 0; y < size; y ++ ) {
      for ( let x = 0; x < size; x ++ ) {
        const nx = ( x / size ) * repeatFactor;
        const ny = ( y / size ) * repeatFactor;
        const nz = ( z / size ) * repeatFactor;
        const noiseValue = perlin.noise( nx * scale, ny * scale, nz * scale );
        data[ i ] = ( 128 + 128 * noiseValue );
        i ++;
      }
    }
  }

  const texture = new THREE.Data3DTexture( data, size, size, size );
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
```

**Gotchas/tips:**
- 128³ texture is memory-intensive (~2MB for single channel)
- Use `RedFormat` for single-channel to save memory
- `RepeatWrapping` allows seamless tiling for larger volumes

---

## 2. Volumetric Material for Light Shafts/Glow

**Source:** VolumeNodeMaterial Setup + Scattering Node sections

**Technique:** Additive-blended volume with multi-scale noise density

**How it applies:** Perfect for TRON neon aesthetic - internal point lights illuminate the volumetric fog, creating visible light beams and glow effects. Additive blending brightens areas where lights intersect.

**Code snippet:**
```javascript
const volumetricMaterial = new THREE.VolumeNodeMaterial();
volumetricMaterial.steps = 12;
volumetricMaterial.transparent = true;
volumetricMaterial.blending = THREE.AdditiveBlending;
```

```javascript
volumetricMaterial.scatteringNode = Fn( ( { positionRay } ) => {
  const timeScaled = vec3( shaderTime, 0, shaderTime.mul( .3 ) );

  const sampleGrain = ( scale, timeScale = 1 ) =>
    texture3D(
      noiseTexture3D,
      positionRay.add( timeScaled.mul( timeScale ) ).mul( scale ).mod( 1 ),
      0
    ).r.add( .5 );

  let density = sampleGrain( .1 );
  density = density.mul( sampleGrain( .05, 1 ) );
  density = density.mul( sampleGrain( .02, 2 ) );

  return smokeAmount.mix( 1, density );
} );
```

**Gotchas/tips:**
- `steps = 12` is a balance between quality and performance; increase for denser fog
- Additive blending works best for light-colored fog; dark smoke needs different approach
- Three octaves at different scales (0.1, 0.05, 0.02) create natural detail

---

## 3. Soft Shadows with High Penumbra

**Source:** Lighting Setup section

**Technique:** Spotlight with maximum penumbra for soft shadow edges

**How it applies:** Soft shadows are essential for dark scenes to avoid harsh, unrealistic edges. The high penumbra (1.0) creates gradual falloff that matches the TRON aesthetic's soft glow.

**Code snippet:**
```javascript
// Spotlight with color projection texture
spotLight = new THREE.SpotLight( 0xffffff, 100 );
spotLight.position.set( 2.5, 5, 2.5 );
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 0;
spotLight.map = new THREE.TextureLoader().setPath( 'textures/' ).load( 'colors.png' );
spotLight.castShadow = true;
spotLight.shadow.intensity = .98;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 15;
spotLight.shadow.focus = 1;
```

**Gotchas/tips:**
- `penumbra = 1` gives maximum softness at shadow edges
- `shadow.intensity = .98` leaves slight ambient fill, avoiding pure black shadows
- Colored projection texture (`colors.png`) can create TRON-style colored light beams
- 1024x1024 shadow map is moderate; increase for sharper soft shadows

---

## 4. Internal Point Lights for Neon Glow Effect

**Source:** Lighting Setup section

**Technique:** Animated point light with warm color and shadow casting

**How it applies:** Internal/orbiting point lights create the classic TRON glow-from-within effect. When combined with volumetric fog, the light illuminates particles creating visible halos.

**Code snippet:**
```javascript
// Warm point light (animated orbit)
pointLight = new THREE.PointLight( 0xf9bb50, 3, 100 );
pointLight.castShadow = true;
pointLight.position.set( 0, 1.4, 0 );
```

**Gotchas/tips:**
- Warm colors (0xf9bb50) create more visible volumetric scattering than cool colors
- `castShadow = true` is expensive; for many lights, consider selective shadow casting
- Low intensity (3) with short range (100) is performant for dark scenes

---

## 5. Depth Pre-Pass for Occlusion

**Source:** Multi-Pass Render Pipeline section

**Technique:** Depth pre-pass fed into volumetric material

**How it applies:** Critical for dark scenes - ensures volumetric fog properly occludes behind solid objects, preventing glow from bleeding through walls. Also improves performance by culling hidden fragments.

**Code snippet:**
```javascript
// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' )
  .toInspector( 'Depth', () => prePass.getLinearDepthNode() );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );
```

**Gotchas/tips:**
- `transparent = false` ensures only opaque objects write to depth
- Linear depth is often easier to work with than nonlinear depth
- Essential for correct fog/object interaction in multi-pass pipelines

---

## 6. TRAA for Temporal Stability

**Source:** Halton Sequence Generator + Multi-Pass Render Pipeline sections

**Technique:** Temporal Reprojection Anti-Aliasing with Halton jitter

**How it applies:** Dark scenes with volumetric effects suffer from flickering and noise. TRAA accumulates samples over frames, smoothing noise while preserving detail - critical for foggy neon scenes.

**Code snippet:**
```javascript
// Matches TRAA's 32-sample Halton jitter — optimal low-discrepancy distribution
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

// Generate 32 offsets (base 2, 3) — same length as TRAA's internal sequence
const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

```javascript
// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

**Gotchas/tips:**
- 32 samples match TRAA's internal sequence for optimal distribution
- Requires velocity buffer for motion vectors (setMRT with velocity)
- Ghosting can occur with fast-moving objects; tune TRAA settings

---

## 7. Temporal Jitter for Volumetric Quality

**Source:** Temporal Dithering via IGN + Halton section

**Technique:** Interleaved Gradient Noise with Halton perturbation

**How it applies:** Reduces banding artifacts in volumetric fog that are especially visible in dark scenes. The temporal offset ensures noise patterns vary each frame, which TRAA then smooths.

**Code snippet:**
```javascript
temporalOffset = uniform( 0 );
temporalRotation = uniform( 0 );
shaderTime = uniform( 0 );

const temporalJitter2D = vec2( temporalOffset, temporalRotation );
volumetricMaterial.offsetNode = fract(
  interleavedGradientNoise(
    screenCoordinate.add( temporalJitter2D.mul( 100 ) )
  ).add( temporalOffset )
);
```

**Gotchas/tips:**
- IGN is fast and has good spatial distribution
- Multiplying jitter by 100 prevents visible patterns
- Must sync with TRAA's Halton sequence for proper accumulation

---

## 8. Multi-Pass Pipeline for Many Lights Performance

**Source:** Multi-Pass Render Pipeline section

**Technique:** Separate depth pre-pass with MRT for velocity

**How it applies:** For scenes with many light sources, a depth pre-pass reduces overdraw. The MRT setup enables TRAA which provides temporal supersampling without per-light cost.

**Code snippet:**
```javascript
renderPipeline = new THREE.RenderPipeline( renderer );

// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' )
  .toInspector( 'Depth', () => prePass.getLinearDepthNode() );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );

// --- Pass 2: Scene Pass (full scene + volumetric, MRT) ---
const scenePass = pass( scene, camera ).toInspector( 'Scene' );
scenePass.name = 'Scene Pass';
scenePass.setMRT( mrt( {
  output: output,
  velocity: velocity
} ) );
const scenePassColor = scenePass.getTextureNode().toInspector( 'Output' );
const scenePassVelocity = scenePass.getTextureNode( 'velocity' )
  .toInspector( 'Velocity' );

// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

**Gotchas/tips:**
- Depth pre-pass is especially beneficial for complex geometry
- MRT (Multiple Render Targets) avoids extra passes for velocity
- TRAA provides "free" supersampling for all lights in the scene

---

## 9. Animated Light Orbits for Dynamic Scenes

**Source:** Animation Loop section

**Technique:** Sinusoidal animation for light movement

**How it applies:** Moving lights through volumetric fog creates dynamic, eye-catching effects. Different frequencies on each axis create organic, non-repetitive motion paths.

**Code snippet:**
```javascript
let frameCount = 0;
let animationTime = 0;
let lastTime = performance.now();

function animate() {
  const currentTime = performance.now();
  const delta = ( currentTime - lastTime ) * 0.001;
  lastTime = currentTime;

  // Sync temporal uniforms with TRAA's Halton sequence
  const haltonIndex = frameCount % 32;
  temporalOffset.value = _haltonOffsets[ haltonIndex ][ 0 ];
  temporalRotation.value = _haltonOffsets[ haltonIndex ][ 1 ];
  frameCount ++;

  if ( params.animated ) animationTime += delta;
  shaderTime.value = animationTime;

  const scale = 2.4;
  pointLight.position.x = Math.sin( animationTime * 0.7 ) * scale;
  pointLight.position.y = Math.cos( animationTime * 0.5 ) * scale;
  pointLight.position.z = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.position.x = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.lookAt( 0, 0, 0 );
  teapot.rotation.y = animationTime * 0.2;

  renderPipeline.render();
}
```

**Gotchas/tips:**
- Different frequencies (0.7, 0.5, 0.3) create Lissajous-like patterns
- `shaderTime` must be synchronized with animation for consistent fog movement
- `frameCount % 32` loops Halton sequence for infinite animation

---

## Summary: Techniques NOT Found in Context

The following techniques from the query were **not explicitly covered**:

| Technique | Notes |
|-----------|-------|
| Orthographic camera | Not mentioned; all techniques work with perspective |
| Frosted glass/translucent mesh | VolumeNodeMaterial creates volumetric effects, not surface translucency |
| Selective bloom/glow | No post-process bloom pass described; volumetric fog creates similar effect |

For a complete TRON neon aesthetic with dark scenes, combine these techniques with:
- Separate bloom post-process (e.g., UnrealBloomPass) for mesh glow
- MeshPhysicalMaterial with transmission for frosted glass
- Orthographic camera works with all techniques but may need depth calculation adjustments
# Extracted Techniques from Performance Considerations

> **Note:** The provided context is only Section 4 (Performance Considerations) of a larger document. It focuses on volumetric rendering and optimization techniques. Many requested techniques (orthographic camera, frosted glass, selective bloom, soft shadows, neon aesthetics) are not covered in this fragment.

---

## Fog/Atmosphere & Volumetric Lighting

### Source
Section 4: Performance Considerations - Ray Marching

### Technique: Ray Marched Volumetric Scattering
**How it applies:** Core technique for fog/atmosphere effects and volumetric lighting from internal point lights. Ray marching through a 3D texture creates realistic light scattering in dark scenes.

**Code snippet (verbatim):**
```
Ray march steps | Default 12, adjustable 2–16 via GUI. Fewer steps = faster but more banding (TRAA compensates).
```

**Gotchas/tips:**
- Fewer steps = faster but introduces banding artifacts
- TRAA can compensate for banding with fewer steps
- Trade quality vs performance based on scene complexity

---

### Source
Section 4: Performance Considerations - Texture Optimization

### Technique: 3D Noise Texture Caching
**How it applies:** Optimizes volumetric fog/atmosphere sampling performance, critical for many light sources where texture reads compound quickly.

**Code snippet (verbatim):**
```
3D texture size | 128^3 = 2MB (single channel). Small enough to fit in texture cache for repeated sampling.
```

**Gotchas/tips:**
- Keep 3D textures small (128³) to fit in texture cache
- Single channel reduces memory bandwidth
- Critical for performance when sampling multiple times per ray step

---

### Source
Section 4: Performance Considerations - Shader Bottlenecks

### Technique: Texture Sample Minimization
**How it applies:** For many light sources, each additional sample compounds cost. Understanding the math helps optimize volumetric lighting.

**Code snippet (verbatim):**
```
3 texture3D samples per fragment | The scattering node samples the 3D texture 3 times per ray step. At 12 steps, that's 36 texture reads per pixel — the main shader bottleneck.
```

**Gotchas/tips:**
- 36 texture reads per pixel is expensive
- Each additional ray step multiplies texture reads
- Consider reducing samples or steps for many light source scenes

---

## Dark Scene Optimization

### Source
Section 4: Performance Considerations - Depth Optimization

### Technique: Depth Pre-pass for Volumetric Culling
**How it applies:** In dark scenes with volumetric effects, avoid wasting computation behind opaque geometry. Critical for performance when using fog/atmosphere.

**Code snippet (verbatim):**
```
Depth pre-pass for early termination | Volumetric rays stop at opaque surfaces, avoiding wasted march steps behind geometry.
```

**Gotchas/tips:**
- Render depth pre-pass before volumetrics
- Rays terminate at opaque surfaces
- Significant savings in complex geometry scenes

---

### Source
Section 4: Performance Considerations - Resolution Strategy

### Technique: DPR (Device Pixel Ratio) Optimization
**How it applies:** Dark scenes with volumetric effects are GPU-intensive. Disabling retina rendering can make multi-pass pipelines viable.

**Code snippet (verbatim):**
```
DPR disabled | Rendering at 1x device pixels rather than 2x/3x retina. The multi-pass pipeline (3 full-screen passes) makes high DPR very costly.
```

**Gotchas/tips:**
- Multi-pass pipelines (bloom, volumetrics, post-processing) multiply DPR cost
- 1x DPR = 1/4 the pixels of 2x retina, 1/9 of 3x
- Trade visual sharpness for performance in heavy scenes

---

## Temporal Anti-Aliasing (TRAA)

### Source
Section 4: Performance Considerations - Quality vs Performance

### Technique: TRAA for Low Step Count Quality
**How it applies:** Enables smooth volumetric results with minimal ray march steps - essential for real-time performance with fog/atmosphere.

**Code snippet (verbatim):**
```
TRAA vs raw quality | TRAA lets you use very few ray-march steps (even 2–4) while still getting smooth results through temporal accumulation. The trade-off is ghosting on fast motion.
```

**Gotchas/tips:**
- Can reduce ray steps from 12 to 2-4 with TRAA
- Ghosting on fast motion is the trade-off
- Excellent for static or slow-moving dark scenes

---

### Source
Section 4: Performance Considerations - Static Scene Optimization

### Technique: Animation Freeze for Convergence
**How it applies:** For static dark scenes or product renders, freezing animation lets TRAA fully converge for maximum quality.

**Code snippet (verbatim):**
```
Animation toggle | The `animated` flag can freeze animation time, which in a production context would let TRAA fully converge to a clean image for static scenes.
```

**Gotchas/tips:**
- Use `animated` flag to freeze time
- Allows TRAA to accumulate clean samples
- Perfect for static shots or product visualization

---

## Multi-Pass Pipeline Optimization

### Source
Section 4: Performance Considerations - Render Targets

### Technique: MRT (Multiple Render Targets)
**How it applies:** Reduces passes for effects requiring multiple outputs (velocity buffer for TRAA, depth for volumetrics). Essential for complex lighting pipelines.

**Code snippet (verbatim):**
```
MRT (Multiple Render Targets) | The scene pass writes color + velocity in a single draw call instead of two separate passes — saves an entire scene traversal.
```

**Gotchas/tips:**
- Write color + velocity simultaneously
- Saves one full scene traversal
- Reduces draw calls in multi-pass pipelines

---

## Summary: Techniques NOT Found in This Fragment

The following requested techniques are **not covered** in Section 4:
- ❌ Orthographic camera setup
- ❌ Frosted glass/translucent mesh materials  
- ❌ Selective bloom/glow
- ❌ Soft shadows
- ❌ TRON neon aesthetic specifics

These would likely be in other sections of the full document (Sections 1-3 or 5+).
# Technique Extraction: Blended Material Shader Tutorial

**Source Document:** Codrops — Blended Material Shader in WebGL with Solid.js (Aug 2025)

---

## 1. Multi-Pass Render Target Compositing

### Source
Section: "TargetedTorus — Dual Render Pass + Shader Blending"

### Technique
Render the same scene multiple times into separate `WebGLRenderTarget`s, then composite on a fullscreen quad using a custom shader. This enables per-pass effects (wireframe vs solid) without geometry duplication.

### How it Applies to Your Dark Scene
- **Selective bloom/glow**: Render glowing objects to a separate render target, then apply bloom pass only to that texture
- **Frosted glass effect**: Render back-face normals or depth to one target, front-face to another, blend in shader for SSS-like translucency
- **Internal lights**: Render light contribution from internal point lights to a separate target for compositing

### Code Snippet
```javascript
// src/gl/targeted-torus.js (core technique)
import { Mesh, ShaderMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import RenderTarget from './render-target';
import Stage from './stage';

export default class TargetedTorus extends Mesh {
  targetSolid = new RenderTarget();
  targetWireframe = new RenderTarget();
  scene = new Torus();
  camera = new PerspectiveCamera(45, viewport.aspectRatio, 0.1, 1000);

  constructor() {
    super();
    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
      fragmentShader: `
        varying vec2 v_uv;
        uniform sampler2D u_texture_solid;
        uniform sampler2D u_texture_wireframe;

        void main() {
          vec4 wireframe_texture = texture2D(u_texture_wireframe, v_uv);
          vec4 solid_texture = texture2D(u_texture_solid, v_uv);
          float blend = smoothstep(0.15, 0.65, v_uv.x);
          vec4 mixed = mix(wireframe_texture, solid_texture, blend);
          gl_FragColor = mixed;
        }
      `,
      uniforms: {
        u_texture_solid: { value: this.targetSolid.texture },
        u_texture_wireframe: { value: this.targetWireframe.texture },
      },
    });
  }

  render() {
    // Pass 1: wireframe
    this.scene.material.wireframe = true;
    Stage.renderer.setRenderTarget(this.targetWireframe);
    Stage.renderer.render(this.scene, this.camera);
    this.material.uniforms.u_texture_wireframe.value = this.targetWireframe.texture;

    // Pass 2: solid
    this.scene.material.wireframe = false;
    Stage.renderer.setRenderTarget(this.targetSolid);
    Stage.renderer.render(this.scene, this.camera);
    this.material.uniforms.u_texture_solid.value = this.targetSolid.texture;

    // Reset to default framebuffer
    Stage.renderer.setRenderTarget(null);
  }
}
```

### Gotchas/Tips
- **MUST call `setRenderTarget(null)`** after render target passes, or normal rendering breaks
- **`material.needsUpdate = true`** required after toggling `wireframe` mode
- Each render target consumes GPU memory — be mindful of resolution

---

## 2. WebGLRenderTarget Wrapper

### Source
Section: "RenderTarget Wrapper"

### Technique
Wrap Three.js `WebGLRenderTarget` with automatic sizing based on viewport and devicePixelRatio.

### How it Applies to Your Dark Scene
- Create bloom/glow render targets at optimal resolution
- Use for depth/normal prepasses needed for frosted glass effects
- Downsample targets for performance (e.g., quarter-res for bloom)

### Code Snippet
```javascript
// src/gl/render-target.js
import { WebGLRenderTarget } from 'three';
import { viewport } from '../viewport';

export default class RenderTarget extends WebGLRenderTarget {
  constructor() {
    super();
    this.width = viewport.width * viewport.devicePixelRatio;
    this.height = viewport.height * viewport.devicePixelRatio;
  }

  resize() {
    const w = viewport.width * viewport.devicePixelRatio;
    const h = viewport.height * viewport.devicePixelRatio;
    this.setSize(w, h);
  }
}
```

### Gotchas/Tips
- Match resolution to `viewport * devicePixelRatio` for crisp output
- For bloom/glow, consider using HALF or QUARTER resolution to save GPU

---

## 3. Smooth Blend Transitions with smoothstep + mix

### Source
Section: "smoothstep + mix Blending"

### Technique
Use `smoothstep` for smooth transitions in shader space, combined with `mix` for linear interpolation between values/colors/textures.

### How it Applies to Your Dark Scene
- **TRON aesthetic edges**: Smooth gradient transitions between glowing and dark areas
- **Fog falloff**: `smoothstep` for distance-based atmospheric fade
- **Glass translucency**: Blend between transparent and emissive based on view angle

### Code Snippet
```glsl
// From the document's fragment shader
float blend = smoothstep(0.15, 0.65, v_uv.x);  // smooth 0→1 ramp
vec4 mixed = mix(wireframe_texture, solid_texture, blend);

// Apply to your dark scene:
// - Distance fog: smoothstep(near, far, depth)
// - Glow intensity: smoothstep(threshold, max, luminance)
// - Edge glow: smoothstep based on fresnel
```

### Gotchas/Tips
- Author's mental model: **"Picture what you want, think how you'd do it in Photoshop, then translate to shader math"**
- `smoothstep(edge0, edge1, x)` returns 0 when x ≤ edge0, 1 when x ≥ edge1, smooth Hermite curve between
- UV space is 0-1, not pixel coordinates

---

## 4. Performance-Capped Device Pixel Ratio

### Source
Section: "Viewport Tracker" + "Performance Considerations"

### Technique
Cap `devicePixelRatio` at 2 to prevent GPU waste on high-density displays.

### How it Applies to Your Dark Scene
Critical for performance when you have:
- Multiple render targets (bloom passes)
- Many point lights
- Complex shaders (translucency, SSS approximation)

### Code Snippet
```javascript
// src/gl/viewport.js
export const viewport = {
  width: 0,
  height: 0,
  devicePixelRatio: 1,
  aspectRatio: 0,
};

export const resizeViewport = () => {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.aspectRatio = viewport.width / viewport.height;
  viewport.devicePixelRatio = Math.min(window.devicePixelRatio, 2);  // CAP AT 2!
};
```

### Gotchas/Tips
- Ultra-high-density screens (DPR 3-4) waste GPU without visible benefit
- Default values to `0` for SSR safety (`window` undefined server-side)

---

## 5. Stage/Actor Delegation Pattern

### Source
Section: "Stage Class (Three.js lifecycle manager)"

### Technique
A singleton Stage class that auto-delegates `render()` and `resize()` to all scene children implementing those methods — no manual registration needed.

### How it Applies to Your Dark Scene
- Clean architecture for managing multiple light sources
- Each glowing mesh can manage its own internal point light
- Easy to add/remove actors without tight coupling

### Code Snippet
```javascript
// src/gl/stage.js
import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { viewport, resizeViewport } from './viewport';

class Stage {
  init(element) {
    resizeViewport();
    this.camera = new PerspectiveCamera(45, viewport.aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(viewport.width, viewport.height);
    element.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio(viewport.devicePixelRatio);
    this.scene = new Scene();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
    // AUTO-DELEGATE to all children
    this.scene.children.forEach((child) => {
      if (child.render && typeof child.render === 'function') child.render();
    });
  }

  resize() {
    this.renderer.setSize(viewport.width, viewport.height);
    this.camera.aspect = viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
    // AUTO-DELEGATE to all children
    this.scene.children.forEach((child) => {
      if (child.resize && typeof child.resize === 'function') child.resize();
    });
  }
}
export default new Stage();
```

### Gotchas/Tips
- Stage timing: Stage initializes on mount; dependent objects must defer via signals/promises
- Keep files small and single-purpose — "800-line mega-classes are nightmares when debugging WebGL"

---

## 6. CRITICAL: Minimize Light Count for Performance

### Source
Document intro + "Performance Considerations"

### Technique
Dramatically reduce light count while maintaining visual quality through strategic placement and material choices.

### How it Applies to Your Dark Scene
**This is THE most important insight for your many small light sources:**

> "The Blackbird project went from 6 lights (30fps on M1 Max) to 2 lights (120fps) with no visual difference. 'The lights in WebGL have consequences.'"

For your TRON aesthetic with internal point lights:
- **Consider fake lights**: Use emissive materials + bloom instead of actual PointLights
- **Use light proxies**: One light per cluster of meshes, not per mesh
- **Bake what you can**: Static glow into textures, dynamic for moving elements
- **Deferred rendering**: Consider Three.js deferred rendering for many lights

### Code Snippet
```javascript
// Instead of many PointLights:
// Option 1: Emissive materials + post-process bloom
material.emissive = new THREE.Color(0x00ffff);
material.emissiveIntensity = 2.0;

// Option 2: Light clustering
// One point light affecting multiple nearby glass meshes
// rather than one light per mesh

// Option 3: Shader-based fake lighting
// Calculate lighting in fragment shader using light position uniforms
// without actual Three.js light objects
```

### Gotchas/Tips
- Each light = additional draw calls and GPU calculations
- In dark scenes, lights are MORE expensive (contrast reveals artifacts)
- Test on lower-end hardware, not just your M1 Max

---

## 7. MeshNormalMaterial for Prototyping (Skip Lighting)

### Source
Section: "Performance Considerations"

### Technique
Use `MeshNormalMaterial` during development to skip lighting entirely, eliminating a major GPU cost.

### How it Applies to Your Dark Scene
- Prototype geometry and animation without lighting complexity
- Isolate performance issues (if `MeshNormalMaterial` is slow, it's geometry not lighting)
- Test render target compositing without shader compilation issues

### Code Snippet
```javascript
// src/gl/torus.js
import { Mesh, MeshNormalMaterial, TorusKnotGeometry } from 'three';

export default class Torus extends Mesh {
  constructor() {
    super();
    this.geometry = new TorusKnotGeometry(1, 0.285, 300, 26);
    this.material = new MeshNormalMaterial();  // No lighting needed!
  }
}
```

---

## 8. Viewport Cache Object (Avoid Layout Thrashing)

### Source
Section: "Viewport Tracker" + "Performance Considerations"

### Technique
Cache all window dimension reads in a single object, updated only on resize. Prevents layout thrashing from repeated `window.innerWidth` calls.

### How it Applies to Your Dark Scene
- Critical for smooth camera/responsive behavior
- Prevents jank during resize
- Important when many components need viewport info

### Code Snippet
```javascript
// src/gl/viewport.js
export const viewport = {
  width: 0,
  height: 0,
  devicePixelRatio: 1,
  aspectRatio: 0,
};

// Single update point
export const resizeViewport = () => {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.aspectRatio = viewport.width / viewport.height;
  viewport.devicePixelRatio = Math.min(window.devicePixelRatio, 2);
};

// All other code reads from viewport object, never window directly
```

### Gotchas/Tips
- Reading `window.innerWidth`/`innerHeight` triggers document reflow
- Cache once, read many times

---

## 9. ResizeObserver Over Window Resize Event

### Source
Section: "Solid.js Components" + "Practical Tips & Gotchas"

### Technique
Use `ResizeObserver` instead of `window.addEventListener('resize', ...)` for viewport tracking.

### How it Applies to Your Dark Scene
- Auto-debounced, won't hammer resize logic during window drag
- Fires on init — no need for manual initial call
- Works for container resizes, not just window

### Code Snippet
```javascript
// src/components/GlCanvas.tsx
import { onMount, onCleanup } from 'solid-js';
import Stage from '~/gl/stage';

export default function GlCanvas() {
  let el;
  let observer;

  onMount(() => {
    if (!el) return;
    Stage.init(el);
    Stage.render();
    observer = new ResizeObserver((entry) => Stage.resize());
    observer.observe(el);
  });

  onCleanup(() => { if (observer) observer.disconnect(); });

  return <div ref={el} style={{ position: 'fixed', inset: 0 }} />;
}
```

### Gotchas/Tips
- ResizeObserver is built-in debounced
- Don't forget to disconnect on cleanup

---

## 10. Radians vs Degrees (GSAP/Three.js)

### Source
Section: "Practical Tips & Gotchas"

### Technique
Three.js and GSAP use radians for rotation. Convert degrees using `degrees * (Math.PI / 180)`.

### How it Applies to Your Dark Scene
- Rotating light sources
- Spinning mesh primitives
- Camera orbit controls

### Code Snippet
```javascript
// src/gl/torus.js - GSAP rotation example
import gsap from 'gsap';

gsap.to(this.rotation, {
  y: 540 * (Math.PI / 180),  // degrees -> radians
  ease: 'power3.inOut',
  duration: 4,
  repeat: -1,
  yoyo: true,
});
```

---

## Summary: Key Takeaways for Your Dark TRON Scene

| Priority | Technique | Why It Matters |
|----------|-----------|----------------|
| **CRITICAL** | Minimize light count | 6 lights → 2 lights = 30fps → 120fps. Use emissive + bloom instead of real lights for glow |
| **HIGH** | Multi-pass render targets | Enables selective bloom, frosted glass, internal light effects |
| **HIGH** | Cap DPR at 2 | Prevents GPU waste on high-DPI screens |
| **MEDIUM** | smoothstep + mix shader blending | Smooth transitions for TRON aesthetic edges |
| **MEDIUM** | Stage/Actor delegation | Clean architecture for many light-emitting meshes |
| **MEDIUM** | Viewport caching | Avoids layout thrashing |
| **LOW** | MeshNormalMaterial for prototyping | Skip lighting during dev |
| **LOW** | ResizeObserver | Cleaner resize handling |
# Techniques Extracted from Volumetric Lighting TRAA Demo

## TRAA (Temporal Reprojection Anti-Aliasing) for Volumetric Lighting

- **Source:** three/addons/tsl/display/TRAANode.js
- **Applies to:** dark scene, fog/atmosphere

**Code Snippet:**
```javascript
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** TRAA requires WebGPU renderer; uses temporal reprojection to smooth volumetric effects over multiple frames

---

## Halton Sequence for Temporal Anti-Aliasing Jitter

- **Source:** Custom implementation
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

**Gotchas/Tips:** Halton sequence provides low-discrepancy sampling; base 2 and 3 give good 2D jitter distribution; 32 samples balances quality vs performance

---

## 3D Texture for Volumetric Light/Fog

- **Source:** three/tsl (TSL)
- **Applies to:** fog/atmosphere, dark scene

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** texture3D is a TSL function for sampling 3D noise textures; requires WebGPU; works with ImprovedNoise for procedural noise

---

## Multiple Render Targets (MRT) for Velocity Buffer

- **Source:** three/tsl (TSL)
- **Applies to:** many light sources performance, soft shadows

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** MRT outputs velocity buffer needed for temporal reprojection; depthPass for pre-pass optimization

---

## Interleaved Gradient Noise for Dithering

- **Source:** three/tsl (TSL)
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
import { interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** Screen-space dithering pattern that breaks up banding in volumetric effects; works well with temporal accumulation

---

## Multiple Light Sources (Point + Spot)

- **Source:** three/webgpu
- **Applies to:** internal point lights, many light sources performance

**Code Snippet:**
```javascript
let volumetricMesh, teapot, pointLight, spotLight;
```

**Gotchas/Tips:** WebGPU renderer handles multiple lights efficiently; combine with volumetric mesh for light shafts

---

# Techniques Extracted from Volumetric Lighting TRAA Demo

## TRAA (Temporal Reprojection Anti-Aliasing) for Volumetric Lighting

- **Source:** three/addons/tsl/display/TRAANode.js
- **Applies to:** dark scene, fog/atmosphere

**Code Snippet:**
```javascript
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** TRAA requires WebGPU renderer; uses temporal reprojection to smooth volumetric effects over multiple frames

---

## Halton Sequence for Temporal Anti-Aliasing Jitter

- **Source:** Custom implementation
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

**Gotchas/Tips:** Halton sequence provides low-discrepancy sampling; base 2 and 3 give good 2D jitter distribution; 32 samples balances quality vs performance

---

## 3D Texture for Volumetric Light/Fog

- **Source:** three/tsl (TSL)
- **Applies to:** fog/atmosphere, dark scene

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** texture3D is a TSL function for sampling 3D noise textures; requires WebGPU; works with ImprovedNoise for procedural noise

---

## Multiple Render Targets (MRT) for Velocity Buffer

- **Source:** three/tsl (TSL)
- **Applies to:** many light sources performance, soft shadows

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** MRT outputs velocity buffer needed for temporal reprojection; depthPass for pre-pass optimization

---

## Interleaved Gradient Noise for Dithering

- **Source:** three/tsl (TSL)
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
import { interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** Screen-space dithering pattern that breaks up banding in volumetric effects; works well with temporal accumulation

---

## Multiple Light Sources (Point + Spot)

- **Source:** three/webgpu
- **Applies to:** internal point lights, many light sources performance

**Code Snippet:**
```javascript
let volumetricMesh, teapot, pointLight, spotLight;
```

**Gotchas/Tips:** WebGPU renderer handles multiple lights efficiently; combine with volumetric mesh for light shafts

---

# Relevant Techniques for Dark Neon Scene with Frosted Glass & Internal Lights

## 1. Environmental Lighting with PMREMGenerator

**Source**: Section 3. Environmental Lighting

**Technique**: RoomEnvironment with PMREMGenerator for ambient lighting

**How it applies**: For a dark TRON-like scene, use PMREMGenerator to create ambient environment maps. Can adjust `environmentIntensity` to control ambient contribution - lower values (0.3-0.5) would suit a dark scene.

**Code snippet**:
```javascript
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromSceneAsync(environment).texture;
scene.environmentIntensity = 0.8;
```

**Gotchas/tips**: PMREMGenerator creates pre-filtered MIP maps for physically accurate reflections on glass/translucent materials. RoomEnvironment provides a simple interior lighting setup - consider custom environment maps for specific neon color schemes.

---

## 2. DirectionalLight Setup

**Source**: Section 3. Environmental Lighting

**Technique**: DirectionalLight for key lighting

**How it applies**: Use directional lights sparingly in dark scenes. Position to create dramatic shadows through glass objects. Consider colored lights for neon aesthetic.

**Code snippet**:
```javascript
const light = new THREE.DirectionalLight("#e7e2ca", 5);
light.position.set(0.0, 1.2, 3.86);
scene.add(light);
```

**Gotchas/tips**: DirectionalLight supports shadow maps. For TRON aesthetic, consider using colored lights (cyan, magenta, etc.). Intensity 5 is relatively bright - dial down for dark scenes.

---

## 3. MeshStandardMaterial for Glass-like Surfaces

**Source**: Section 4. TextGeometry Creation

**Technique**: MeshStandardMaterial with metalness/roughness

**How it applies**: For frosted glass effect, use low metalness (0.0-0.2) and higher roughness (0.4-0.7). Material will respond to internal point lights and bloom effects.

**Code snippet**:
```javascript
new THREE.MeshStandardMaterial({
    color: "#656565",
    metalness: 0.4,
    roughness: 0.3
})
```

**Gotchas/tips**: Higher roughness = more frosted appearance. For true glass, consider MeshPhysicalMaterial with transmission property. MeshStandardMaterial works well with environment maps for reflections.

---

## 4. Fog for Atmosphere

**Source**: Section 13. Fog & Background

**Technique**: Linear fog with matching background

**How it applies**: Essential for TRON-like dark atmosphere. Creates depth and makes light sources appear to fade into darkness. Match fog color to background for seamless effect.

**Code snippet**:
```javascript
scene.fog = new THREE.Fog(new THREE.Color("#41444c"), 0.0, 8.5);
scene.background = scene.fog.color;
```

**Gotchas/tips**: Near plane 0.0 means fog starts immediately. Far value (8.5) controls fog density - adjust based on scene scale. For very dark scenes, use near-black fog color. Consider FogExp2 for exponential falloff (more atmospheric).

---

## 5. Velocity-Driven Emissive Glow

**Source**: Section 12. Velocity-Driven Emissive Color

**Technique**: Dynamic emissive based on velocity/motion

**How it applies**: For internal lights in glass objects, use emissiveNode to create glow that responds to object state. Velocity-driven approach creates organic pulsing. For static glow, use simpler emissive setup.

**Code snippet**:
```javascript
const emissive_color = color(new THREE.Color("0000ff"));
const vel_at = velocity_storage_at.toAttribute();
const hue_rotated = vel_at.mul(Math.PI * 10.0);
const emission_factor = length(vel_at).mul(10.0);

mesh.material.emissiveNode = hue(emissive_color, hue_rotated).mul(emission_factor).mul(5.0);
```

**Gotchas/tips**: This TSL approach requires WebGPU. For WebGL, use `material.emissive` property directly. Emission multipliers (5.0, 10.0) create bloom-friendly bright spots. Hue rotation adds color variety to neon aesthetic.

---

## 6. Post-Processing Bloom

**Source**: Section 14. Post-Processing Pipeline

**Technique**: Bloom effect for selective glow

**How it applies**: Essential for TRON neon aesthetic. Bloom makes emissive materials and bright areas glow. Tune thresholds to control which elements bloom.

**Code snippet**:
```javascript
const bloom_pass = bloom(ao_denoise, 0.3, 0.2, 0.1);
```

**Gotchas/tips**: Parameters are (input, strength, radius, threshold). Lower threshold (0.1) = more elements bloom. Strength 0.3 is moderate - increase for intense neon. For selective bloom on specific objects, use emissive materials with values above threshold.

---

## 7. Multiple Render Targets (MRT) for Post-Processing

**Source**: Section 14. Post-Processing Pipeline

**Technique**: MRT for efficient post-processing data

**How it applies**: Required for advanced effects like AO. Outputs color, depth, and normals in single pass for use in post-processing chain.

**Code snippet**:
```javascript
scene_pass.setMRT(mrt({
    output: output,
    normal: normalView
}));

const scene_color = scene_pass.getTextureNode("output");
const scene_depth = scene_pass.getTextureNode("depth");
const scene_normal = scene_pass.getTextureNode("normal");
```

**Gotchas/tips**: MRT is more efficient than multiple passes. Essential for SSAO, edge detection, and other screen-space effects.

---

## 8. Ambient Occlusion Post-Processing

**Source**: Section 14. Post-Processing Pipeline

**Technique**: SSAO for depth and contact shadows

**How it applies**: Adds subtle shadows in crevices and where objects meet ground plane. Enhances the grounded feel of glass objects on dark surfaces.

**Code snippet**:
```javascript
const ao_pass = ao(scene_depth, scene_normal, camera);
ao_pass.resolutionScale = 1.0;

const ao_denoise = denoise(ao_pass.getTextureNode(), scene_depth, scene_normal, camera)
    .mul(scene_color);
```

**Gotchas/tips**: `resolutionScale = 1.0` is full quality - drop to 0.5 for performance. Denoise pass smooths AO artifacts. AO is multiplied with scene color for darkening effect.

---

## 9. Film Grain Noise for Atmosphere

**Source**: Section 14. Post-Processing Pipeline

**Technique**: Procedural noise overlay

**How it applies**: Adds subtle texture to dark scenes, preventing flat appearance. Creates cinematic quality.

**Code snippet**:
```javascript
const post_noise = mx_noise_float(
    vec3(uv(), time.mul(0.1)).mul(sizes.width), 0.03
).mul(1.0);
```

**Gotchas/tips**: Uses `mx_noise_float` - TSL built-in function. Multiply by time for animated grain. Keep multiplier low (1.0) for subtle effect.

---

## 10. Post-Processing Composite Chain

**Source**: Section 14. Post-Processing Pipeline

**Technique**: Layered post-processing composition

**How it applies**: Shows how to combine multiple effects: AO + bloom + noise. For dark neon scene, this chain creates atmospheric glow.

**Code snippet**:
```javascript
composer.outputNode = ao_denoise.add(bloom_pass).add(post_noise);
```

**Gotchas/tips**: Order matters: AO first (darkening), then bloom (additive glow), then noise (subtle overlay). All effects are additive here - adjust as needed.

---

## 11. WebGPURenderer for TSL

**Source**: Section 2. Scene & Renderer Setup

**Technique**: WebGPU renderer setup

**How it applies**: Required for TSL-based materials and compute shaders. For WebGL fallback, use traditional Three.js materials.

**Code snippet**:
```javascript
const renderer = new THREE.WebGPURenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
```

**Gotchas/tips**: WebGPU not universally supported - check browser compatibility. Antialias true is recommended for glass edges. Use `renderAsync` with WebGPU, not `render`.

---

## 12. GPU Compute for Animation (TSL)

**Source**: Sections 6-10. Storage Buffers & Compute

**Technique**: GPU-side vertex manipulation via compute shaders

**How it applies**: For animated glass objects or pulsing lights, run physics entirely on GPU. Overkill for static scenes but useful for dynamic effects.

**Code snippet**:
```javascript
const count = geometry.attributes.position.count;
const initial_position = storage(geometry.attributes.position, "vec3", count);
const position_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);

const compute_init = Fn(() => {
    position_storage_at.element(instanceIndex).assign(initial_position.element(instanceIndex));
})().compute(count);

renderer.computeAsync(compute_init);
```

**Gotchas/tips**: Requires WebGPU. Dual-buffer pattern stores rest state for spring-back. Pre-allocate buffers once, not per frame.

---

## 13. Spring-Damper Physics

**Source**: Section 9. Core Compute Update

**Technique**: Elastic vertex animation

**How it applies**: For organic movement of glass objects or pulsing lights. Creates natural settle-back motion.

**Code snippet**:
```javascript
const u_spring = uniform(0.05);
const u_friction = uniform(0.9);

// In compute:
current_velocity.addAssign(target.sub(current_position).mul(u_spring));
current_position.addAssign(current_velocity);
current_velocity.assign(current_velocity.mul(u_friction));
```

**Gotchas/tips**: Spring 0.05 = slow response. Friction 0.9 = moderate damping. Lower friction = more oscillation. Higher spring = snappier response.

---

## 14. Position Node Override for Vertex Animation

**Source**: Section 10. Linking Compute Output to Rendering

**Technique**: Connect GPU compute to mesh vertices

**How it applies**: Makes compute shader results visible in rendering. Essential for GPU-animated geometry.

**Code snippet**:
```javascript
mesh.material.positionNode = position_storage_at.toAttribute();
```

**Gotchas/tips**: Overrides vertex positions at render time. Works with MeshStandardMaterial extended with TSL nodes.

---

## 15. Compute-Before-Render Animation Loop

**Source**: Section 11. Animation Loop

**Technique**: Proper async render loop for WebGPU

**How it applies**: Required pattern when using compute shaders. Updates GPU state before drawing.

**Code snippet**:
```javascript
function animate() {
    renderer.computeAsync(compute_update);
    renderer.renderAsync(scene, camera);
}
```

**Gotchas/tips**: Must use async versions. Compute runs first so vertex positions update before drawing.

---

## 16. Storage Buffer Pre-Allocation

**Source**: Section 6. Storage Buffer Setup

**Technique**: Pre-allocated GPU buffers

**How it applies**: Performance best practice - allocate once, update in place. Essential for many light sources or animated objects.

**Code snippet**:
```javascript
const count = geometry.attributes.position.count;
const position_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);
```

**Gotchas/tips**: Avoids per-frame allocation overhead. Count must match vertex count. Works for any per-vertex data.

---

## 17. Normal-Guided Deformation

**Source**: Section 9. Core Compute Update + Key Techniques

**Technique**: Deform along surface normals

**How it applies**: For glass objects that expand/contract or pulse, normal-guided motion appears physically plausible rather than uniform scaling.

**Code snippet**:
```javascript
const normal = normal_at.element(instanceIndex);
const disorted_pos = base_position.add(noise.mul(normal.mul(influence)));
```

**Gotchas/tips**: Use geometry normals as direction vectors. Multiply by influence factor. Combine with noise for organic variation.

---

## Performance Considerations Summary

From Section "Performance Considerations":

| Technique | Benefit |
|-----------|---------|
| Full GPU offload | No CPU-GPU transfer per frame |
| Pre-allocated buffers | Zero allocation overhead |
| Built-in noise (mx_noise) | GPU-computed procedural, no texture lookups |
| AO resolution scaling | 0.5 scale = 50% perf boost on low-end |
| MRT rendering | Single pass for color+depth+normals |

**For many small light sources**: Consider using deferred rendering techniques or light proxies. Each point light adds draw call overhead in forward rendering. TSL/WebGPU compute could potentially manage light data on GPU.# Extracted Techniques for Dark TRON-style Scene with Frosted Glass & Point Lights

## Document Overview
**Source**: Three.js Official Examples: Volumetric Lighting with TRAA and God-Rays (February 19, 2026)
**Links**: 
- https://threejs.org/examples/#webgpu_volume_lighting_traa
- https://threejs.org/examples/webgpu_lights_custom.html

---

# Techniques Extracted from Volumetric Lighting TRAA Demo

## TRAA (Temporal Reprojection Anti-Aliasing) for Volumetric Lighting

- **Source:** three/addons/tsl/display/TRAANode.js
- **Applies to:** dark scene, fog/atmosphere

**Code Snippet:**
```javascript
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** TRAA requires WebGPU renderer; uses temporal reprojection to smooth volumetric effects over multiple frames

---

## Halton Sequence for Temporal Anti-Aliasing Jitter

- **Source:** Custom implementation
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

**Gotchas/Tips:** Halton sequence provides low-discrepancy sampling; base 2 and 3 give good 2D jitter distribution; 32 samples balances quality vs performance

---

## 3D Texture for Volumetric Light/Fog

- **Source:** three/tsl (TSL)
- **Applies to:** fog/atmosphere, dark scene

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** texture3D is a TSL function for sampling 3D noise textures; requires WebGPU; works with ImprovedNoise for procedural noise

---

## Multiple Render Targets (MRT) for Velocity Buffer

- **Source:** three/tsl (TSL)
- **Applies to:** many light sources performance, soft shadows

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** MRT outputs velocity buffer needed for temporal reprojection; depthPass for pre-pass optimization

---

## Interleaved Gradient Noise for Dithering

- **Source:** three/tsl (TSL)
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
import { interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** Screen-space dithering pattern that breaks up banding in volumetric effects; works well with temporal accumulation

---

## Multiple Light Sources (Point + Spot)

- **Source:** three/webgpu
- **Applies to:** internal point lights, many light sources performance

**Code Snippet:**
```javascript
let volumetricMesh, teapot, pointLight, spotLight;
```

**Gotchas/Tips:** WebGPU renderer handles multiple lights efficiently; combine with volumetric mesh for light shafts

---

# Techniques Extracted from Volumetric Lighting TRAA Demo

## TRAA (Temporal Reprojection Anti-Aliasing) for Volumetric Lighting

- **Source:** three/addons/tsl/display/TRAANode.js
- **Applies to:** dark scene, fog/atmosphere

**Code Snippet:**
```javascript
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** TRAA requires WebGPU renderer; uses temporal reprojection to smooth volumetric effects over multiple frames

---

## Halton Sequence for Temporal Anti-Aliasing Jitter

- **Source:** Custom implementation
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

**Gotchas/Tips:** Halton sequence provides low-discrepancy sampling; base 2 and 3 give good 2D jitter distribution; 32 samples balances quality vs performance

---

## 3D Texture for Volumetric Light/Fog

- **Source:** three/tsl (TSL)
- **Applies to:** fog/atmosphere, dark scene

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** texture3D is a TSL function for sampling 3D noise textures; requires WebGPU; works with ImprovedNoise for procedural noise

---

## Multiple Render Targets (MRT) for Velocity Buffer

- **Source:** three/tsl (TSL)
- **Applies to:** many light sources performance, soft shadows

**Code Snippet:**
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** MRT outputs velocity buffer needed for temporal reprojection; depthPass for pre-pass optimization

---

## Interleaved Gradient Noise for Dithering

- **Source:** three/tsl (TSL)
- **Applies to:** soft shadows, fog/atmosphere

**Code Snippet:**
```javascript
import { interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/Tips:** Screen-space dithering pattern that breaks up banding in volumetric effects; works well with temporal accumulation

---

## Multiple Light Sources (Point + Spot)

- **Source:** three/webgpu
- **Applies to:** internal point lights, many light sources performance

**Code Snippet:**
```javascript
let volumetricMesh, teapot, pointLight, spotLight;
```

**Gotchas/Tips:** WebGPU renderer handles multiple lights efficiently; combine with volumetric mesh for light shafts

---



---

# Techniques for Dark Scene, Neon Aesthetic, and Volumetric Effects

---

## 1. Volumetric Fog/Atmosphere

**Source:** 3D Noise Texture Generation + Scattering Node sections

**Technique:** Multi-octave 3D Perlin noise volumetric scattering

**How it applies:** Creates atmospheric fog/smoke effects ideal for dark scenes where light beams become visible through haze. The multi-octave sampling provides natural-looking density variation that reacts to internal point lights.

**Code snippet:**
```javascript
function createTexture3D() {
  let i = 0;
  const size = 128;
  const data = new Uint8Array( size * size * size );
  const scale = 10;
  const perlin = new ImprovedNoise();
  const repeatFactor = 5.0;

  for ( let z = 0; z < size; z ++ ) {
    for ( let y = 0; y < size; y ++ ) {
      for ( let x = 0; x < size; x ++ ) {
        const nx = ( x / size ) * repeatFactor;
        const ny = ( y / size ) * repeatFactor;
        const nz = ( z / size ) * repeatFactor;
        const noiseValue = perlin.noise( nx * scale, ny * scale, nz * scale );
        data[ i ] = ( 128 + 128 * noiseValue );
        i ++;
      }
    }
  }

  const texture = new THREE.Data3DTexture( data, size, size, size );
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
```

**Gotchas/tips:**
- 128³ texture is memory-intensive (~2MB for single channel)
- Use `RedFormat` for single-channel to save memory
- `RepeatWrapping` allows seamless tiling for larger volumes

---

## 2. Volumetric Material for Light Shafts/Glow

**Source:** VolumeNodeMaterial Setup + Scattering Node sections

**Technique:** Additive-blended volume with multi-scale noise density

**How it applies:** Perfect for TRON neon aesthetic - internal point lights illuminate the volumetric fog, creating visible light beams and glow effects. Additive blending brightens areas where lights intersect.

**Code snippet:**
```javascript
const volumetricMaterial = new THREE.VolumeNodeMaterial();
volumetricMaterial.steps = 12;
volumetricMaterial.transparent = true;
volumetricMaterial.blending = THREE.AdditiveBlending;
```

```javascript
volumetricMaterial.scatteringNode = Fn( ( { positionRay } ) => {
  const timeScaled = vec3( shaderTime, 0, shaderTime.mul( .3 ) );

  const sampleGrain = ( scale, timeScale = 1 ) =>
    texture3D(
      noiseTexture3D,
      positionRay.add( timeScaled.mul( timeScale ) ).mul( scale ).mod( 1 ),
      0
    ).r.add( .5 );

  let density = sampleGrain( .1 );
  density = density.mul( sampleGrain( .05, 1 ) );
  density = density.mul( sampleGrain( .02, 2 ) );

  return smokeAmount.mix( 1, density );
} );
```

**Gotchas/tips:**
- `steps = 12` is a balance between quality and performance; increase for denser fog
- Additive blending works best for light-colored fog; dark smoke needs different approach
- Three octaves at different scales (0.1, 0.05, 0.02) create natural detail

---

## 3. Soft Shadows with High Penumbra

**Source:** Lighting Setup section

**Technique:** Spotlight with maximum penumbra for soft shadow edges

**How it applies:** Soft shadows are essential for dark scenes to avoid harsh, unrealistic edges. The high penumbra (1.0) creates gradual falloff that matches the TRON aesthetic's soft glow.

**Code snippet:**
```javascript
// Spotlight with color projection texture
spotLight = new THREE.SpotLight( 0xffffff, 100 );
spotLight.position.set( 2.5, 5, 2.5 );
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 0;
spotLight.map = new THREE.TextureLoader().setPath( 'textures/' ).load( 'colors.png' );
spotLight.castShadow = true;
spotLight.shadow.intensity = .98;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 15;
spotLight.shadow.focus = 1;
```

**Gotchas/tips:**
- `penumbra = 1` gives maximum softness at shadow edges
- `shadow.intensity = .98` leaves slight ambient fill, avoiding pure black shadows
- Colored projection texture (`colors.png`) can create TRON-style colored light beams
- 1024x1024 shadow map is moderate; increase for sharper soft shadows

---

## 4. Internal Point Lights for Neon Glow Effect

**Source:** Lighting Setup section

**Technique:** Animated point light with warm color and shadow casting

**How it applies:** Internal/orbiting point lights create the classic TRON glow-from-within effect. When combined with volumetric fog, the light illuminates particles creating visible halos.

**Code snippet:**
```javascript
// Warm point light (animated orbit)
pointLight = new THREE.PointLight( 0xf9bb50, 3, 100 );
pointLight.castShadow = true;
pointLight.position.set( 0, 1.4, 0 );
```

**Gotchas/tips:**
- Warm colors (0xf9bb50) create more visible volumetric scattering than cool colors
- `castShadow = true` is expensive; for many lights, consider selective shadow casting
- Low intensity (3) with short range (100) is performant for dark scenes

---

## 5. Depth Pre-Pass for Occlusion

**Source:** Multi-Pass Render Pipeline section

**Technique:** Depth pre-pass fed into volumetric material

**How it applies:** Critical for dark scenes - ensures volumetric fog properly occludes behind solid objects, preventing glow from bleeding through walls. Also improves performance by culling hidden fragments.

**Code snippet:**
```javascript
// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' )
  .toInspector( 'Depth', () => prePass.getLinearDepthNode() );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );
```

**Gotchas/tips:**
- `transparent = false` ensures only opaque objects write to depth
- Linear depth is often easier to work with than nonlinear depth
- Essential for correct fog/object interaction in multi-pass pipelines

---

## 6. TRAA for Temporal Stability

**Source:** Halton Sequence Generator + Multi-Pass Render Pipeline sections

**Technique:** Temporal Reprojection Anti-Aliasing with Halton jitter

**How it applies:** Dark scenes with volumetric effects suffer from flickering and noise. TRAA accumulates samples over frames, smoothing noise while preserving detail - critical for foggy neon scenes.

**Code snippet:**
```javascript
// Matches TRAA's 32-sample Halton jitter — optimal low-discrepancy distribution
function halton( index, base ) {
  let result = 0;
  let f = 1;
  while ( index > 0 ) {
    f /= base;
    result += f * ( index % base );
    index = Math.floor( index / base );
  }
  return result;
}

// Generate 32 offsets (base 2, 3) — same length as TRAA's internal sequence
const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

```javascript
// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

**Gotchas/tips:**
- 32 samples match TRAA's internal sequence for optimal distribution
- Requires velocity buffer for motion vectors (setMRT with velocity)
- Ghosting can occur with fast-moving objects; tune TRAA settings

---

## 7. Temporal Jitter for Volumetric Quality

**Source:** Temporal Dithering via IGN + Halton section

**Technique:** Interleaved Gradient Noise with Halton perturbation

**How it applies:** Reduces banding artifacts in volumetric fog that are especially visible in dark scenes. The temporal offset ensures noise patterns vary each frame, which TRAA then smooths.

**Code snippet:**
```javascript
temporalOffset = uniform( 0 );
temporalRotation = uniform( 0 );
shaderTime = uniform( 0 );

const temporalJitter2D = vec2( temporalOffset, temporalRotation );
volumetricMaterial.offsetNode = fract(
  interleavedGradientNoise(
    screenCoordinate.add( temporalJitter2D.mul( 100 ) )
  ).add( temporalOffset )
);
```

**Gotchas/tips:**
- IGN is fast and has good spatial distribution
- Multiplying jitter by 100 prevents visible patterns
- Must sync with TRAA's Halton sequence for proper accumulation

---

## 8. Multi-Pass Pipeline for Many Lights Performance

**Source:** Multi-Pass Render Pipeline section

**Technique:** Separate depth pre-pass with MRT for velocity

**How it applies:** For scenes with many light sources, a depth pre-pass reduces overdraw. The MRT setup enables TRAA which provides temporal supersampling without per-light cost.

**Code snippet:**
```javascript
renderPipeline = new THREE.RenderPipeline( renderer );

// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' )
  .toInspector( 'Depth', () => prePass.getLinearDepthNode() );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );

// --- Pass 2: Scene Pass (full scene + volumetric, MRT) ---
const scenePass = pass( scene, camera ).toInspector( 'Scene' );
scenePass.name = 'Scene Pass';
scenePass.setMRT( mrt( {
  output: output,
  velocity: velocity
} ) );
const scenePassColor = scenePass.getTextureNode().toInspector( 'Output' );
const scenePassVelocity = scenePass.getTextureNode( 'velocity' )
  .toInspector( 'Velocity' );

// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

**Gotchas/tips:**
- Depth pre-pass is especially beneficial for complex geometry
- MRT (Multiple Render Targets) avoids extra passes for velocity
- TRAA provides "free" supersampling for all lights in the scene

---

## 9. Animated Light Orbits for Dynamic Scenes

**Source:** Animation Loop section

**Technique:** Sinusoidal animation for light movement

**How it applies:** Moving lights through volumetric fog creates dynamic, eye-catching effects. Different frequencies on each axis create organic, non-repetitive motion paths.

**Code snippet:**
```javascript
let frameCount = 0;
let animationTime = 0;
let lastTime = performance.now();

function animate() {
  const currentTime = performance.now();
  const delta = ( currentTime - lastTime ) * 0.001;
  lastTime = currentTime;

  // Sync temporal uniforms with TRAA's Halton sequence
  const haltonIndex = frameCount % 32;
  temporalOffset.value = _haltonOffsets[ haltonIndex ][ 0 ];
  temporalRotation.value = _haltonOffsets[ haltonIndex ][ 1 ];
  frameCount ++;

  if ( params.animated ) animationTime += delta;
  shaderTime.value = animationTime;

  const scale = 2.4;
  pointLight.position.x = Math.sin( animationTime * 0.7 ) * scale;
  pointLight.position.y = Math.cos( animationTime * 0.5 ) * scale;
  pointLight.position.z = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.position.x = Math.cos( animationTime * 0.3 ) * scale;
  spotLight.lookAt( 0, 0, 0 );
  teapot.rotation.y = animationTime * 0.2;

  renderPipeline.render();
}
```

**Gotchas/tips:**
- Different frequencies (0.7, 0.5, 0.3) create Lissajous-like patterns
- `shaderTime` must be synchronized with animation for consistent fog movement
- `frameCount % 32` loops Halton sequence for infinite animation

---

## Summary: Techniques NOT Found in Context

The following techniques from the query were **not explicitly covered**:

| Technique | Notes |
|-----------|-------|
| Orthographic camera | Not mentioned; all techniques work with perspective |
| Frosted glass/translucent mesh | VolumeNodeMaterial creates volumetric effects, not surface translucency |
| Selective bloom/glow | No post-process bloom pass described; volumetric fog creates similar effect |

For a complete TRON neon aesthetic with dark scenes, combine these techniques with:
- Separate bloom post-process (e.g., UnrealBloomPass) for mesh glow
- MeshPhysicalMaterial with transmission for frosted glass
- Orthographic camera works with all techniques but may need depth calculation adjustments


---

# Extracted Techniques

Relevant to: dark scene, orthographic camera, frosted glass/translucent mesh, internal point lights, selective bloom/glow, soft shadows, fog/atmosphere, TRON neon aesthetic, many light sources performance.

---

## Temporal Reprojection Anti-Aliasing (TRAA) for Volumetrics

**Source:** TRAA for Volumetrics

**Relevant to:** fog/atmosphere, dark scene

**How it applies:** Ray-marched volumes are noisy with few steps causing banding. Jittering the ray-march offset each frame using Halton sequence + Interleaved Gradient Noise, then accumulating over 32 frames via TRAA transforms 12-step banding into smooth, high-quality fog.

**Code snippet:**
```
Halton sequence + Interleaved Gradient Noise
(accumulated over 32 frames)
```

**Gotchas/tips:** No specific gotchas mentioned in this section

---

## Depth Pre-Pass + Scene Pass + TRAA Pass

**Source:** Multi-Pass Architecture

**Relevant to:** many light sources performance

**How it applies:** Separates rendering into distinct passes: depth pre-pass for opaques only, scene pass with MRT for color and velocity, and TRAA pass for temporal blending. Transparent volumetric meshes are automatically excluded from depth pre-pass.

**Code snippet:**
```
| Pass | Purpose |
|------|---------|
| Depth Pre-Pass | Renders only opaques to get depth buffer |
| Scene Pass | Renders everything with MRT (output + velocity) |
| TRAA Pass | Uses color, depth, velocity to reproject and blend |
```

**Gotchas/tips:** Volumetric mesh must be transparent to be excluded from depth pre-pass automatically

---

## Depth-Aware Volumetric Occlusion

**Source:** Depth-Aware Volumetric Occlusion

**Relevant to:** fog/atmosphere

**How it applies:** Pre-pass depth is fed into volumetricMaterial.depthNode so ray marching terminates at opaque surfaces — volumetric fog correctly stops behind solid objects.

**Code snippet:**
```
volumetricMaterial.depthNode
```

**Gotchas/tips:** Requires depth pre-pass to be set up first

---

## Multi-Octave Noise for Density

**Source:** Multi-Octave Noise for Density

**Relevant to:** fog/atmosphere

**How it applies:** Three noise samples at different scales (0.1, 0.05, 0.02) multiplied together. Each moves at a different time scale, creating organic turbulence. The .add(.5) bias keeps values positive before multiplication.

**Code snippet:**
```
Three noise samples at scales 0.1, 0.05, 0.02 multiplied together
.add(.5) bias keeps values positive before multiplication
```

**Gotchas/tips:** The .add(.5) bias is critical to keep values positive before multiplication

---

## Three Shader Language (TSL) Node-Based Shading

**Source:** TSL (Three Shader Language) Pattern

**Relevant to:** fog/atmosphere, many light sources performance

**How it applies:** All shader logic is defined in JavaScript using TSL's node-based API (Fn, vec3, fract, texture3D, etc.) — no raw GLSL/WGSL. This is Three.js's WebGPU-era shader authoring approach.

**Code snippet:**
```
Fn, vec3, fract, texture3D
```

**Gotchas/tips:** This is Three.js's WebGPU-era approach — may not be compatible with WebGL-only setups

---



---

# Relevant Techniques Extracted

## Source
Three.js Volumetric Lighting / Fog Implementation Tips (Section 3: Practical Tips & Gotchas)

---

### TRAA Halton Sequence Synchronization

**How it applies:** Performance optimization for scenes with many light sources. Ensures temporal anti-aliasing converges correctly rather than producing artifacts.

**Code snippet:**
```javascript
// 32-element Halton array matches TRAA's 32-sample jitter cycle
```

**Gotchas/tips:** If Halton count doesn't match TRAA's internal cycle, accumulation produces artifacts instead of converging. Critical for multi-pass rendering pipelines.

---

### Volumetric Material Transparency + Additive Blending

**How it applies:** Fog/atmosphere, glow effects, TRON neon aesthetic. Creates light accumulation that brightens fog/volumes where light overlaps — physically motivated for in-scattering.

**Code snippet:**
```javascript
material.transparent = true;
material.blending = THREE.AdditiveBlending;
```

**Gotchas/tips:** Material must be transparent to be excluded from depth pre-pass but included in scene pass. Additive blending makes fog brighten with light accumulation.

---

### DPR (Device Pixel Ratio) Disable for Performance

**How it applies:** Performance optimization for many light sources. Critical when multi-pass pipeline (depth + scene + TRAA) becomes expensive.

**Code snippet:**
```javascript
// renderer.setPixelRatio( window.devicePixelRatio ) // intentionally commented out
```

**Gotchas/tips:** At retina resolutions, multi-pass pipelines become very expensive. Intentionally disabling DPR trades visual sharpness for performance.

---

### Shadow Intensity Below 1.0 for Soft Fill

**How it applies:** Soft shadows, dark scenes. Prevents fully black shadows that look unrealistic in volumetric scenes where ambient scattering provides fill light.

**Code snippet:**
```javascript
light.shadow.intensity = 0.98;
```

**Gotchas/tips:** Using 1.0 creates fully black shadows. In volumetric scenes, ambient scattering would always provide some fill light, so 0.98 is more realistic.

---

### Spotlight Projection Map for Colored Light Cones

**How it applies:** Fog/atmosphere, internal point lights. Creates visually interesting colored volumetric light beams through fog.

**Code snippet:**
```javascript
spotlight.map = new THREE.TextureLoader().load('colors.png');
```

**Gotchas/tips:** A color texture used as spotlight projection map creates colored volumetric light cones — simple way to get visually interesting beams.

---

### Smoke Amount Noise Mix Logic

**How it applies:** Fog/atmosphere variation. Controls uniformity vs. noise contrast in volumetric effects.

**Code snippet:**
```javascript
smokeAmount.mix(1, density)
```

**Gotchas/tips:** When smokeAmount is 0, returns 1 (uniform fog with no noise). When high, noise contrast increases. Opposite of typical lerp — mixes between 'no noise' and 'full noise'.

---



---

# Extracted Techniques from Performance Considerations

> **Note:** The provided context is only Section 4 (Performance Considerations) of a larger document. It focuses on volumetric rendering and optimization techniques. Many requested techniques (orthographic camera, frosted glass, selective bloom, soft shadows, neon aesthetics) are not covered in this fragment.

---

## Fog/Atmosphere & Volumetric Lighting

### Source
Section 4: Performance Considerations - Ray Marching

### Technique: Ray Marched Volumetric Scattering
**How it applies:** Core technique for fog/atmosphere effects and volumetric lighting from internal point lights. Ray marching through a 3D texture creates realistic light scattering in dark scenes.

**Code snippet (verbatim):**
```
Ray march steps | Default 12, adjustable 2–16 via GUI. Fewer steps = faster but more banding (TRAA compensates).
```

**Gotchas/tips:**
- Fewer steps = faster but introduces banding artifacts
- TRAA can compensate for banding with fewer steps
- Trade quality vs performance based on scene complexity

---

### Source
Section 4: Performance Considerations - Texture Optimization

### Technique: 3D Noise Texture Caching
**How it applies:** Optimizes volumetric fog/atmosphere sampling performance, critical for many light sources where texture reads compound quickly.

**Code snippet (verbatim):**
```
3D texture size | 128^3 = 2MB (single channel). Small enough to fit in texture cache for repeated sampling.
```

**Gotchas/tips:**
- Keep 3D textures small (128³) to fit in texture cache
- Single channel reduces memory bandwidth
- Critical for performance when sampling multiple times per ray step

---

### Source
Section 4: Performance Considerations - Shader Bottlenecks

### Technique: Texture Sample Minimization
**How it applies:** For many light sources, each additional sample compounds cost. Understanding the math helps optimize volumetric lighting.

**Code snippet (verbatim):**
```
3 texture3D samples per fragment | The scattering node samples the 3D texture 3 times per ray step. At 12 steps, that's 36 texture reads per pixel — the main shader bottleneck.
```

**Gotchas/tips:**
- 36 texture reads per pixel is expensive
- Each additional ray step multiplies texture reads
- Consider reducing samples or steps for many light source scenes

---

## Dark Scene Optimization

### Source
Section 4: Performance Considerations - Depth Optimization

### Technique: Depth Pre-pass for Volumetric Culling
**How it applies:** In dark scenes with volumetric effects, avoid wasting computation behind opaque geometry. Critical for performance when using fog/atmosphere.

**Code snippet (verbatim):**
```
Depth pre-pass for early termination | Volumetric rays stop at opaque surfaces, avoiding wasted march steps behind geometry.
```

**Gotchas/tips:**
- Render depth pre-pass before volumetrics
- Rays terminate at opaque surfaces
- Significant savings in complex geometry scenes

---

### Source
Section 4: Performance Considerations - Resolution Strategy

### Technique: DPR (Device Pixel Ratio) Optimization
**How it applies:** Dark scenes with volumetric effects are GPU-intensive. Disabling retina rendering can make multi-pass pipelines viable.

**Code snippet (verbatim):**
```
DPR disabled | Rendering at 1x device pixels rather than 2x/3x retina. The multi-pass pipeline (3 full-screen passes) makes high DPR very costly.
```

**Gotchas/tips:**
- Multi-pass pipelines (bloom, volumetrics, post-processing) multiply DPR cost
- 1x DPR = 1/4 the pixels of 2x retina, 1/9 of 3x
- Trade visual sharpness for performance in heavy scenes

---

## Temporal Anti-Aliasing (TRAA)

### Source
Section 4: Performance Considerations - Quality vs Performance

### Technique: TRAA for Low Step Count Quality
**How it applies:** Enables smooth volumetric results with minimal ray march steps - essential for real-time performance with fog/atmosphere.

**Code snippet (verbatim):**
```
TRAA vs raw quality | TRAA lets you use very few ray-march steps (even 2–4) while still getting smooth results through temporal accumulation. The trade-off is ghosting on fast motion.
```

**Gotchas/tips:**
- Can reduce ray steps from 12 to 2-4 with TRAA
- Ghosting on fast motion is the trade-off
- Excellent for static or slow-moving dark scenes

---

### Source
Section 4: Performance Considerations - Static Scene Optimization

### Technique: Animation Freeze for Convergence
**How it applies:** For static dark scenes or product renders, freezing animation lets TRAA fully converge for maximum quality.

**Code snippet (verbatim):**
```
Animation toggle | The `animated` flag can freeze animation time, which in a production context would let TRAA fully converge to a clean image for static scenes.
```

**Gotchas/tips:**
- Use `animated` flag to freeze time
- Allows TRAA to accumulate clean samples
- Perfect for static shots or product visualization

---

## Multi-Pass Pipeline Optimization

### Source
Section 4: Performance Considerations - Render Targets

### Technique: MRT (Multiple Render Targets)
**How it applies:** Reduces passes for effects requiring multiple outputs (velocity buffer for TRAA, depth for volumetrics). Essential for complex lighting pipelines.

**Code snippet (verbatim):**
```
MRT (Multiple Render Targets) | The scene pass writes color + velocity in a single draw call instead of two separate passes — saves an entire scene traversal.
```

**Gotchas/tips:**
- Write color + velocity simultaneously
- Saves one full scene traversal
- Reduces draw calls in multi-pass pipelines

---

## Summary: Techniques NOT Found in This Fragment

The following requested techniques are **not covered** in Section 4:
- ❌ Orthographic camera setup
- ❌ Frosted glass/translucent mesh materials  
- ❌ Selective bloom/glow
- ❌ Soft shadows
- ❌ TRON neon aesthetic specifics

These would likely be in other sections of the full document (Sections 1-3 or 5+).
# Extracted Techniques for Dark Neon/Glass Aesthetic

## 1. Internal Point Lights Inside Mesh Primitives

**Source**: Sun Component (Sun.js)

**Technique**: Embed a point light *inside* a mesh by grouping them together with the light positioned at the mesh's local origin.

**How it applies**: For frosted glass primitives with internal glow, wrap each translucent mesh around a pointLight. The light emanates outward through the glass material onto surrounding surfaces.

**Code snippet**:
```javascript
const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` *inside* the parent group — centered within the mesh
- `distance` parameter controls how far light reaches (25 units here)
- For TRON aesthetic: use neon colors like `#00ffff`, `#ff00ff`, `#00ff00`
- For frosted glass: combine with transparent/translucent material on the outer mesh

---

## 2. Dynamic Light Intensity Animation (Flashing/Pulsing)

**Source**: Storm Component with Lightning

**Technique**: Use refs to animate point light intensity dynamically without triggering React re-renders. Apply random probability for natural variation.

**How it applies**: Create pulsing neon glow effects, random flicker, or synchronized lighting animations on your glass primitives.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame((state) => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        const randomX = (Math.random() - 0.5) * 10;
        lightningLightRef.current.position.x = randomX;
        lightningLightRef.current.intensity = 90;

        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**Gotchas/tips**:
- `lightningActive.current` ref prevents animation stacking/cooldown issues
- `Math.random() < 0.003` per frame ≈ natural timing without hardcoded intervals
- For TRON pulse: use sine wave `Math.sin(state.clock.elapsedTime * speed) * amplitude + base`
- `castShadow` enabled on point light — essential for soft shadows on ground plane
- `decay={0.8}` creates realistic light falloff through glass

---

## 3. Instanced Mesh for Performance (Many Light Sources)

**Source**: Rain Particle System (Instanced Rendering)

**Technique**: Use `instancedMesh` with a single reusable `THREE.Object3D()` dummy to render thousands of objects in one GPU draw call.

**How it applies**: If you have many small glowing primitives (e.g., floating neon cubes, particles with glow), use instancing. Note: each instance cannot have its own light source, but you can use emissive materials + bloom as a proxy.

**Code snippet**:
```javascript
const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) {
        particle.y = 20;
      }
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- Single `THREE.Object3D()` dummy avoids garbage collection overhead
- `instanceMatrix.needsUpdate = true` required after updating positions
- For TRON aesthetic: use `meshBasicMaterial` with neon colors + bloom
- Particle recycling (reset when below threshold) prevents infinite allocation
- **Cannot attach individual point lights per instance** — use emissive + bloom instead

---

## 4. Bloom Post-Processing for Selective Glow

**Source**: PostProcessingEffects (Lens Flare System)

**Technique**: Apply bloom effect with threshold to make only bright/emissive objects glow.

**How it applies**: Use `threshold` parameter to control which objects bloom. Set emissive materials on your glass primitives to exceed threshold while dark background stays dark.

**Code snippet**:
```javascript
const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.00} glareSize={1.68}
        starPoints={2} animated={false} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} aditionalStreaks={true} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` — only objects with brightness > 0.9 bloom
- For selective glow: set emissive materials on target objects, keep others dark
- `intensity={0.3}` controls glow strength — adjust for subtle vs. intense
- Combine with `meshBasicMaterial` or `emissive` property for full control
- For TRON look: high threshold + neon emissive materials

---

## 5. Transparent/Translucent Materials with Opacity

**Source**: Rain Particle System

**Technique**: Use `transparent` and `opacity` properties on mesh materials for frosted/semi-transparent appearance.

**How it applies**: For frosted glass primitives, combine transparency with internal point lights. Light will scatter through the semi-transparent surface.

**Code snippet**:
```javascript
<meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
```

**Gotchas/tips**:
- `transparent={true}` required for opacity < 1
- For frosted glass: consider `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Lower opacity = more light passes through but mesh becomes less visible
- Balance opacity with internal light intensity for desired glow effect

---

## 6. Night/Dark Scene Background Handling

**Source**: Dynamic Sky Configuration + Stars

**Technique**: Skip the Sky component entirely at night for a pure black background, or add subtle star field for atmosphere.

**How it applies**: For dark TRON aesthetic, skip sky entirely. Black background makes neon lights pop.

**Code snippet**:
```javascript
{timeOfDay !== 'night' && (
  <Sky
    sunPosition={(() => {
      if (timeOfDay === 'dawn') return [100, -5, 100];
      if (timeOfDay === 'dusk') return [-100, -5, 100];
      return [100, 20, 100]; // day
    })()}
    turbidity={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 8 : 2}
    inclination={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.6 : 0.9}
  />
)}

{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
```

**Gotchas/tips**:
- Skip Sky component for pure black background
- `Stars` component adds subtle atmosphere without breaking dark aesthetic
- For TRON: pure black background, no stars — let neon be the only light
- Scene `background` can be set to `#000000` or `new THREE.Color(0x000000)`

---

## 7. Point Light Shadow Configuration

**Source**: Storm Component with Lightning

**Technique**: Enable `castShadow` on point lights for soft shadows on ground plane.

**How it applies**: Light emanating from glass primitives will cast soft shadows on the dark ground plane.

**Code snippet**:
```javascript
<pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
  intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
```

**Gotchas/tips**:
- `castShadow` must be enabled on the light
- Ground plane mesh must also have `receiveShadow={true}`
- For soft shadows: configure shadow map settings on light:
  ```javascript
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.radius = 4; // soft shadow blur
  ```
- Performance: shadows are expensive with many lights — consider limiting shadow-casting lights

---

## 8. Time-Based Animation with Unique Offsets

**Source**: Snow with Physics-Based Tumbling

**Technique**: Use `state.clock.elapsedTime + i` to create unique animation paths per object.

**How it applies**: Each glass primitive can have slightly different glow pulse timing, creating organic variation in your TRON scene.

**Code snippet**:
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;

    dummy.position.set(particle.x, particle.y, particle.z);
    dummy.rotation.x = state.clock.elapsedTime * 2;
    dummy.rotation.y = state.clock.elapsedTime * 3;
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(i, dummy.matrix);
  });
  meshRef.current.instanceMatrix.needsUpdate = true;
});
```

**Gotchas/tips**:
- The `+ i` offset creates phase difference per object
- For glow pulse: `intensity = baseIntensity + Math.sin(state.clock.elapsedTime + i * offset) * amplitude`
- Creates organic, non-uniform animation across many objects

---

## 9. Smooth Blend/Transition Animation

**Source**: Forecast Portals with MeshPortalMaterial

**Technique**: Use `THREE.MathUtils.lerp` for smooth animated transitions between values.

**How it applies**: Smoothly animate light intensity, opacity, or bloom intensity when toggling effects.

**Code snippet**:
```javascript
useFrame(() => {
  if (materialRef.current) {
    const targetBlend = isFullscreen ? 1 : 0;
    materialRef.current.blend = THREE.MathUtils.lerp(
      materialRef.current.blend || 0, targetBlend, 0.1
    );
  }
});
```

**Gotchas/tips**:
- `lerp(current, target, alpha)` — alpha controls interpolation speed (0.1 = smooth, 0.5 = snappy)
- Use for smooth light intensity transitions, fade in/out effects
- For glass glow: animate opacity or light intensity on hover/interaction

---

## 10. Portal/Render-to-Texture for Glass Effects

**Source**: Forecast Portals with MeshPortalMaterial

**Technique**: Render a 3D scene to a texture displayed on a mesh surface using `MeshPortalMaterial`.

**How it applies**: Create glass panels that show internal content, or reflective/refractive-like effects without expensive real-time raytracing.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, index, onEnter }) => {
  const materialRef = useRef();

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} blur={0} resolution={256} worldUnits={false}>
          <color attach="background" args={['#87CEEB']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <WeatherVisualization weatherData={portalWeatherData} isLoading={false} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `resolution={256}` controls render quality — lower for performance
- `blur={0}` can be increased for frosted glass effect
- `roundedPlaneGeometry` from maath library creates smooth corners
- Can render internal scene *inside* glass primitive

---

## 11. Ref-Based State for Performance

**Source**: Key Techniques & Patterns table + Lightning implementation

**Technique**: Use `useRef` for values that change every frame to avoid triggering React re-renders.

**How it applies**: Essential for animating many lights/primitives — React state updates are too slow for per-frame animation.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame((state) => {
  if (lightningLightRef.current) {
    lightningLightRef.current.intensity = calculatedIntensity;
  }
});
```

**Gotchas/tips**:
- Never use `useState` for values updated in `useFrame`
- Refs allow direct DOM/Three.js object mutation without React overhead
- Pattern: `ref.current.property = value` inside `useFrame`

---

## 12. Conditional Component Rendering for Performance

**Source**: Conditional Component Rendering + Performance table

**Technique**: Only render components that are currently visible/needed.

**How it applies**: Disable expensive effects (particles, shadows, bloom) when not in view or based on scene state.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) {
      return (
        <>
          {isNight ? <Moon /> : <Sun />}
          <Clouds intensity={0.5} speed={0.1} />
        </>
      );
    }
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return (
      <>
        <Clouds intensity={0.8} speed={0.15} />
        <Rain count={800} />
      </>
    );
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Sunny days skip all particle systems entirely — massive savings
- Use ternary operators and conditional returns for clean logic
- For many lights: conditionally render based on distance from camera

---

## 13. Particle Recycling for Infinite Effect

**Source**: Practical Tips & Gotchas

**Technique**: When particles leave bounds, reset them to start position instead of creating new objects.

**How it applies**: For ambient floating particles around glass primitives, recycle them to avoid memory allocation/GC.

**Code snippet**:
```javascript
if (particle.y < -1) {
  particle.y = 20;
  particle.x = (Math.random() - 0.5) * 20;
}
```

**Gotchas/tips**:
- Prevents memory leaks from continuous allocation
- Re-randomize position on reset for variation
- Use object pooling pattern for complex objects

---

## Performance Summary Table

| Optimization | Main Scene | Portal Mode | Savings |
|-------------|-----------|-------------|---------|
| Rain particles | 800 | 100 | 87.5% |
| Snow particles | 400 | 50 | 87.5% |
| Cloud count | 6+ (60-80 segments) | 2 (35-40 segments) | ~67% |
| Sky component | Full atmospheric scattering | Skipped at night | 100% at night |

**For many small light sources**: Use emissive materials + bloom instead of actual point lights for instanced meshes. Reserve real point lights for primary light sources.

---

## Direct Recommendations for Target Aesthetic

1. **Dark scene**: Skip Sky, set `background="#000000"`, optional Stars for subtle atmosphere
2. **Frosted glass with internal light**: Group mesh + pointLight, use `MeshPhysicalMaterial` with `transmission`, `roughness`, `thickness`
3. **Light emanating onto ground**: Enable `castShadow` on point lights, `receiveShadow` on ground plane, configure shadow softness
4. **Selective bloom**: Set `threshold={0.8-0.9}`, use emissive materials on glow targets, keep background dark
5. **Many light sources**: Use emissive materials + bloom for instanced objects, real point lights only for key sources
6. **TRON neon aesthetic**: Neon colors (`#00ffff`, `#ff00ff`, `#00ff00`), high bloom intensity, pure black background
7. **Animation**: Ref-based state, `useFrame` with `elapsedTime + i` offsets for variation# Extracted Techniques for Dark Neon/Glass Aesthetic

## 1. Internal Point Lights Inside Mesh Primitives

**Source**: Sun Component (Sun.js)

**Technique**: Embed a point light *inside* a mesh by grouping them together with the light positioned at the mesh's local origin.

**How it applies**: For frosted glass primitives with internal glow, wrap each translucent mesh around a pointLight. The light emanates outward through the glass material onto surrounding surfaces.

**Code snippet**:
```javascript
const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

**Gotchas/tips**:
- Point light is positioned at `[0, 0, 0]` *inside* the parent group — centered within the mesh
- `distance` parameter controls how far light reaches (25 units here)
- For TRON aesthetic: use neon colors like `#00ffff`, `#ff00ff`, `#00ff00`
- For frosted glass: combine with transparent/translucent material on the outer mesh

---

## 2. Dynamic Light Intensity Animation (Flashing/Pulsing)

**Source**: Storm Component with Lightning

**Technique**: Use refs to animate point light intensity dynamically without triggering React re-renders. Apply random probability for natural variation.

**How it applies**: Create pulsing neon glow effects, random flicker, or synchronized lighting animations on your glass primitives.

**Code snippet**:
```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame((state) => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        const randomX = (Math.random() - 0.5) * 10;
        lightningLightRef.current.position.x = randomX;
        lightningLightRef.current.intensity = 90;

        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

**Gotchas/tips**:
- `lightningActive.current` ref prevents animation stacking/cooldown issues
- `Math.random() < 0.003` per frame ≈ natural timing without hardcoded intervals
- For TRON pulse: use sine wave `Math.sin(state.clock.elapsedTime * speed) * amplitude + base`
- `castShadow` enabled on point light — essential for soft shadows on ground plane
- `decay={0.8}` creates realistic light falloff through glass

---

## 3. Instanced Mesh for Performance (Many Light Sources)

**Source**: Rain Particle System (Instanced Rendering)

**Technique**: Use `instancedMesh` with a single reusable `THREE.Object3D()` dummy to render thousands of objects in one GPU draw call.

**How it applies**: If you have many small glowing primitives (e.g., floating neon cubes, particles with glow), use instancing. Note: each instance cannot have its own light source, but you can use emissive materials + bloom as a proxy.

**Code snippet**:
```javascript
const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) {
        particle.y = 20;
      }
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

**Gotchas/tips**:
- Single `THREE.Object3D()` dummy avoids garbage collection overhead
- `instanceMatrix.needsUpdate = true` required after updating positions
- For TRON aesthetic: use `meshBasicMaterial` with neon colors + bloom
- Particle recycling (reset when below threshold) prevents infinite allocation
- **Cannot attach individual point lights per instance** — use emissive + bloom instead

---

## 4. Bloom Post-Processing for Selective Glow

**Source**: PostProcessingEffects (Lens Flare System)

**Technique**: Apply bloom effect with threshold to make only bright/emissive objects glow.

**How it applies**: Use `threshold` parameter to control which objects bloom. Set emissive materials on your glass primitives to exceed threshold while dark background stays dark.

**Code snippet**:
```javascript
const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.00} glareSize={1.68}
        starPoints={2} animated={false} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} aditionalStreaks={true} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

**Gotchas/tips**:
- `threshold={0.9}` — only objects with brightness > 0.9 bloom
- For selective glow: set emissive materials on target objects, keep others dark
- `intensity={0.3}` controls glow strength — adjust for subtle vs. intense
- Combine with `meshBasicMaterial` or `emissive` property for full control
- For TRON look: high threshold + neon emissive materials

---

## 5. Transparent/Translucent Materials with Opacity

**Source**: Rain Particle System

**Technique**: Use `transparent` and `opacity` properties on mesh materials for frosted/semi-transparent appearance.

**How it applies**: For frosted glass primitives, combine transparency with internal point lights. Light will scatter through the semi-transparent surface.

**Code snippet**:
```javascript
<meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
```

**Gotchas/tips**:
- `transparent={true}` required for opacity < 1
- For frosted glass: consider `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Lower opacity = more light passes through but mesh becomes less visible
- Balance opacity with internal light intensity for desired glow effect

---

## 6. Night/Dark Scene Background Handling

**Source**: Dynamic Sky Configuration + Stars

**Technique**: Skip the Sky component entirely at night for a pure black background, or add subtle star field for atmosphere.

**How it applies**: For dark TRON aesthetic, skip sky entirely. Black background makes neon lights pop.

**Code snippet**:
```javascript
{timeOfDay !== 'night' && (
  <Sky
    sunPosition={(() => {
      if (timeOfDay === 'dawn') return [100, -5, 100];
      if (timeOfDay === 'dusk') return [-100, -5, 100];
      return [100, 20, 100]; // day
    })()}
    turbidity={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 8 : 2}
    inclination={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.6 : 0.9}
  />
)}

{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
```

**Gotchas/tips**:
- Skip Sky component for pure black background
- `Stars` component adds subtle atmosphere without breaking dark aesthetic
- For TRON: pure black background, no stars — let neon be the only light
- Scene `background` can be set to `#000000` or `new THREE.Color(0x000000)`

---

## 7. Point Light Shadow Configuration

**Source**: Storm Component with Lightning

**Technique**: Enable `castShadow` on point lights for soft shadows on ground plane.

**How it applies**: Light emanating from glass primitives will cast soft shadows on the dark ground plane.

**Code snippet**:
```javascript
<pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
  intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
```

**Gotchas/tips**:
- `castShadow` must be enabled on the light
- Ground plane mesh must also have `receiveShadow={true}`
- For soft shadows: configure shadow map settings on light:
  ```javascript
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.radius = 4; // soft shadow blur
  ```
- Performance: shadows are expensive with many lights — consider limiting shadow-casting lights

---

## 8. Time-Based Animation with Unique Offsets

**Source**: Snow with Physics-Based Tumbling

**Technique**: Use `state.clock.elapsedTime + i` to create unique animation paths per object.

**How it applies**: Each glass primitive can have slightly different glow pulse timing, creating organic variation in your TRON scene.

**Code snippet**:
```javascript
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;

    dummy.position.set(particle.x, particle.y, particle.z);
    dummy.rotation.x = state.clock.elapsedTime * 2;
    dummy.rotation.y = state.clock.elapsedTime * 3;
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(i, dummy.matrix);
  });
  meshRef.current.instanceMatrix.needsUpdate = true;
});
```

**Gotchas/tips**:
- The `+ i` offset creates phase difference per object
- For glow pulse: `intensity = baseIntensity + Math.sin(state.clock.elapsedTime + i * offset) * amplitude`
- Creates organic, non-uniform animation across many objects

---

## 9. Smooth Blend/Transition Animation

**Source**: Forecast Portals with MeshPortalMaterial

**Technique**: Use `THREE.MathUtils.lerp` for smooth animated transitions between values.

**How it applies**: Smoothly animate light intensity, opacity, or bloom intensity when toggling effects.

**Code snippet**:
```javascript
useFrame(() => {
  if (materialRef.current) {
    const targetBlend = isFullscreen ? 1 : 0;
    materialRef.current.blend = THREE.MathUtils.lerp(
      materialRef.current.blend || 0, targetBlend, 0.1
    );
  }
});
```

**Gotchas/tips**:
- `lerp(current, target, alpha)` — alpha controls interpolation speed (0.1 = smooth, 0.5 = snappy)
- Use for smooth light intensity transitions, fade in/out effects
- For glass glow: animate opacity or light intensity on hover/interaction

---

## 10. Portal/Render-to-Texture for Glass Effects

**Source**: Forecast Portals with MeshPortalMaterial

**Technique**: Render a 3D scene to a texture displayed on a mesh surface using `MeshPortalMaterial`.

**How it applies**: Create glass panels that show internal content, or reflective/refractive-like effects without expensive real-time raytracing.

**Code snippet**:
```javascript
const ForecastPortal = ({ position, dayData, index, onEnter }) => {
  const materialRef = useRef();

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} blur={0} resolution={256} worldUnits={false}>
          <color attach="background" args={['#87CEEB']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <WeatherVisualization weatherData={portalWeatherData} isLoading={false} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
};
```

**Gotchas/tips**:
- `resolution={256}` controls render quality — lower for performance
- `blur={0}` can be increased for frosted glass effect
- `roundedPlaneGeometry` from maath library creates smooth corners
- Can render internal scene *inside* glass primitive

---

## 11. Ref-Based State for Performance

**Source**: Key Techniques & Patterns table + Lightning implementation

**Technique**: Use `useRef` for values that change every frame to avoid triggering React re-renders.

**How it applies**: Essential for animating many lights/primitives — React state updates are too slow for per-frame animation.

**Code snippet**:
```javascript
const lightningLightRef = useRef();
const lightningActive = useRef(false);

useFrame((state) => {
  if (lightningLightRef.current) {
    lightningLightRef.current.intensity = calculatedIntensity;
  }
});
```

**Gotchas/tips**:
- Never use `useState` for values updated in `useFrame`
- Refs allow direct DOM/Three.js object mutation without React overhead
- Pattern: `ref.current.property = value` inside `useFrame`

---

## 12. Conditional Component Rendering for Performance

**Source**: Conditional Component Rendering + Performance table

**Technique**: Only render components that are currently visible/needed.

**How it applies**: Disable expensive effects (particles, shadows, bloom) when not in view or based on scene state.

**Code snippet**:
```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) {
      return (
        <>
          {isNight ? <Moon /> : <Sun />}
          <Clouds intensity={0.5} speed={0.1} />
        </>
      );
    }
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return (
      <>
        <Clouds intensity={0.8} speed={0.15} />
        <Rain count={800} />
      </>
    );
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

**Gotchas/tips**:
- Sunny days skip all particle systems entirely — massive savings
- Use ternary operators and conditional returns for clean logic
- For many lights: conditionally render based on distance from camera

---

## 13. Particle Recycling for Infinite Effect

**Source**: Practical Tips & Gotchas

**Technique**: When particles leave bounds, reset them to start position instead of creating new objects.

**How it applies**: For ambient floating particles around glass primitives, recycle them to avoid memory allocation/GC.

**Code snippet**:
```javascript
if (particle.y < -1) {
  particle.y = 20;
  particle.x = (Math.random() - 0.5) * 20;
}
```

**Gotchas/tips**:
- Prevents memory leaks from continuous allocation
- Re-randomize position on reset for variation
- Use object pooling pattern for complex objects

---

## Performance Summary Table

| Optimization | Main Scene | Portal Mode | Savings |
|-------------|-----------|-------------|---------|
| Rain particles | 800 | 100 | 87.5% |
| Snow particles | 400 | 50 | 87.5% |
| Cloud count | 6+ (60-80 segments) | 2 (35-40 segments) | ~67% |
| Sky component | Full atmospheric scattering | Skipped at night | 100% at night |

**For many small light sources**: Use emissive materials + bloom instead of actual point lights for instanced meshes. Reserve real point lights for primary light sources.

---

## Direct Recommendations for Target Aesthetic

1. **Dark scene**: Skip Sky, set `background="#000000"`, optional Stars for subtle atmosphere
2. **Frosted glass with internal light**: Group mesh + pointLight, use `MeshPhysicalMaterial` with `transmission`, `roughness`, `thickness`
3. **Light emanating onto ground**: Enable `castShadow` on point lights, `receiveShadow` on ground plane, configure shadow softness
4. **Selective bloom**: Set `threshold={0.8-0.9}`, use emissive materials on glow targets, keep background dark
5. **Many light sources**: Use emissive materials + bloom for instanced objects, real point lights only for key sources
6. **TRON neon aesthetic**: Neon colors (`#00ffff`, `#ff00ff`, `#00ff00`), high bloom intensity, pure black background
7. **Animation**: Ref-based state, `useFrame` with `elapsedTime + i` offsets for variation