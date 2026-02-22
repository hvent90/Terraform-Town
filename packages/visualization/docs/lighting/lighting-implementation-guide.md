# TECHNIQUE EXTRACTION: Three.js Lighting for TRON-like Dark Scene

## Target Scene Requirements
- Dark scene with orthographic camera
- Frosted glass / translucent mesh primitives with internal point lights
- Light emanating outward through glass onto a dark ground plane
- Selective bloom/glow on specific objects
- Soft shadows, subtle fog/atmosphere
- TRON-like minimal neon aesthetic
- Performance considerations for many small light sources

---

## PointLight for Internal Glow

**Relevance to Target Scene**: DIRECTLY applicable - PointLight radiates from a point in all directions, perfect for placing inside frosted glass primitives to create internal glow effect

**Code Snippet**:
```javascript
// From Three-Point Lighting Setup:
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
```

**Gotchas/Tips**:
- PointLight is described as 'radiates from a point in all directions (light bulb)' - ideal for internal mesh lights
- Combine with translucent/frosted material for light emanation effect
- Performance consideration: many small PointLights may impact performance

---

## Cinematic Night Scene Setup

**Relevance to Target Scene**: DIRECTLY applicable - target scene is dark with TRON-like neon aesthetic

**Code Snippet**:
```javascript
// Cinematic night scenes: low-intensity ambient + cool directional light
// (conceptual from the article - no explicit code provided)
```

**Gotchas/Tips**:
- Use low-intensity ambient light for base illumination in dark scenes
- Pair with cool directional light for TRON-like atmosphere
- Creates mood without overpowering neon/glow effects

---

## Color Temperature for Dramatic Mood

**Relevance to Target Scene**: HIGHLY relevant - TRON aesthetic uses cool tones (blues, cyans) for dramatic neon effect

**Code Snippet**:
```javascript
// Color temperature: warm tones (amber) for cozy, cool tones (blue) for dramatic
```

**Gotchas/Tips**:
- Cool tones (blue) create dramatic atmosphere - perfect for TRON aesthetic
- Can tint PointLights inside glass primitives with cool colors (cyan, blue, purple)
- Color contrast between warm internal lights and cool ambient creates visual interest

---

## Rim Light for Object Separation

**Relevance to Target Scene**: APPLICABLE - rim lighting separates subjects from dark backgrounds in TRON-style scenes

**Code Snippet**:
```javascript
// Rim light (separates subject from background)
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
```

**Gotchas/Tips**:
- Rim light 'separates subject from background' - critical for dark scenes
- Position behind/below objects to create edge glow on glass primitives
- For TRON aesthetic: use colored rim lights matching neon palette

---

## Performance Optimization for Multiple Light Sources

**Relevance to Target Scene**: CRITICAL - target scene has 'many small light sources' - need performance strategies

**Code Snippet**:
```javascript
// Performance Tips from article:
// - Use cheap lights (AmbientLight, HemisphereLight) for base illumination
// - Minimize shadow-casting lights — each adds a render pass
```

**Gotchas/Tips**:
- AmbientLight and HemisphereLight are 'cheap' - use for base illumination
- Each shadow-casting light adds a render pass - minimize these
- For many internal PointLights: consider disabling shadows on most
- Light helpers during development help with positioning (remove for production)

---

## RectAreaLight for Panel/Neon Glow

**Relevance to Target Scene**: POTENTIALLY useful - rectangular emitter could create TRON-like panel lights or glowing surfaces

**Code Snippet**:
```javascript
// RectAreaLight — rectangular emitter for window/panel light
```

**Gotchas/Tips**:
- Creates rectangular light source - could simulate glowing panels in TRON aesthetic
- Good for flat emissive surfaces
- No explicit code provided in this document

---

## AmbientLight for Dark Scene Base Illumination

**Relevance to Target Scene**: APPLICABLE - provides minimal base illumination without overpowering neon effects

**Code Snippet**:
```javascript
// Fill light (softens shadows) - can be adapted for dark scenes
const fillLight = new THREE.AmbientLight(0x404040, 0.5);
```

**Gotchas/Tips**:
- AmbientLight 'provides overall base illumination without direction; no shadows'
- For dark TRON scene: use very low intensity (0.1-0.2) with cool color tint
- Does NOT cast shadows - good for performance
- Can use dark gray or blue-tinted color for night scene base

---

## SpotLight for Dramatic Focused Effects

**Relevance to Target Scene**: POTENTIALLY useful - could create focused glow pools under glass primitives

**Code Snippet**:
```javascript
// Key light (main source)
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);
```

**Gotchas/Tips**:
- SpotLight has 'cone-shaped beam with angle/penumbra control'
- Could be positioned above/below glass primitives to create focused light pools on ground plane
- Penumbra control allows soft edge transitions - useful for soft shadows
- Performance impact: spotlights with shadows are expensive

---

## SKIPPED TECHNIQUES (Not Relevant to Target Scene)

| Technique | Reason for Skipping |
|-----------|---------------------|
| DirectionalLight | Sun-like parallel rays designed for outdoor daylight scenes; target scene is dark/indoor with neon aesthetic |
| HemisphereLight | Sky-to-ground gradient for "natural outdoor lighting"; target scene is dark TRON environment |
## EXTRACTED TECHNIQUES FOR YOUR THREE.JS SCENE

---

### ✅ 1. PointLight — Internal Lights for Frosted Glass Meshes
**How it applies**: Use PointLights inside translucent geometry to create glowing frosted glass effect. The omnidirectional radiation simulates light diffusing through glass.

**Code snippet (verbatim)**:
```javascript
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/Tips**:
- PointLights are expensive — limit count for performance
- Intensity falloff is automatic with distance
- No shadows mentioned in context for PointLight

---

### ✅ 2. RectAreaLight — TRON-like Neon Panels
**How it applies**: Rectangular emitters perfect for neon strips/panels in TRON aesthetic. Creates soft directional light from a surface.

**Code snippet (verbatim)**:
*(No code example provided in source — only listed as a light type)*

**Gotchas/Tips**:
- Requires `RectAreaLightUniformsLib` import (not mentioned in source)
- Does NOT cast shadows
- Good for screen/panel glow effects

---

### ✅ 3. Three-Point Lighting Setup — Cinematic Mood
**How it applies**: Key/fill/rim combo for dramatic dark scenes. Rim light separates subjects from dark backgrounds.

**Code snippet (verbatim)**:
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

**Gotchas/Tips**:
- Keep fill light low intensity for dark scenes
- Rim light placement behind subject for edge glow

---

### ✅ 4. Color Temperature for Atmosphere
**How it applies**: Cool blue tones create TRON/cyberpunk aesthetic. Warm amber for contrast accents.

**Code snippet (verbatim)**:
*(No code provided — concept only)*
> "Color temperature: warm tones (amber) for cozy, cool tones (blue) for dramatic"

**Gotchas/Tips**:
- Use cool tones (blue-ish: `0x6699ff`) for TRON feel
- Combine with low-intensity ambient

---

### ✅ 5. Cinematic Night Scene Setup
**How it applies**: Foundation for dark scenes with low-intensity ambient + cool directional light.

**Code snippet (verbatim)**:
*(Concept from overview)*
> "Cinematic night scenes with low-intensity ambient and cool directional lights"

**Gotchas/Tips**:
- Ambient should be very low (0.1-0.3 intensity)
- Use dark gray/blue tones, not pure black

---

### ✅ 6. Performance Optimization — Many Lights
**How it applies**: Essential when using multiple internal point lights in frosted meshes.

**Code snippet (verbatim)**:
*(Tips only, no code)*
> - "Use cheap lights (AmbientLight, HemisphereLight) for base illumination"
> - "Minimize shadow-casting lights — each adds a render pass"

**Gotchas/Tips**:
- Ambient/Hemisphere = cheapest (no shadows, single calculation)
- Each shadow-casting light = additional render pass
- Limit shadow-casters to 1-2 for performance

---

## ❌ NOT COVERED IN SOURCE — External Research Needed

| Technique | Status |
|-----------|--------|
| **Orthographic Camera** | Not mentioned |
| **Frosted Glass/Translucent Materials** | Not mentioned — need MeshPhysicalMaterial with transmission |
| **Selective Bloom/Glow** | Not mentioned — need UnrealBloomPass with layers |
| **Soft Shadows** | Not mentioned — need PCFSoftShadowMap + shadow.mapSize |
| **Fog/Atmosphere** | "Atmosphere" mentioned conceptually but no Fog implementation |
| **Light Through Glass** | Not mentioned — need caustics or mesh manipulation |

---

## SUMMARY

**Found 6 applicable techniques** with partial code examples. The source covers light TYPES and mood but lacks:
- Post-processing (bloom)
- Material techniques (frosted glass)
- Camera setup (orthographic)
- Shadow quality settings
- Fog implementation

For your TRON-like scene, combine the PointLight + RectAreaLight + Color Temperature techniques from this source, but you'll need external resources for selective bloom, translucent materials, and soft shadows.## Relevant Techniques for Target Scene: Dark Orthographic + Frosted Glass + Internal Point Lights

---

### 1. PointLight (HIGHLY RELEVANT)
**Technique Name**: PointLight  
**How it applies**: Core lighting element for internal point lights inside translucent mesh primitives. Light radiates outward through frosted glass onto dark ground plane.

**Code Snippet**:
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);
```

**Gotchas/Tips**:
- Third parameter (100) is the distance/falloff — critical for TRON-like localized glow
- For many small light sources (performance): keep distance values minimal
- Color can be set to neon hues (cyan, magenta, electric blue) for TRON aesthetic
- Intensity affects bloom/glow intensity when combined with post-processing

---

### 2. AmbientLight (RELEVANT)
**Technique Name**: AmbientLight  
**How it applies**: "Soft ambient for moody interiors" — use VERY low intensity for dark scene base illumination without destroying the dark aesthetic.

**Code Snippet**:
```javascript
// Document states: "uniform base illumination without direction or shadows"
// For dark scene, use minimal intensity:
const ambientLight = new THREE.AmbientLight(0x111111, 0.1);
scene.add(ambientLight);
```

**Gotchas/Tips**:
- No shadows — won't interfere with shadow mapping from other lights
- Keep intensity extremely low (0.05-0.2) for dark scenes
- Slight color tint (deep blue/purple) can enhance moody atmosphere

---

### 3. Shadow Mapping (RELEVANT)
**Technique Name**: Shadow Mapping  
**How it applies**: Essential for soft shadows on dark ground plane from internal lights glowing through translucent meshes.

**Code Snippet**:
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
// Note: PointLights also support castShadow
```

**Gotchas/Tips**:
- Must enable on renderer AND individual lights
- PointLight shadows are more expensive — consider limit for many light sources
- Soft shadows require shadow map configuration (not detailed in this doc)

---

### 4. Combining Lights for Atmospheric Effects (HIGHLY RELEVANT)
**Technique Name**: Light Combination for Atmosphere  
**How it applies**: Document explicitly mentions "soft ambient for moody interiors" — directly applicable to dark TRON-like aesthetic.

**Relevant Quote**: "Tips on creating captivating atmospheres through light combinations, like soft ambient for moody interiors."

**Gotchas/Tips**:
- Layer multiple PointLights with different colors for neon glow effects
- Combine minimal AmbientLight with selective PointLights for dramatic contrast
- For selective bloom: isolate specific light sources or emissive materials

---

### 5. PBR — Physically Based Rendering (RELEVANT)
**Technique Name**: PBR Materials  
**How it applies**: "Simulates real-world material properties by mimicking how light interacts with different surfaces" — essential for realistic frosted glass/translucent materials.

**Gotchas/Tips**:
- Use MeshPhysicalMaterial for glass/translucency (not mentioned directly but implied)
- PBR materials interact correctly with PointLights for realistic light transmission
- For frosted glass: adjust roughness and transmission properties

---

### 6. IBL — Image-Based Lighting (POTENTIALLY RELEVANT)
**Technique Name**: Image-Based Lighting  
**How it applies**: "Uses environment maps to create photorealistic lighting conditions" — could provide subtle ambient reflection on glass surfaces.

**Gotchas/Tips**:
- May be overkill for minimal TRON aesthetic
- Could use simple gradient environment map for subtle reflections on glass

---

### 7. SpotLight (CONTEXTUALLY RELEVANT)
**Technique Name**: SpotLight  
**How it applies**: "Cone-shaped beam with target tracking" — could create directed accent lighting or focused glow effects in TRON aesthetic.

**Code Snippet**:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight);
scene.add(spotlight.target);
```

**Gotchas/Tips**:
- Target must be added to scene separately
- More controllable than PointLight for directed beams
- Green (0x00ff00) example aligns with TRON aesthetic

---

### 8. DirectionalLight (LESS RELEVANT)
**Technique Name**: DirectionalLight  
**How it applies**: "Parallel rays simulating sunlight" — generally NOT suited for dark interior scenes, but could provide very subtle overall fill.

**Code Snippet**:
```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);
```

**Gotchas/Tips**:
- Skip for dark TRON scene — contradicts the aesthetic
- If needed, use extremely low intensity (0.01-0.05) for subtle fill

---

## Performance Notes for Many Small Light Sources

From the document structure, relevant performance considerations:
- PointLight has a distance parameter for falloff — use tight values to limit calculations
- Shadow mapping on PointLights is expensive — limit which lights cast shadows
- Consider light pooling/culling for offscreen lights (not explicitly covered in this doc)

---

## Key Takeaway

The document's emphasis on **"combining lights for atmospheric effects"** and **"soft ambient for moody interiors"** directly supports the dark TRON-like aesthetic. PointLight is the primary tool for internal lights within translucent meshes, while minimal AmbientLight maintains darkness without complete black.## SDF Cylinder for Light Shaping

**How it applies**: Perfect for TRON-like neon beam effects—creates clean, hard-edged volumetric light shafts from point lights. The `smoothstep` edge softening prevents harsh aliasing while maintaining the iconic sci-fi aesthetic.

**Code snippet**:
```glsl
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + axisDir * projectionLength;
  float distanceToAxis = length(p - closestPointOnAxis);
  return distanceToAxis - radius;
}

float smoothEdgeWidth = 0.1;

// In raymarching loop:
float sdfVal = sdCylinder(samplePos, lightPos, lightDir, 2.0);
float shapeFactor = smoothstep(0.0, -smoothEdgeWidth, sdfVal);

if (shapeFactor < 0.1) {
  t += STEP_SIZE;
  continue;
}
```

**Gotchas/tips**:
- Hard light edges → Add smoothstep with smoothEdgeWidth on SDF
- FBM artifacts → Use world-space coordinates for noise sampling
- For frosted glass effect, combine SDF shape factor with FBM noise to add natural density variation

---

## Blue Noise Dithering

**How it applies**: Critical performance optimization for scenes with many point lights. Reduces step count from ~250 to ~50 while maintaining visual quality—essential when each light needs its own volumetric pass.

**Code snippet**:
```glsl
uniform sampler2D blueNoiseTexture;
uniform int frame;

float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame%32) / sqrt(0.5));
float t = STEP_SIZE * offset;
```

**Gotchas/tips**:
- Step count is the dominant cost—blue noise dithering is a huge quality/step-count win
- Negligible performance cost, enables ~50 steps instead of 250
- Unbounded float precision loss → Use frame%32 for blue noise frame counter

---

## Cube Camera for Omnidirectional Point Light Shadows

**How it applies**: Essential for point lights inside frosted glass meshes—shadows must cast in all directions. Combined with selective bloom, creates the iconic light-through-glass effect on the dark ground.

**Code snippet**:
```javascript
const shadowCubeRenderTarget = useMemo(() => {
  const rt = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  return rt;
}, []);

const shadowCubeCamera = useMemo(() => {
  return new THREE.CubeCamera(CUBE_CAMERA_NEAR, CUBE_CAMERA_FAR, shadowCubeRenderTarget);
}, [shadowCubeRenderTarget]);
```

**Gotchas/tips**:
- Cube camera = 6x scene renders per frame—major overhead for many lights
- Flickering shadows → Increase shadow map resolution
- 512² = good balance between quality and performance
- Multiple lights → Cost scales linearly with N (N shadow FBOs + N lookups per step)

---

## Custom Shadow Material for Cube Depth

**How it applies**: Three.js cube cameras don't output linear depth by default. This custom material stores normalized distance for accurate shadow comparison in the volumetric shader.

**Code snippet**:
```javascript
const shadowMaterial = useMemo(() =>
  new THREE.ShaderMaterial({
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
  }),
[]);
```

**Gotchas/tips**:
- CubeCamera depth unavailable → Use custom material outputting normalized distance
- Shadow acne (self-shadowing speckles) → Add small shadowBias (0.001–0.01)
- Use `side: THREE.DoubleSide` for frosted glass that should cast shadows from both faces

---

## Cube Shadow Sampling in Fragment Shader

**How it applies**: Samples the cube shadow map to determine if each raymarching sample is occluded. Creates realistic light-through-frosted-glass shadows on the ground plane.

**Code snippet**:
```glsl
uniform samplerCube shadowMapCube;

float calculateShadowCube(vec3 worldPosition) {
  vec3 dirToLight = worldPosition - lightPosition;
  float distToLight = length(dirToLight);
  
  vec3 direction = normalize(dirToLight);
  float sampledDist = texture(shadowMapCube, direction).r;
  float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
  
  if (distToLight > shadowMapDist + shadowBias) {
    return 0.0;
  }
  return 1.0;
}
```

**Gotchas/tips**:
- Light appears on wrong side of occluder → Use `continue` not `break` in shadow check
- Shadow map resolution impacts per-step texture read performance

---

## Henyey-Greenstein Phase Function

**How it applies**: Creates realistic atmospheric scattering for the fog/haze in your dark scene. The anisotropy parameter controls how "glowy" lights appear when viewed through fog—key for the TRON aesthetic.

**Code snippet**:
```glsl
float HGPhase(float mu) {
  float g = SCATTERING_ANISO;
  float gg = g * g;

  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);

  float scatter = (1.0 - gg) / pow(denom, 1.5);
  return scatter;
}
```

**Gotchas/tips**:
- Higher `g` values (0.5-0.9) create stronger forward scattering—more dramatic light beams
- Use in combination with Beer's Law for physically-based light falloff through fog

---

## Beer's Law Light Accumulation

**How it applies**: Core volumetric lighting calculation that accumulates light along each ray. Creates the soft glow around neon beams and the gradual falloff through atmospheric fog.

**Code snippet**:
```glsl
float transmittance = 5.0;
vec3 accumulatedLight = vec3(0.0);

for (int i = 0; i < NUM_STEPS; i++) {
  // ... shadow/depth checks ...

  float distanceToLight = length(samplePos - lightPos);
  vec3 sampleLightDir = normalize(samplePos - lightPos);

  float attenuation = exp(-0.3 * distanceToLight);
  float scatterPhase = HGPhase(dot(rayDir, -sampleLightDir));
  vec3 luminance = lightColor * LIGHT_INTENSITY * attenuation * scatterPhase;

  float stepDensity = FOG_DENSITY * shapeFactor;
  stepDensity = max(stepDensity, 0.0);

  float stepTransmittance = BeersLaw(stepDensity * STEP_SIZE, 1.0);
  transmittance *= stepTransmittance;
  accumulatedLight += luminance * transmittance * stepDensity * STEP_SIZE;

  t += STEP_SIZE;
}
```

**Gotchas/tips**:
- Transmittance too dark → Start transmittance > 1.0 (e.g., 5.0)
- For selective bloom, output accumulated light to a separate render target for post-processing bloom pass

---

## Fractal Brownian Motion for Organic Fog

**How it applies**: Adds natural variation to the atmospheric density—breaks up perfect cylinder shapes for more realistic frosted glass light diffusion. Subtle animated movement enhances the cinematic feel.

**Code snippet**:
```glsl
const float NOISE_FREQUENCY = 0.5;
const float NOISE_AMPLITUDE = 10.0;
const int NOISE_OCTAVES = 3;

float fbm(vec3 p) {
  vec3 q = p + time * 0.5 * vec3(1.0, -0.2, -1.0);
  float g = noise(q);

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

// Usage — combine with SDF for natural density:
float shapeFactor = -sdfVal + fbm(samplePos);
```

**Gotchas/tips**:
- FBM artifacts → Use world-space coordinates for noise sampling
- Keep octaves low (3-4) for performance when many lights are present
- Combine with SDF shape factor: `shapeFactor = baseShape + fbm * noiseStrength`

---

## Shadow Integration — Skip, Don't Break

**How it applies**: Critical for correct volumetric shadows when light passes through frosted glass. Points beyond an occluder can still be lit by the same light source.

**Code snippet**:
```glsl
float shadowFactor = calculateShadow(samplePos);
if (shadowFactor == 0.0) {
  t += STEP_SIZE;
  continue;  // NOT break — points beyond shadow may be lit
}
```

**Gotchas/tips**:
- Light appears on wrong side of occluder → Use `continue` not `break` in shadow check
- This is especially important for translucent materials where some light should penetrate## PointLight
- **How it applies**: Essential for the "internal point lights" inside frosted glass meshes and creating the TRON-like neon aesthetic. The `distance` parameter in the code is crucial for performance when managing many lights.
- **Code snippet**:
    ```javascript
    const pointLight = new THREE.PointLight(0xff0000, 1, 100);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);
    ```
- **Gotchas/tips**: For "performance for many lights," keep the `distance` (e.g., `100`) as short as possible. In a dark scene, a low intensity goes a long way.

## SpotLight
- **How it applies**: Useful for casting focused beams of "light through glass onto dark ground" or simulating specific neon signage illuminating the ground plane.
- **Code snippet**:
    ```javascript
    const spotlight = new THREE.SpotLight(0x00ff00, 1);
    spotlight.position.set(0, 10, 0);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);
    ```
- **Gotchas/tips**: You must add `spotlight.target` to the scene for the light to aim correctly. Useful for creating the "selective bloom" look by isolating specific illuminated areas.

## Shadow Mapping
- **How it applies**: Necessary for rendering "light through glass onto dark ground" and the "soft shadows" characteristic of a moody, atmospheric scene.
- **Code snippet**:
    ```javascript
    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;
    ```
- **Gotchas/tips**: The snippet shows `directionalLight`, but for this specific dark scene, you should apply `.castShadow = true` to your `PointLight` or `SpotLight` meshes. Note that PointLight shadows can be expensive (rendering 6 views), so use sparingly for performance.# Techniques Extracted: Achieving Realistic Ambience in Architectural Three.js Scenes

**Document Source**: [Three.js Discourse Thread](https://discourse.threejs.org/t/achieving-realistic-ambience-in-architectural-three-js-scenes/89753)

**Relevance to Target Scene**: Dark orthographic scene with frosted glass/translucent mesh primitives, internal point lights, selective bloom, TRON-like neon aesthetic

---

## 1. Baked Lightmaps with Emissive Materials

**How it applies to target scene**: Target scene could bake the glow from internal point lights onto frosted glass meshes, creating convincing light emanation without real-time cost for many small lights

**Code snippet**:
```javascript
const material = new THREE.MeshBasicMaterial({
  map: bakedAlbedoMap,
  emissiveMap: bakedEmissiveMap,
  emissive: 0xffffff,
  toneMapped: false
});
```

**Gotchas/Tips**:
- Most quality comes from offline work in Blender/DCC, not Three.js code
- toneMapped: false ensures emissive glow isn't compressed by tone mapping
- Baking locks lighting - not suitable if point lights need to move/animate
- For animated lights, consider hybrid approach: bake static ambient, use real-time for key lights

---
## 2. HDRI-Only Ambient Lighting

**How it applies to target scene**: Dark scene can use a subtle HDRI environment for soft ambient fill without adding real-time light sources. Use scene.environment = bakedHDRI for reflections on glass

**Code snippet**:
```javascript
scene.environment = bakedHDRI;
```

**Gotchas/Tips**:
- HDRI alone can create moody atmospheric feel without real-time light sources
- Works well with baked emissive materials for neon/glow effects
- For TRON aesthetic, could use custom dark HDRI with subtle color tints

---
## 3. Screen-Space Ambient Occlusion (SAO/GTAO)

**How it applies to target scene**: Dark scene with glowing objects can use SSAO to add depth and ground the frosted glass primitives onto the dark ground plane with soft contact shadows

**Code snippet**:
```javascript
// Use THREE.SAOPass or GTAOPass from examples/jsm/postprocessing/
```

**Gotchas/Tips**:
- Screen-space techniques work well for dark scenes with limited light sources
- GTAO provides more accurate ambient occlusion than basic SAO
- Performance impact - apply only when viewport stabilizes for static scenes

---
## 4. Progressive Shadow Rendering

**How it applies to target scene**: For soft shadows from internal point lights through frosted glass onto ground plane - can accumulate shadow samples over multiple frames

**Code snippet**:
```javascript
// Progressive shadow accumulation pattern
```

**Gotchas/Tips**:
- Good for static scenes where camera/view doesn't change frequently
- Accumulates quality over time rather than per-frame cost
- Consider for ground plane shadows beneath glowing objects

---
## 5. Post-Processing Bloom

**How it applies to target scene**: SELECTIVE BLOOM is key for TRON-like neon aesthetic - bloom on glowing glass objects but not the dark ground plane. Apply bloom pass with selective layers

**Code snippet**:
```javascript
// Use UnrealBloomPass with selective layers
// Set object.layers to control which objects receive bloom
```

**Gotchas/Tips**:
- Apply bloom only when viewport stabilizes, not every frame, for performance
- Multiple bloom implementations available - test which works best for neon aesthetic
- For selective bloom: use object.layers and render passes to isolate glowing objects
- Combine with toneMapped: false on emissive materials for stronger glow

---
## 6. Depth-of-Field Post-Processing

**How it applies to target scene**: Soft DOF can enhance moody TRON aesthetic, blurring background objects while keeping key glowing primitives in focus

**Code snippet**:
```javascript
// Use BokehPass or DepthPass for DOF effect
```

**Gotchas/Tips**:
- Apply only when viewport stabilizes for performance
- Subtle DOF enhances atmosphere without distracting
- Can be expensive - consider for desktop only or as optional effect

---
## 7. Minimize Transparent/Reflective Surfaces

**How it applies to target scene**: Frosted glass IS transparent - this is a performance warning. For many small light sources inside glass primitives, consider: (1) baking the translucent appearance, (2) using cheaper fake-transparency techniques, (3) limiting number of glass objects

**Code snippet**:
```javascript
// Consider MeshBasicMaterial with baked translucent appearance
// instead of real MeshPhysicalMaterial with transmission
```

**Gotchas/Tips**:
- Transparent surfaces increase draw calls and overdraw significantly
- For many glass objects with internal lights, baking is strongly recommended
- Real MeshPhysicalMaterial with transmission is expensive for many objects
- VR/mobile targets should avoid transparency where possible

---
## 8. Apply Post-Processing on Stabilize

**How it applies to target scene**: For static or slowly-moving orthographic camera scene, only compute expensive effects (bloom, DOF, AA) when camera stops moving

**Code snippet**:
```javascript
// Track camera movement, only enable passes when settled
let lastCameraPos = camera.position.clone();
function checkStability() {
  if (camera.position.distanceTo(lastCameraPos) < threshold) {
    // Enable post-processing passes
  }
}
```

**Gotchas/Tips**:
- Significant performance savings for static scenes
- User experience consideration - effects 'pop in' when camera stops
- Works well for architectural visualization style

---
## 9. Texture Resolution Limits for Broad Compatibility

**How it applies to target scene**: Baked lightmaps for glass objects should be capped at 2048px for broad device support, not 4096px

**Code snippet**:
```javascript
// Keep baked textures at 2048px max
// const bakedTexture = generateBakedLightmap({ maxSize: 2048 });
```

**Gotchas/Tips**:
- WebGL shader texture limits: max 4092px on high-end, 2048px on many devices
- Memory can be consumed by large textures quickly
- Prioritize texture density over real-time compute for better visual quality per performance budget

---
## 10. Unlit Materials for Pre-Baked Shadows

**How it applies to target scene**: Ground plane could use baked shadow textures with MeshBasicMaterial (unlit) - shows shadows from glowing objects without real-time shadow calculation

**Code snippet**:
```javascript
// Ground plane with baked shadows
const groundMaterial = new THREE.MeshBasicMaterial({
  map: groundAlbedoMap,
  // Shadow information baked into texture
});
```

**Gotchas/Tips**:
- Eliminates real-time shadow cost entirely
- Works well for static object positions
- Combine with dark base color for moody aesthetic

---
## 11. Normal Map Baking for Lightweight Assets

**How it applies to target scene**: For frosted glass appearance, could bake normal maps to simulate surface detail without expensive shaders

**Code snippet**:
```javascript
// Bake normals from high-poly frosted glass to low-poly game mesh
```

**Gotchas/Tips**:
- Lightweight, fast-loading assets
- Can fake surface detail on simple geometry
- Works with baked lighting approach


---

## Key Performance Summary for Many Small Light Sources

| Strategy | Benefit for Target Scene |
|----------|--------------------------|
| Bake lighting offline | Eliminates per-light calculation for static internal point lights |
| Emissive/unlit materials | Zero real-time lighting cost for glowing glass objects |
| Limit transparency | Critical - frosted glass is expensive; bake the appearance |
| Post-processing on stabilize | Essential for ortho camera that may not move often |
| Cap textures at 2048px | Ensures mobile/VR compatibility |

## Critical Takeaway

For a TRON-like scene with many small light sources inside glass primitives, the document strongly recommends **baking over real-time rendering**. The quality comes from the asset pipeline (Blender baking, HDR environments, GLTF export) rather than Three.js runtime code. If lights must animate, consider a hybrid: bake static ambient + use real-time for key animated lights only.
Based on the provided context, here are the relevant techniques extracted for the requested Three.js scene.

### Technique: Baked Lightmaps and Emissive Materials
*   **How it applies**: This is the primary solution for **"Performance for many lights"** and achieving the **"TRON-like neon aesthetic"**. Instead of using expensive real-time lights, lighting information (including neon glow) is pre-computed ("baked") into textures. This allows for a complex lighting setup without runtime performance costs, which is crucial for mobile/VR.
*   **Code snippet**:
    ```javascript
    const material = new THREE.MeshBasicMaterial({
      map: bakedAlbedoMap,
      emissiveMap: bakedEmissiveMap,
      emissive: 0xffffff,
      toneMapped: false
    });
    ```
*   **Gotchas/tips**: 
    *   "Most of the quality comes from offline work" — you must invest time in the Blender/DCC pipeline.
    *   This approach relies on **unlit materials**, meaning the lights won't react to object movement in real-time.
    *   If users modify geometry dynamically, you would need backend rebaking, which reduces scalability.

### Technique: Post-Processing (Bloom, DOF, AO)
*   **How it applies**: Relevant to **"Selective bloom/glow"** and **"Soft shadows, fog/atmosphere"**. The context explicitly mentions using post-processing for bloom and ambient occlusion to enhance a "brooding" or atmospheric feel.
*   **Code snippet**: Not covered in context (no specific implementation code provided).
*   **Gotchas/tips**: 
    *   Apply expensive effects like Depth-of-Field, Bloom, and Anti-aliasing **only when the viewport stabilizes** (pauses moving), rather than every frame, to maintain performance.

### Technique: Screen-Space Ambient Occlusion (SAO/GTAO)
*   **How it applies**: Relevant to **"Soft shadows, fog/atmosphere"**. This is suggested as a real-time alternative to baked shadows to provide depth and "soft global illumination" without the cost of true global illumination.
*   **Code snippet**: Not covered in context.
*   **Gotchas/tips**: Useful for adding realism to interiors, but implies a performance cost compared to fully baked solutions.

### Technique: Asset Optimization & Limits
*   **How it applies**: Critical for **"Performance for many lights"** and general scene stability.
*   **Code snippet**: Not covered in context.
*   **Gotchas/tips**: 
    *   **Texture Limits:** Cap textures at 2048px for broad device compatibility (WebGL limits can drop to this on many devices).
    *   **Transparency:** Explicitly advises to **"Limit transparent and reflective surfaces"** — this is a conflict/limitation for the requested "Frosted glass" effect.
    *   **WebGPU:** Not viable for production if broad customer device support is required.

---

### Items Not Covered in Context
The context focuses heavily on static architectural visualization and baking. The following specific items from your list are **not covered** or are advised against:

*   **Orthographic camera**: Not mentioned in the text.
*   **Frosted glass/translucent meshes**: The text explicitly advises *minimizing* transparent surfaces for performance ("Limit transparent and reflective surfaces, especially for VR/mobile"). It does not provide techniques for achieving frosted glass.
*   **Internal point lights**: The context suggests replacing real-time point lights with baked data, not simulating lights moving inside glass meshes.
*   **Light through glass onto dark ground**: Real-time light transmission/caustics are not discussed; the recommendation is to bake this effect into lightmaps.
*   **Selective bloom**: While bloom is mentioned, the specific implementation of "selective" bloom (e.g., using layers) is not detailed.## RELEVANT TECHNIQUES FOUND IN CONTEXT

This context is about **weather visualization** (sun, rain, snow, storms) — NOT specifically about dark TRON/neon scenes with orthographic cameras. Below are the techniques that ARE relevant to your request, with notes on what's NOT covered.

---

### 1. Point Light Inside Mesh (Internal Light Source)

**Technique name:** Point Light Inside Sphere

**How it applies:** Places a pointLight at the same position as or inside a mesh to create a glowing object effect. The mesh itself doesn't need to emit light — the internal light illuminates surroundings.

**Code snippet:**
```jsx
<Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
<pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
```

**Gotchas/tips:**
- Intensity is deliberately low (2.5) because other lighting comes from Sky component
- `distance` parameter controls light falloff range
- For TRON aesthetic, you'd want higher intensity with smaller distance for localized glow

---

### 2. Post-Processing Bloom

**Technique name:** EffectComposer with Bloom

**How it applies:** Adds bloom/glow effect to bright areas of the scene. Essential for neon/TRON aesthetic.

**Code snippet:**
```jsx
<EffectComposer>
  <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
    starPoints={2} flareShape={0.81} flareSize={1.68}
    secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
  <Bloom intensity={0.3} threshold={0.9} />
</EffectComposer>
```

**Gotchas/tips:**
- `threshold={0.9}` means only very bright pixels bloom — adjust lower for more glow
- This is NOT selective bloom (whole scene). For selective bloom on specific objects, you'd need UnrealBloomPass with layers
- Lens flare position must track your light source position

---

### 3. Point Light with Shadow Casting

**Technique name:** Point Light Shadows

**How it applies:** Enables shadow casting from point lights for light-through-glass effects onto ground.

**Code snippet:**
```jsx
<pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
  intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
```

**Gotchas/tips:**
- `castShadow` must be explicitly enabled
- `decay={0.8}` controls light falloff physics
- For soft shadows, you'd need to configure shadow map resolution on renderer
- Context doesn't show soft shadow setup (PCF, PCFSoft, etc.)

---

### 4. Dynamic Light Intensity Control

**Technique name:** Ref-Based Light Intensity Animation

**How it applies:** Dynamically control light brightness for flash/glow effects. Useful for pulsing neon or lightning.

**Code snippet:**
```javascript
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
```

**Gotchas/tips:**
- Use `useRef` for cooldown flag to prevent overlapping animations
- Random X position varies light position for variety
- 0.3% probability per frame creates irregular timing

---

### 5. Instanced Rendering for Performance

**Technique name:** InstancedMesh for Many Objects

**How it applies:** Render thousands of objects in a single draw call. Critical for performance with many lights or particles.

**Code snippet:**
```jsx
const meshRef = useRef();
const dummy = useMemo(() => new THREE.Object3D(), []);

const particles = useMemo(() => {
  const temp = [];
  for (let i = 0; i < count; i++) {
    temp.push({ x: Math.random(), y: Math.random(), z: Math.random() });
  }
  return temp;
}, [count]);

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
    <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
    <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
  </instancedMesh>
);
```

**Gotchas/tips:**
- **Never create `new Object3D()` in the animation loop** — causes GC pressure
- **Always set `instanceMatrix.needsUpdate = true`** after transforms or particles freeze
- One geometry transformed via matrix math = thousands of particles in 1 draw call
- For many lights, you'd need a different approach (light probes, clustered rendering)

---

### 6. Transparent/Translucent Materials

**Technique name:** Transparent MeshBasicMaterial

**How it applies:** Partial relevance to frosted glass. This shows simple transparency, not true frosted glass (which needs transmission, roughness, or custom shaders).

**Code snippet:**
```jsx
<meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
```

**Gotchas/tips:**
- This is NOT frosted glass — just basic transparency
- For true frosted glass, you'd need `MeshPhysicalMaterial` with `transmission`, `roughness`, and `thickness`
- Context doesn't cover refraction or caustics for light-through-glass effects

---

## TECHNIQUES NOT COVERED IN THIS CONTEXT

The following techniques you requested are **NOT present** in this weather visualization article:

| Technique | Status |
|-----------|--------|
| **Dark scene setup** | ❌ Not covered — context uses Sky component for daytime |
| **Orthographic camera** | ❌ Not covered — uses default perspective camera |
| **Frosted glass/translucent meshes** | ❌ Not covered — only basic transparent materials |
| **Light through glass onto dark ground** | ❌ Not covered — no caustics or glass materials |
| **Selective bloom/glow** | ❌ Not covered — bloom applies to whole scene |
| **Fog/atmosphere** | ⚠️ Only weather detection for "foggy" conditions — no fog rendering code |
| **TRON-like neon aesthetic** | ⚠️ Only basic bloom — no neon tubes, grid floors, or cyberpunk styling |
| **Performance for many lights** | ⚠️ Instanced mesh for particles, but no clustered/deferred lighting |

---

## KEY TIPS FROM CONTEXT

1. **Conditional rendering** — Only mount active effects, skip unused components entirely
2. **Portal mode optimization** — 87.5% particle reduction for previews (800→100 rain, 400→50 snow)
3. **Skip expensive effects when not visible** — Sky component skipped at night entirely
4. **Resolution budget** — Portal textures at 256px keep GPU memory manageable
5. **Memory lifecycle** — Use `useMemo` for all objects created once to eliminate GC churn# Three.js Lighting Techniques Extraction
## For Dark Scene with Frosted Glass, Internal Lights, Selective Bloom, TRON Aesthetic

---

# SECTION 1: LIGHT TYPES & SETUP

## 1. PointLight for Internal Mesh Lights

**Source**: p1-enlightening-3d-worlds-mastering-lighting-techniques-in-thre.md, p1-mastering-threejs-lighting-illuminating-your-3d-world.md, p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: PointLight placed inside or at mesh position to create glowing objects that illuminate surroundings

**How it applies**: 
- Primary technique for frosted glass meshes with internal lights
- Omni-directional light simulates diffusion through translucent material
- `distance` parameter controls falloff for performance

**Code snippets**:
```javascript
// Basic PointLight
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);
```

```jsx
// R3F version with mesh
<Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
<pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
```

```javascript
// Rim light for dark scene separation
const rimLight = new THREE.PointLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

**Gotchas/tips**:
- Keep `distance` as short as possible for performance with many lights
- In dark scenes, low intensity goes a long way (start with 0.5-2.0)
- PointLight shadows are EXPENSIVE (renders scene 6 times) — use sparingly
- Limit total PointLight count for performance

---

## 2. SpotLight for Focused Beams

**Source**: p1-enlightening-3d-worlds-mastering-lighting-techniques-in-thre.md

**Technique**: Directional cone of light for focused illumination

**How it applies**:
- Cast focused beams of light through glass onto dark ground
- Simulate neon signage illuminating ground plane
- More controlled than PointLight for selective lighting

**Code snippet**:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight);
scene.add(spotlight.target);  // MUST add target to scene!
```

**Gotchas/tips**:
- MUST add `spotlight.target` to scene for aiming to work
- Good for isolating specific areas for selective bloom look
- Lower cost than PointLight shadows (1 render pass vs 6)

---

## 3. RectAreaLight for Neon Panels

**Source**: p1-mastering-threejs-lighting-illuminating-your-3d-world.md

**Technique**: Rectangular area emitter for soft directional light

**How it applies**:
- Perfect for TRON-like neon strips and panels
- Creates realistic panel glow from surface area
- Soft directional light without harsh point source

**Code snippet**:
*(No code in source — requires RectAreaLightUniformsLib)*

**Gotchas/tips**:
- Requires `RectAreaLightUniformsLib` import
- Does NOT cast shadows
- Best for screen/panel glow effects

---

## 4. Three-Point Lighting for Cinematic Mood

**Source**: p1-mastering-threejs-lighting-illuminating-your-3d-world.md

**Technique**: Key/fill/rim combo for dramatic dark scenes

**How it applies**:
- Rim light separates subjects from dark backgrounds
- Low-intensity fill prevents pure black areas
- Key light provides main illumination direction

**Code snippet**:
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

**Gotchas/tips**:
- Keep fill light LOW intensity (0.1-0.5) for dark scenes
- Rim light placement BEHIND subject for edge glow
- Use dark gray/blue tones, not pure black

---

## 5. Dynamic Light Intensity Animation

**Source**: p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: Ref-based light intensity control for flash/pulse effects

**How it applies**:
- Pulsing neon lights
- Flickering/failing light effects
- Lightning/strobe for dramatic moments

**Code snippet**:
```javascript
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
```

**Gotchas/tips**:
- Use `useRef` for cooldown flag to prevent overlapping
- Random position adds variety
- 0.3% probability per frame creates irregular timing

---

# SECTION 2: MATERIALS & TRANSPARENCY

## 6. Transparent Materials (Basic)

**Source**: p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: Basic transparency with MeshBasicMaterial

**How it applies**:
- Starting point for translucent effects
- NOT true frosted glass — just basic transparency
- Low-cost option for many objects

**Code snippet**:
```jsx
<meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
```

**Gotchas/tips**:
- This is NOT frosted glass
- For true frosted glass, need `MeshPhysicalMaterial` with `transmission`, `roughness`, `thickness`
- Context warns: **"Limit transparent and reflective surfaces"** for performance

---

## 7. Baked Lightmaps and Emissive Materials

**Source**: p1-achieving-realistic-ambience-in-architectural-threejs-scenes.md

**Technique**: Pre-compute lighting into textures for performance

**How it applies**:
- Primary solution for "many lights" performance
- TRON neon glow baked into emissive textures
- Complex lighting at zero runtime cost

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
- **"Most quality comes from offline work"** — invest in DCC pipeline (Blender)
- Lights won't react to real-time object movement
- `toneMapped: false` for emissive bloom to work correctly
- Dynamic geometry requires backend rebaking (scalability issue)

---

# SECTION 3: SHADOWS

## 8. Shadow Mapping Setup

**Source**: p1-enlightening-3d-worlds-mastering-lighting-techniques-in-thre.md, p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: Enable shadow casting on lights and renderer

**How it applies**:
- Light through glass onto dark ground plane
- Soft shadows for moody atmosphere
- Essential for realism

**Code snippet**:
```javascript
// Renderer setup
renderer.shadowMap.enabled = true;

// Light setup
<pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
  intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
```

**Gotchas/tips**:
- `castShadow` must be explicitly enabled on each light
- PointLight shadows = 6 render passes (expensive!)
- For soft shadows, need PCFSoftShadowMap + shadow.mapSize config
- Minimize shadow-casting lights — each adds a render pass

---

## 9. Cube Camera for Omnidirectional Shadows

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: CubeCamera for point light shadows in all directions

**How it applies**:
- Essential for point lights INSIDE frosted glass meshes
- Shadows cast in all directions from internal light
- Combined with selective bloom for light-through-glass effect

**Code snippet**:
```javascript
const shadowCubeRenderTarget = useMemo(() => {
  const rt = new THREE.WebGLCubeRenderTarget(SHADOW_MAP_SIZE, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  return rt;
}, []);

const shadowCubeCamera = useMemo(() => {
  return new THREE.CubeCamera(CUBE_CAMERA_NEAR, CUBE_CAMERA_FAR, shadowCubeRenderTarget);
}, [shadowCubeRenderTarget]);
```

**Gotchas/tips**:
- Cube camera = **6x scene renders per frame** — major overhead
- 512² resolution = good balance quality/performance
- Flickering shadows → Increase shadow map resolution
- Cost scales LINEARLY with N lights (N shadow FBOs + N lookups)

---

## 10. Custom Shadow Material for Cube Depth

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Custom shader material for cube camera depth output

**How it applies**:
- Three.js cube cameras don't output linear depth by default
- Stores normalized distance for accurate shadow comparison
- Required for volumetric light shadows

**Code snippet**:
```javascript
const shadowMaterial = useMemo(() =>
  new THREE.ShaderMaterial({
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
  }),
[]);
```

**Gotchas/tips**:
- Shadow acne → Add small shadowBias (0.001–0.01)
- Use `side: THREE.DoubleSide` for frosted glass that casts shadows from both faces

---

## 11. Cube Shadow Sampling in Shader

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: GLSL function to sample cube shadow map

**How it applies**:
- Determines if each raymarching sample is occluded
- Creates realistic light-through-frosted-glass shadows

**Code snippet**:
```glsl
uniform samplerCube shadowMapCube;

float calculateShadowCube(vec3 worldPosition) {
  vec3 dirToLight = worldPosition - lightPosition;
  float distToLight = length(dirToLight);
  
  vec3 direction = normalize(dirToLight);
  float sampledDist = texture(shadowMapCube, direction).r;
  float shadowMapDist = sampledDist * CUBE_CAMERA_FAR;
  
  if (distToLight > shadowMapDist + shadowBias) {
    return 0.0;
  }
  return 1.0;
}
```

**Gotchas/tips**:
- Use `continue` NOT `break` in shadow check loop
- Points beyond occluder can still be lit

---

# SECTION 4: POST-PROCESSING

## 12. Post-Processing Bloom

**Source**: p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: EffectComposer with Bloom pass

**How it applies**:
- Essential for TRON neon aesthetic
- Creates glow around bright areas
- Configurable threshold for selective effect

**Code snippet**:
```jsx
<EffectComposer>
  <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
    starPoints={2} flareShape={0.81} flareSize={1.68}
    secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
  <Bloom intensity={0.3} threshold={0.9} />
</EffectComposer>
```

**Gotchas/tips**:
- `threshold={0.9}` means only very bright pixels bloom
- Lower threshold = more glow
- This is NOT selective bloom (applies to whole scene)
- For selective bloom, need UnrealBloomPass with layers
- Apply expensive effects **only when viewport stabilizes** (not every frame)

---

## 13. Screen-Space Ambient Occlusion (SAO/GTAO)

**Source**: p1-achieving-realistic-ambience-in-architectural-threejs-scenes.md

**Technique**: Real-time ambient occlusion for depth

**How it applies**:
- Adds soft shadows in corners/crevices
- Creates depth in dark scenes
- Alternative to baked shadows for dynamic scenes

**Code snippet**: *(Not provided in source)*

**Gotchas/tips**:
- Performance cost compared to fully baked solutions
- Good for adding realism to interiors

---

# SECTION 5: VOLUMETRIC LIGHTING & FOG

## 14. SDF Cylinder for Light Shaping

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Signed distance function for clean volumetric light shapes

**How it applies**:
- Perfect for TRON-like neon beam effects
- Clean, hard-edged volumetric light shafts
- Smoothstep edge softening prevents aliasing

**Code snippet**:
```glsl
float sdCylinder(vec3 p, vec3 axisOrigin, vec3 axisDir, float radius) {
  vec3 p_to_origin = p - axisOrigin;
  float projectionLength = dot(p_to_origin, axisDir);
  vec3 closestPointOnAxis = axisOrigin + axisDir * projectionLength;
  float distanceToAxis = length(p - closestPointOnAxis);
  return distanceToAxis - radius;
}

float smoothEdgeWidth = 0.1;

// In raymarching loop:
float sdfVal = sdCylinder(samplePos, lightPos, lightDir, 2.0);
float shapeFactor = smoothstep(0.0, -smoothEdgeWidth, sdfVal);

if (shapeFactor < 0.1) {
  t += STEP_SIZE;
  continue;
}
```

**Gotchas/tips**:
- Hard light edges → Add smoothstep with smoothEdgeWidth
- For frosted glass, combine SDF with FBM noise for natural variation

---

## 15. Blue Noise Dithering

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Blue noise for step count reduction

**How it applies**:
- CRITICAL for many lights — reduces step count from ~250 to ~50
- Maintains visual quality with fewer samples
- Essential performance optimization

**Code snippet**:
```glsl
uniform sampler2D blueNoiseTexture;
uniform int frame;

float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame%32) / sqrt(0.5));
float t = STEP_SIZE * offset;
```

**Gotchas/tips**:
- Negligible performance cost
- Use `frame%32` for blue noise frame counter to avoid precision loss
- Enables ~50 steps instead of 250

---

## 16. Henyey-Greenstein Phase Function

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Physically-based atmospheric scattering

**How it applies**:
- Creates realistic fog/haze atmosphere
- Controls how "glowy" lights appear through fog
- Anisotropy parameter for light beam directionality

**Code snippet**:
```glsl
float HGPhase(float mu) {
  float g = SCATTERING_ANISO;
  float gg = g * g;

  float denom = 1.0 + gg - 2.0 * g * mu;
  denom = max(denom, 0.0001);

  float scatter = (1.0 - gg) / pow(denom, 1.5);
  return scatter;
}
```

**Gotchas/tips**:
- Higher `g` values (0.5-0.9) = stronger forward scattering = more dramatic beams
- Combine with Beer's Law for physically-based falloff

---

## 17. Beer's Law Light Accumulation

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Core volumetric lighting calculation

**How it applies**:
- Accumulates light along each ray
- Creates soft glow around neon beams
- Gradual falloff through atmospheric fog

**Code snippet**:
```glsl
float transmittance = 5.0;
vec3 accumulatedLight = vec3(0.0);

for (int i = 0; i < NUM_STEPS; i++) {
  // ... shadow/depth checks ...

  float distanceToLight = length(samplePos - lightPos);
  vec3 sampleLightDir = normalize(samplePos - lightPos);

  float attenuation = exp(-0.3 * distanceToLight);
  float scatterPhase = HGPhase(dot(rayDir, -sampleLightDir));
  vec3 luminance = lightColor * LIGHT_INTENSITY * attenuation * scatterPhase;

  float stepDensity = FOG_DENSITY * shapeFactor;
  stepDensity = max(stepDensity, 0.0);

  float stepTransmittance = BeersLaw(stepDensity * STEP_SIZE, 1.0);
  transmittance *= stepTransmittance;
  accumulatedLight += luminance * transmittance * stepDensity * STEP_SIZE;

  t += STEP_SIZE;
}
```

**Gotchas/tips**:
- Transmittance too dark → Start > 1.0 (e.g., 5.0)
- For selective bloom, output accumulated light to separate render target

---

## 18. Fractal Brownian Motion for Organic Fog

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Noise-based density variation

**How it applies**:
- Adds natural variation to atmospheric density
- Breaks up perfect cylinder shapes
- Animated movement for cinematic feel

**Code snippet**:
```glsl
const float NOISE_FREQUENCY = 0.5;
const float NOISE_AMPLITUDE = 10.0;
const int NOISE_OCTAVES = 3;

float fbm(vec3 p) {
  vec3 q = p + time * 0.5 * vec3(1.0, -0.2, -1.0);
  float g = noise(q);

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

// Usage — combine with SDF for natural density:
float shapeFactor = -sdfVal + fbm(samplePos);
```

**Gotchas/tips**:
- FBM artifacts → Use world-space coordinates for noise
- Keep octaves LOW (3-4) for performance with many lights
- Combine with SDF: `shapeFactor = baseShape + fbm * noiseStrength`

---

## 19. Shadow Integration — Skip, Don't Break

**Source**: p1-on-shaping-light-real-time-volumetric-lighting-with-post-pro.md

**Technique**: Correct volumetric shadow continuation

**How it applies**:
- Critical for correct shadows through frosted glass
- Points beyond occluder can still be lit

**Code snippet**:
```glsl
float shadowFactor = calculateShadow(samplePos);
if (shadowFactor == 0.0) {
  t += STEP_SIZE;
  continue;  // NOT break — points beyond shadow may be lit
}
```

**Gotchas/tips**:
- Using `break` causes light on wrong side of occluder
- Use `continue` to skip shadowed samples

---

# SECTION 6: PERFORMANCE OPTIMIZATION

## 20. Instanced Rendering for Many Objects

**Source**: p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: InstancedMesh for single draw call

**How it applies**:
- Render thousands of objects efficiently
- Critical for many light sources or particles
- One geometry = thousands of instances

**Code snippet**:
```jsx
const meshRef = useRef();
const dummy = useMemo(() => new THREE.Object3D(), []);

const particles = useMemo(() => {
  const temp = [];
  for (let i = 0; i < count; i++) {
    temp.push({ x: Math.random(), y: Math.random(), z: Math.random() });
  }
  return temp;
}, [count]);

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
    <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
    <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
  </instancedMesh>
);
```

**Gotchas/tips**:
- **NEVER create `new Object3D()` in animation loop** — GC pressure
- **ALWAYS set `instanceMatrix.needsUpdate = true`** or particles freeze
- One draw call for thousands of objects

---

## 21. Asset Optimization & Limits

**Source**: p1-achieving-realistic-ambience-in-architectural-threejs-scenes.md

**Technique**: Resource budgeting for performance

**How it applies**:
- Texture limits for device compatibility
- Transparency limits for performance
- WebGPU vs WebGL considerations

**Code snippet**: *(No code — guidelines)*

**Gotchas/tips**:
- **Texture limit: 2048px** max for broad device support
- **Limit transparent/reflective surfaces** — conflicts with frosted glass needs
- WebGPU not viable for broad production support
- **Use cheap lights (AmbientLight, HemisphereLight)** for base illumination
- **Minimize shadow-casting lights** — each adds a render pass

---

## 22. Conditional Rendering & Memory Lifecycle

**Source**: p1-creating-an-immersive-3d-weather-visualization-with-react-th.md

**Technique**: Skip unused components entirely

**How it applies**:
- Only mount active effects
- Reduce GPU/memory load when effects not visible
- R3F-specific optimizations

**Code snippet**: *(Conceptual)*

**Gotchas/tips**:
- **Conditional rendering** — Only mount active effects
- **Portal mode: 87.5% particle reduction** (800→100 rain, 400→50 snow)
- **Skip expensive effects when not visible** — Sky component skipped at night
- **Resolution budget: 256px** for portal textures
- **Memory lifecycle: `useMemo`** for all objects created once to eliminate GC churn

---

# SECTION 7: COLOR & ATMOSPHERE

## 23. Color Temperature for Atmosphere

**Source**: p1-mastering-threejs-lighting-illuminating-your-3d-world.md

**Technique**: Warm/cool color choices for mood

**How it applies**:
- Cool blue tones for TRON/cyberpunk aesthetic
- Warm amber for contrast accents
- Low-intensity ambient for dark scenes

**Code snippet**: *(Conceptual)*
> "Color temperature: warm tones (amber) for cozy, cool tones (blue) for dramatic"

**Gotchas/tips**:
- Use cool tones (blue-ish: `0x6699ff`) for TRON feel
- Combine with low-intensity ambient
- Ambient should be very low (0.1-0.3 intensity) for night scenes
- Use dark gray/blue tones, not pure black

---

# TECHNIQUES NOT FOUND IN SOURCES

The following techniques you requested are **NOT covered** in the provided documentation:

| Technique | Status | Notes |
|-----------|--------|-------|
| **Orthographic camera** | ❌ Not mentioned | Need separate research |
| **Frosted glass/translucent materials** | ❌ Not covered | Need MeshPhysicalMaterial with transmission, roughness, thickness |
| **Selective bloom/glow** | ❌ Not detailed | Bloom applies to whole scene — need UnrealBloomPass with layers |
| **Soft shadow configuration** | ❌ Not detailed | Need PCFSoftShadowMap + shadow.mapSize settings |
| **Three.js Fog component** | ❌ Not covered | Fog mentioned conceptually but no implementation |
| **Caustics for light-through-glass** | ❌ Not covered | Advanced technique requiring custom shaders |

---

# SUMMARY: TOP TECHNIQUES FOR YOUR SCENE

**Most Critical (Implement First)**:
1. PointLight with distance control for internal lights
2. Post-processing Bloom for glow effect
3. Blue noise dithering for volumetric performance
4. Baked emissive materials for neon aesthetic

**For Frosted Glass Effect**:
- Combine SDF Cylinder + FBM noise for natural light diffusion
- Use cube camera shadows for omnidirectional shadows
- WARNING: Context advises limiting transparent surfaces

**For TRON Aesthetic**:
- RectAreaLight for neon panels
- Cool color temperature (0x6699ff)
- Henyey-Greenstein phase function for dramatic beams
- Low-intensity fill with rim light separation

**Performance with Many Lights**:
- Blue noise dithering (50 steps vs 250)
- Baked lightmaps for static lights
- Limit shadow-casting lights (1-2 max)
- InstancedMesh for repeated geometry
- Cheap AmbientLight/HemisphereLight for base
# Extracted Techniques for Target Scene

## 1. CubeMaps Over HDRI for Bloom Control

**Technique**: Environment mapping strategy for bloom-heavy scenes

**How it applies**: For your TRON-like neon aesthetic with selective bloom, using CubeMaps instead of HDRI prevents overblown reflections that bloom would amplify uncontrollably. This keeps your neon glow effects controlled and intentional rather than washing out the scene.

**Code snippet**: (Conceptual - no direct code provided)
> "CubeMaps are preferred over HDRI when using bloom effects. HDRI causes excessive reflections that bloom amplifies uncontrollably, while CubeMaps simulate environmental lighting without introducing bright direct light sources."

**Gotchas/tips**:
- HDRI + bloom = uncontrollable highlight amplification
- CubeMaps provide environmental lighting without introducing bright direct light sources
- Essential for maintaining dark, moody aesthetic with selective glow

---

## 2. Selective Bloom (Two-Pass Rendering)

**Technique**: Isolate specific objects for bloom effect using multi-pass rendering

**How it applies**: Use this to make only your frosted glass primitives with internal lights glow, while keeping the ground plane and other elements sharp. The technique renders bloom targets against black to isolate them.

**Code snippet**:
```javascript
// Pass 1: bloom only (black background isolates bloom targets)
scene.background = new THREE.Color(0x000000);
bloomComposer.render();

// Pass 2: combine base + bloom
scene.background = originalBackground;
finalComposer.render();
```

**Gotchas/tips**:
- Two EffectComposer passes — monitor GPU cost for performance
- Black background in pass 1 is critical for isolating bloom targets
- Final shader blends `tDiffuse` (base) with bloom texture

---

## 3. Shader Injection into Standard Materials

**Technique**: Hook custom GLSL into Three.js standard materials via chunk replacement

**How it applies**: For your frosted glass/translucent meshes, you can inject custom fragment logic into MeshPhysicalMaterial (or similar) to create custom light transmission effects without rewriting entire shaders.

**Code snippet**:
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

**Gotchas/tips**:
- Replace at `#include <dithering_fragment>` to hook into standard materials without rewriting them
- Allows leveraging built-in PBR lighting while adding custom effects
- Use `onBeforeCompile` on material to access shader object

---

## 4. Additive Blending for Glow Accumulation

**Technique**: Blend mode configuration for light emission effects

**How it applies**: For light emanating outward from your glass primitives, use additive blending to make the glow accumulate and intensify naturally — critical for the neon TRON aesthetic.

**Code snippet**:
```javascript
particleMat.transparent = true;
particleMat.blending = THREE.AdditiveBlending;
```

**Gotchas/tips**:
- Must set **both** `transparent = true` AND `blending = THREE.AdditiveBlending`
- Without both, glow effects won't accumulate properly
- Creates natural light叠加 (layering) effect

---

## 5. Fragment Discard for Selective Rendering

**Technique**: Early fragment rejection in shader

**How it applies**: Can be used to create selective visibility effects on your glass primitives — for example, creating patterns in the translucent material or controlling where light emanates.

**Code snippet**:
```glsl
if(noise < uProgress) discard;

float edgeWidth = uProgress + uEdge;
if(noise > uProgress && noise < edgeWidth){
    gl_FragColor = vec4(vec3(uEdgeColor), noise);
}
```

**Gotchas/tips**:
- Fragment discard is fast but not free — early discards help performance
- Can be combined with noise for organic patterns
- Useful for creating controlled "light leakage" patterns

---

## 6. Performance: Bounded Particle/Light Systems

**Technique**: Recycling pattern for managing many small elements

**How it applies**: If you have many small light sources or particle-like glow effects emanating from your glass primitives, use bounded arrays and recycling to prevent memory growth and maintain performance.

**Code snippet**:
```javascript
const dist = vec1.distanceTo(vec2);

if (dist > particleMaxOffsetArr[i]) {
    particleCurrPosArr[x] = particleInitPosArr[x];
    particleCurrPosArr[y] = particleInitPosArr[y];
    particleCurrPosArr[z] = particleInitPosArr[z];
}
```

**Gotchas/tips**:
- Reset elements when they exceed bounds — prevents unbounded drift, memory growth, and perf degradation
- Attribute updates run every frame but only touch visible portion of arrays
- Particle/element count bounded by vertex buffer size; test on target hardware

---

## 7. Distance-Based Size/Intensity Scaling

**Technique**: Shader-based size attenuation

**How it applies**: For point lights emanating through glass, you can use distance-based scaling to make light falloff feel natural. Works well with orthographic camera where normal perspective falloff doesn't apply.

**Code snippet**:
```glsl
// Vertex shader
float size = uBaseSize * uPixelDensity;
size = size / (aDist + 1.0);
gl_PointSize = size / -viewPosition.z;
```

**Gotchas/tips**:
- Provides manual control over falloff — useful for orthographic camera
- Can be adapted for intensity/alpha as well as size

---

## Summary: Directly Applicable Techniques

| Technique | Primary Use Case |
|-----------|-----------------|
| CubeMaps > HDRI | Controlled bloom in dark neon scene |
| Selective Bloom (Two-Pass) | Glow only on specific objects |
| Shader Injection | Custom glass/transmission effects |
| Additive Blending | Proper light accumulation |
| Fragment Discard | Selective visibility patterns |
| Bounded Recycling | Performance with many light sources |
| Distance Scaling | Light falloff control (ortho camera) |# Relevant Techniques for Dark Scene with Neon/Glow Aesthetic

## CubeMaps Over HDRI for Controlled Bloom

**How it applies:** HDRI creates uncontrollable reflections that bloom amplifies, causing overexposed highlights. CubeMaps simulate environmental lighting without introducing bright direct light sources — essential for dark TRON-like scenes where you want bloom only on specific elements.

**Code snippet:**
```javascript
**Key insight:** CubeMaps are preferred over HDRI when using bloom effects. HDRI causes excessive reflections that bloom amplifies uncontrollably, while CubeMaps simulate environmental lighting without introducing bright direct light sources.
```

**Gotchas/Tips:**
- HDRI will fight against selective bloom — reflections become bloom sources
- CubeMaps give you controlled, predictable lighting that won't bloom unexpectedly
- Essential for maintaining dark atmosphere while having glowing elements

---

## Selective Bloom via Two-Pass Rendering

**How it applies:** Achieve TRON-like glow on specific objects only (e.g., frosted glass with internal lights) while keeping the rest of the scene dark. Bloom affects only designated elements, not the entire environment.

**Code snippet:**
```javascript
// Pass 1: bloom only (black background isolates bloom targets)
scene.background = new THREE.Color(0x000000);
bloomComposer.render();

// Pass 2: combine base + bloom
scene.background = originalBackground;
finalComposer.render();
```

**Gotchas/Tips:**
- Two EffectComposer passes — monitor GPU cost
- Black background in pass 1 isolates bloom targets
- Final shader blends tDiffuse (base) with bloom texture
- Bloom only affects dissolving edge, not environment

---

## Additive Blending for Glowing Particles/Meshes

**How it applies:** Create light emanation effect from frosted glass meshes. Additive blending causes colors to accumulate and brighten where they overlap — perfect for TRON neon glow aesthetic.

**Code snippet:**
```javascript
// Required material settings
particleMat.transparent = true;
particleMat.blending = THREE.AdditiveBlending;
```

**Gotchas/Tips:**
- MUST set both transparent = true AND blending = THREE.AdditiveBlending
- Without both, particles won't glow or accumulate brightness
- Overlapping geometry becomes brighter — use deliberately for glow concentration

---

## Shader Injection into Standard Materials

**How it applies:** Hook custom glow/translucency logic into Three.js standard materials without full rewrites. Useful for frosted glass effects where you want PBR base + custom extensions.

**Code snippet:**
```javascript
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

**Gotchas/Tips:**
- Replace at #include <dithering_fragment> to hook into standard materials
- Allows extending PBR materials without rewriting them
- Fragment discard is fast but not free — use strategically

---

## Distance-Based Sizing for Performance

**How it applies:** For many small light sources (particles representing lights), size them inversely to camera distance. Combined with distance-based shrinking as particles travel from origin.

**Code snippet:**
```glsl
// Vertex shader — size inversely proportional to camera distance
void main(){
    vec3 viewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_PointSize = uBaseSize / -viewPosition.z;
}

// Distance-based shrinking (particles shrink as they travel)
float size = uBaseSize * uPixelDensity;
size = size / (aDist + 1.0);
gl_PointSize = size / -viewPosition.z;
```

**Gotchas/Tips:**
- Combine camera distance + travel distance for natural falloff
- Use pixel density multiplier for consistent appearance across devices

---

## Fragment Discard for Selective Rendering

**How it applies:** Render glow only where needed — e.g., only on edge zones of frosted glass meshes. Reduces overdraw and keeps bloom controlled to specific areas.

**Code snippet:**
```glsl
// Fragment shader — particles only render in edge zone
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

**Gotchas/Tips:**
- Early discards in non-glow zones help performance
- Fragment discard is fast but not free
- Use for selective glow zones on meshes

---

## Particle Recycling for Bounded Performance

**How it applies:** When simulating many small light sources emanating from meshes, recycle particles when they exceed maxOffset. Prevents unbounded drift, memory growth, and perf degradation.

**Code snippet:**
```javascript
// Per-Frame Update with Recycling
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

**Gotchas/Tips:**
- Reset particles when they exceed maxOffset
- Prevents unbounded drift and memory growth
- Particle count bounded by vertex buffer size — test on target hardware

---

## TypedArray Pattern for High-Performance Particle Systems

**How it applies:** Manage many small light sources efficiently with Float32Array attribute buffers. Essential for TRON aesthetic with numerous glowing particles emanating from meshes.

**Code snippet:**
```javascript
let particleCount = meshGeo.attributes.position.count;
let particleMaxOffsetArr: Float32Array;    // max distance from origin
let particleInitPosArr: Float32Array;      // initial positions
let particleCurrPosArr: Float32Array;      // current positions
let particleVelocityArr: Float32Array;     // velocity vectors
let particleSpeedFactor = 0.02;

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

**Gotchas/Tips:**
- Attribute updates run every frame but only touch visible portion of arrays
- Use stride pattern: index * 3 + [0,1,2] for x,y,z access
- Initialize velocity with small random values for organic variation

---

# Techniques for Dark Scene with Volumetric Lighting & Neon Aesthetic

## 1. TRAA (Temporal Reprojection Anti-Aliasing) for Volumetrics

**Technique**: Ray-marched volumes are inherently noisy with few steps, causing banding. Each frame the ray-march offset is jittered using a Halton sequence + Interleaved Gradient Noise, and TRAA accumulates results over 32 frames, turning low-step banding into smooth, high-quality fog.

**How it applies**: Essential for achieving smooth volumetric glow effects around neon primitives without expensive high-step ray marching. Lets you use 2-4 ray-march steps while maintaining visual quality through temporal accumulation.

**Code snippet**:
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

// Generate 32 offsets (base 2, 3) — same length as TRAA's internal sequence
const _haltonOffsets = Array.from(
  { length: 32 },
  ( _, i ) => [ halton( i + 1, 2 ), halton( i + 1, 3 ) ]
);
```

**Gotchas/tips**: 
- Halton count (32) must match TRAA's internal 32-sample jitter cycle. Out of sync = artifacts instead of convergence.
- Trade-off: ghosting on fast motion. Good for slow/ambient scenes.
- For static scenes, freeze animation to let TRAA fully converge.

---

## 2. VolumeNodeMaterial for Volumetric Glow

**Technique**: Three.js WebGPU material specifically designed for ray-marched volumetric effects with configurable step count and blending.

**How it applies**: Use for creating the volumetric glow emanating from frosted glass primitives. Additive blending makes fog brighten with light accumulation (physically motivated for in-scattering) — perfect for neon glow.

**Code snippet**:
```javascript
const volumetricMaterial = new THREE.VolumeNodeMaterial();
volumetricMaterial.steps = 12;
volumetricMaterial.transparent = true;
volumetricMaterial.blending = THREE.AdditiveBlending;
```

**Gotchas/tips**:
- `transparent = true` required so volumetric mesh is excluded from depth pre-pass but included in scene pass.
- Steps adjustable 2–16. Fewer steps = faster but more banding (TRAA compensates).
- Use fewer steps (4-6) for performance with many light sources, rely on TRAA to smooth.

---

## 3. Temporal Jitter with Interleaved Gradient Noise

**Technique**: Each pixel's ray-march start is offset using IGN perturbed by the Halton sequence, distributing banding artifacts across frames for TRAA to accumulate away.

**How it applies**: Critical for smooth volumetric light shafts emanating from internal point lights through frosted glass.

**Code snippet**:
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

**Gotchas/tips**:
- Sync these uniforms with TRAA's Halton sequence each frame (see Animation Loop below).

---

## 4. Multi-Octave 3D Noise for Density Variation

**Technique**: Three octaves of 3D noise sampled at different scales, multiplied together for organic detail, animated over time at different speeds.

**How it applies**: Creates subtle atmospheric fog/haze in your dark scene. Can be tuned for anything from uniform glow to turbulent smoke around neon primitives.

**Code snippet**:
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

**Gotchas/tips**:
- `smokeAmount.mix(1, density)`: When smokeAmount=0 returns 1 (uniform fog). Higher = more noise contrast.
- Use `RepeatWrapping` on 3D texture — the `.mod(1)` on UVs causes seams without it.

---

## 5. 3D Noise Texture Baking

**Technique**: Pre-bake Perlin noise into a Data3DTexture for efficient GPU sampling during ray marching.

**How it applies**: Provides the density variation for atmospheric effects. 128³ is small enough for cache-friendly repeated sampling.

**Code snippet**:
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

**Gotchas/tips**:
- `unpackAlignment = 1` required for RedFormat single-byte-per-texel. Default 4 causes row stride mismatch.
- 128³ = 2MB memory footprint — suitable for most GPUs.

---

## 6. Multi-Pass Render Pipeline

**Technique**: Three-pass architecture: (1) Depth pre-pass for opaques only, (2) Scene pass with MRT for color+velocity, (3) TRAA pass for temporal accumulation.

**How it applies**: Essential foundation for volumetric effects. Depth pre-pass ensures volumetric rays stop at opaque surfaces (ground plane, glass primitives). MRT saves a full scene traversal.

**Code snippet**:
```javascript
renderPipeline = new THREE.RenderPipeline( renderer );

// --- Pass 1: Depth Pre-Pass (opaque only) ---
const prePass = depthPass( scene, camera );
prePass.name = 'Pre Pass';
prePass.transparent = false;
const prePassDepth = prePass.getTextureNode( 'depth' );

// Feed depth into volumetric material for proper occlusion
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );

// --- Pass 2: Scene Pass (full scene + volumetric, MRT) ---
const scenePass = pass( scene, camera );
scenePass.name = 'Scene Pass';
scenePass.setMRT( mrt( {
  output: output,
  velocity: velocity
} ) );
const scenePassColor = scenePass.getTextureNode();
const scenePassVelocity = scenePass.getTextureNode( 'velocity' );

// --- Pass 3: TRAA ---
const traaPass = traa( scenePassColor, prePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```

**Gotchas/tips**:
- Depth pre-pass excludes transparent objects automatically — volumetric mesh won't occlude itself.
- MRT writes color + velocity in one draw call instead of two passes.

---

## 7. Depth-Aware Volumetric Occlusion

**Technique**: Pre-pass depth fed into `volumetricMaterial.depthNode` so ray marching terminates at opaque surfaces.

**How it applies**: Volumetric glow correctly stops at your dark ground plane and behind frosted glass primitives — light doesn't pass through solid geometry unrealistically.

**Code snippet**:
```javascript
volumetricMaterial.depthNode = prePassDepth.sample( screenUV );
```

**Gotchas/tips**:
- For frosted glass effect, you may want partial depth occlusion — adjust density near surfaces.

---

## 8. Point Light with Soft Shadows

**Technique**: Standard point light with shadow mapping and subtle intensity reduction to avoid fully black shadows.

**How it applies**: Use inside frosted glass primitives for internal glow. Shadow mapping creates the light emanating onto the ground plane.

**Code snippet**:
```javascript
pointLight = new THREE.PointLight( 0xf9bb50, 3, 100 );
pointLight.castShadow = true;
pointLight.position.set( 0, 1.4, 0 );
```

**Gotchas/tips**:
- For many small light sources, consider light clustering or deferred approaches — WebGPU point light limits may apply.
- Shadow maps are per-light; 10+ shadow-casting lights = significant memory.

---

## 9. Soft Shadow Intensity Trick

**Technique**: Set shadow.intensity slightly below 1.0 to prevent fully black shadows.

**How it applies**: In dark scenes with volumetric scattering, some ambient light would always provide fill. Prevents unrealistic pitch-black shadows.

**Code snippet**:
```javascript
spotLight.shadow.intensity = .98;
```

**Gotchas/tips**:
- Tune based on scene — darker scenes need lower values (0.90-0.95) for subtle fill.

---

## 10. Spotlight with Color Projection (God-Rays Effect)

**Technique**: Use a texture as a spotlight projection map to create colored volumetric light cones.

**How it applies**: Create TRON-like colored light beams. Could project patterns through frosted glass for interesting glow effects.

**Code snippet**:
```javascript
spotLight = new THREE.SpotLight( 0xffffff, 100 );
spotLight.position.set( 2.5, 5, 2.5 );
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 0;
spotLight.map = new THREE.TextureLoader().setPath( 'textures/' ).load( 'colors.png' );
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
```

**Gotchas/tips**:
- `penumbra = 1` gives softest spotlight edges — essential for organic neon glow.
- `decay = 2` is physically correct inverse-square falloff.

---

## 11. Animation Loop with Temporal Uniform Sync

**Technique**: Synchronize temporal uniforms with TRAA's Halton sequence each frame for proper accumulation.

**How it applies**: Required for smooth volumetric effects. Also handles light animation for orbiting/moving glow sources.

**Code snippet**:
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

  animationTime += delta;
  shaderTime.value = animationTime;

  // Animate lights
  pointLight.position.x = Math.sin( animationTime * 0.7 ) * scale;
  pointLight.position.y = Math.cos( animationTime * 0.5 ) * scale;

  renderPipeline.render();
}
```

---

## 12. Performance Optimizations

**Technique**: Multiple strategies for maintaining performance with volumetric effects.

**How it applies**: Critical for supporting many small light sources and maintaining frame rate.

| Aspect | Setting | Impact |
|--------|---------|--------|
| **DPR disabled** | Render at 1x device pixels | Multi-pass (3x full-screen) very costly at retina |
| **Ray march steps** | 2–16, default 12 | Fewer = faster, TRAA smooths banding |
| **3D texture size** | 128³ = 2MB | Fits in texture cache for repeated sampling |
| **Texture reads** | 3 per ray step × 12 steps = 36/pixel | Main shader bottleneck |
| **MRT** | Single draw call for color+velocity | Saves full scene traversal |
| **Depth pre-pass** | Early ray termination | Avoids wasted steps behind geometry |

**Gotchas/tips**:
- For many light sources, use lower ray-march steps (4-6) and rely on TRAA.
- Consider light clustering or deferred rendering for 10+ shadow-casting lights.
- At retina DPR (2-3x), the 3-pass pipeline becomes very expensive — consider quality toggle.

---

## 13. TSL (Three Shader Language) Pattern

**Technique**: All shader logic defined in JavaScript using TSL's node-based API instead of raw GLSL/WGSL.

**How it applies**: Write custom volumetric effects, glow shaders, and light behavior in a portable way that works across WebGPU backends.

**Code snippet**:
```javascript
import { vec2, vec3, Fn, texture3D, screenUV, uniform, screenCoordinate,
         pass, depthPass, mrt, output, velocity, fract,
         interleavedGradientNoise } from 'three/tsl';
```

**Gotchas/tips**:
- This is Three.js's WebGPU-era shader authoring approach — not compatible with WebGL backend.
- Functions like `Fn`, `vec3`, `texture3D` are TSL node constructors, not GLSL intrinsics.

---

## Summary: Architecture for Target Aesthetic

```
┌─────────────────────────────────────────────────────────┐
│  Dark Scene with Neon Primitives & Volumetric Glow      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ Depth Pass  │───▶│ Scene Pass  │───▶│   TRAA      │ │
│  │ (opaques)   │    │ + Volumetric│    │ Accumulate  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                  │                           │
│         ▼                  ▼                           │
│  depthTexture       color + velocity                   │
│         │                                           │
│         ▼                                           │
│  volumetricMaterial.depthNode                        │
│                                                         │
│  Scene Contents:                                       │
│  • Dark ground plane (opaque)                         │
│  • Frosted glass primitives (translucent mesh)        │
│  • Internal point lights (per primitive)              │
│  • VolumeNodeMaterial for glow (AdditiveBlending)     │
│  • Soft shadows (shadow.intensity ~0.95)              │
│  • Low ray-march steps (4-6) + TRAA for performance  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
# Techniques Relevant to Dark Scene + TRON Aesthetic

## 1. Internal Point Light Inside Mesh

**Technique**: Embed a `pointLight` inside a mesh group so light emanates from within the object

**How it applies**: For frosted glass primitives, place a pointLight at the center of translucent mesh so light glows outward through the material

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
- Point light intensity kept low (2.5) because cumulative lighting comes from multiple sources
- `distance` parameter controls light falloff range — essential for containing glow to nearby surfaces
- Light is positioned at `[0, 0, 0]` relative to parent group, placing it at exact center of mesh

---

## 2. Flashing/Pulsing Light Source (Lightning Pattern)

**Technique**: Rapid intensity changes on a pointLight with ref-based cooldown to create flashing effects

**How it applies**: For TRON aesthetic, can create pulsing neon lights or flickering effects on specific objects

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
- `lightningActive.current` ref prevents stacking multiple flashes
- `Math.random() < 0.003` per frame creates natural intervals without hardcoded timers
- High intensity (90) with short duration (400ms) creates dramatic flash
- `decay={0.8}` softens falloff for more atmospheric spread
- Use `castShadow` selectively — only on lights that need to cast dynamic shadows

---

## 3. Instanced Mesh for Many Objects (Performance)

**Technique**: Use `instancedMesh` with a single reusable `THREE.Object3D` dummy to render thousands of objects in one draw call

**How it applies**: Essential for rendering many small light-emitting objects or particles in a TRON scene without killing performance

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
- Particles recycle when falling below threshold — infinite effect without allocation
- `instanceMatrix.needsUpdate = true` must be set after updating all instances
- For TRON: use `meshBasicMaterial` with emissive-looking colors for neon particles

---

## 4. Ref-Based State for Animation (No Re-renders)

**Technique**: Use `useRef` for animation state that changes every frame to prevent React re-renders

**How it applies**: Critical for smooth bloom animations, pulsing lights, and blend transitions in a dark scene

**Code snippet**:
```javascript
// Lightning cooldown example
const lightningActive = useRef(false);

// Portal blend animation
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
- Refs don't trigger re-renders — essential for frame-perfect animations
- `THREE.MathUtils.lerp` provides smooth interpolation for blend/intensity changes
- Use refs for any value updated in `useFrame`

---

## 5. Selective Bloom Post-Processing

**Technique**: Apply bloom only to bright/emissive objects using `EffectComposer` with threshold

**How it applies**: Creates TRON-like neon glow on specific objects while keeping dark areas dark

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

// Conditional visibility
const showLensFlare = useMemo(() => {
  if (isNight || !weatherData) return false;
  return shouldShowSun(weatherData);
}, [isNight, weatherData]);
```

**Gotchas/tips**:
- `threshold={0.9}` ensures only very bright objects bloom
- For selective bloom: set bloom threshold high and make target objects very bright
- `intensity={0.3}` keeps bloom subtle — increase for more dramatic TRON glow
- Conditionally render entire `EffectComposer` to disable when not needed

---

## 6. Dark/Atmospheric Background with Stars

**Technique**: Skip sky component at night, use black background with `Stars` component

**How it applies**: Creates dark base for TRON scene where neon lights stand out

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
- No Sky component = black background automatically
- `saturation={0}` gives white stars — increase for colored stars
- For TRON: skip Sky entirely, use `<color attach="background" args={['#000000']} />` for pure black

---

## 7. Transparent/Translucent Materials

**Technique**: Use `transparent` and `opacity` properties for see-through materials

**How it applies**: For frosted glass effect — combine with internal pointLight

**Code snippet**:
```javascript
<meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
```

**Gotchas/tips**:
- `transparent` must be explicitly set to true
- Lower opacity = more translucent
- For frosted glass: combine with `transmission` property (not shown in doc, would need `MeshPhysicalMaterial`)

---

## 8. Performance Optimization Table

| Optimization | Main Scene | Portal Mode | Savings |
|-------------|-----------|-------------|---------|
| Rain particles | 800 | 100 | 87.5% |
| Snow particles | 400 | 50 | 87.5% |
| Cloud count | 6+ (60-80 segments each) | 2 (35-40 segments) | ~67% |

**Gotchas/tips**:
- Scale particle counts dramatically for performance
- Reduce geometry segments in lower-priority scenes
- Conditional rendering skips entire systems (sunny weather skips all particles)

---

## Not Directly Covered (Would Need Additional Research)

- **Orthographic camera setup** — doc uses perspective
- **Frosted glass material (MeshPhysicalMaterial with transmission)** — doc uses basic transparent materials
- **Soft shadows configuration** — `castShadow` mentioned but not shadow softness settings
- **Fog/atmosphere** — not explicitly covered
- **Selective bloom on specific objects only** — doc uses global bloom with threshold; for object-specific bloom would need layers or render passes
# Relevant Techniques for Dark Scene with Neon/Glass Aesthetic

## 1. WebGPU Renderer Setup

**Technique**: Using WebGPURenderer instead of WebGLRenderer for TSL-native rendering and modern post-processing.

**How it applies**: Essential foundation for TRON-like aesthetic — enables TSL shaders, GPU compute, and advanced post-processing pipelines required for bloom/glow effects on glass primitives.

**Code snippet**:
```javascript
const renderer = new THREE.WebGPURenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
```

**Gotchas/tips**:
- WebGPU required — TSL is WebGPU-native, won't work with WebGLRenderer
- Browser support varies — requires WebGPU-enabled browser
- Must use `renderAsync()` not `render()` for async rendering

---

## 2. Environmental Lighting with PMREMGenerator

**Technique**: Pre-filtered Mipmap Radiance Estimator (PMREM) generates environment maps for physically-based ambient lighting and reflections.

**How it applies**: For dark scenes with glass/translucent materials, environment maps provide subtle reflections and ambient illumination. RoomEnvironment creates a soft interior lighting feel even in dark scenes.

**Code snippet**:
```javascript
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromSceneAsync(environment).texture;
scene.environmentIntensity = 0.8;
```

**Gotchas/tips**:
- `environmentIntensity` controls ambient contribution — lower values (0.3-0.5) for darker scenes
- RoomEnvironment provides soft interior lighting; consider custom HDRIs for specific aesthetics
- PMREMGenerator is expensive at runtime — pre-generate when possible

---

## 3. DirectionalLight for Primary Illumination

**Technique**: Standard directional light for primary scene illumination with shadows.

**How it applies**: For dark scenes with ground planes, a subtle directional light provides the main illumination source and casts soft shadows. Position above and behind camera for dramatic TRON-like rim lighting.

**Code snippet**:
```javascript
const light = new THREE.DirectionalLight("#e7e2ca", 5);
light.position.set(0.0, 1.2, 3.86);
scene.add(light);
```

**Gotchas/tips**:
- Warm colors ("#e7e2ca") work well with neon for contrast
- Intensity may need adjustment based on bloom pass — values interact
- For soft shadows, configure `light.shadow.mapSize` and `light.shadow.radius`

---

## 4. Fog & Dark Background

**Technique**: Scene fog for atmospheric depth and consistent dark background.

**How it applies**: Directly achieves TRON-like minimal atmosphere. Fog fades distant objects into the background, creating depth. Setting background to fog color ensures seamless integration.

**Code snippet**:
```javascript
scene.fog = new THREE.Fog(new THREE.Color("#41444c"), 0.0, 8.5);
scene.background = scene.fog.color;
```

**Gotchas/tips**:
- Near plane at 0.0 means fog starts immediately — increase for clearer foreground
- Far distance (8.5) controls where objects fully fade — adjust based on scene scale
- Dark gray-blue tones ("#41444c") work better than pure black for fog
- For orthographic camera, adjust fog distances based on zoom level

---

## 5. Post-Processing Bloom Pipeline

**Technique**: TSL bloom pass extracts bright areas and creates glow effect — core for neon aesthetic.

**How it applies**: Essential for TRON-like neon glow on specific objects. Bloom makes emissive materials and bright areas "bleed" light, simulating light emanating through glass.

**Code snippet**:
```javascript
const composer = new THREE.PostProcessing(renderer);
const scene_pass = pass(scene, camera);

// ... MRT setup ...

const scene_color = scene_pass.getTextureNode("output");

// Bloom parameters: strength, radius, threshold
const bloom_pass = bloom(ao_denoise, 0.3, 0.2, 0.1);

// Final composite
composer.outputNode = ao_denoise.add(bloom_pass).add(post_noise);
```

**Gotchas/tips**:
- Bloom threshold (0.1) controls what brightness triggers glow — lower = more objects glow
- Strength (0.3) and radius (0.2) control intensity and spread
- For selective bloom, use emissive materials with high intensity only on target objects
- Bloom is expensive — consider lower resolution for bloom pass on mobile

---

## 6. MRT (Multiple Render Targets) for Post-Processing

**Technique**: Single geometry pass outputs color, depth, and normals simultaneously for use in post-processing.

**How it applies**: Enables depth-aware post-processing effects. For selective bloom, depth information allows isolating specific objects. Also required for AO pass which enhances soft shadows.

**Code snippet**:
```javascript
const scene_pass = pass(scene, camera);

scene_pass.setMRT(mrt({
    output: output,
    normal: normalView
}));

const scene_color = scene_pass.getTextureNode("output");
const scene_depth = scene_pass.getTextureNode("depth");
const scene_normal = scene_pass.getTextureNode("normal");
```

**Gotchas/tips**:
- MRT avoids redundant draw calls — one pass produces all needed buffers
- Depth and normal buffers enable AO, denoising, and depth-based effects
- Memory overhead — multiple render targets consume more VRAM

---

## 7. Velocity-Driven Emissive Color (TSL Pattern)

**Technique**: Dynamic emissive materials using TSL nodes — color and intensity driven by data/velocity.

**How it applies**: Pattern for creating pulsing/animated neon glow on glass primitives. Velocity magnitude drives both hue rotation and emission intensity — applicable to any animated attribute, not just velocity.

**Code snippet**:
```javascript
const emissive_color = color(new THREE.Color("0000ff"));
const vel_at = velocity_storage_at.toAttribute();
const hue_rotated = vel_at.mul(Math.PI * 10.0);
const emission_factor = length(vel_at).mul(10.0);

mesh.material.emissiveNode = hue(emissive_color, hue_rotated).mul(emission_factor).mul(5.0);
```

**Gotchas/tips**:
- `emissiveNode` is the TSL way to set emission — works with bloom automatically
- `hue()` function rotates color — useful for animated rainbow/chasing effects
- Emission intensity multipliers (5.0, 10.0) need tuning based on bloom threshold
- For static neon glow, use simpler: `mesh.material.emissiveNode = color("#00ffff").mul(2.0)`

---

## 8. Ambient Occlusion for Soft Shadows

**Technique**: Screen-space ambient occlusion adds contact shadows and depth to dark scenes.

**How it applies**: Enhances the dark aesthetic by darkening areas where objects meet (ground plane contact) and adding subtle soft shadows. Critical for grounded, realistic look in dark scenes.

**Code snippet**:
```javascript
const ao_pass = ao(scene_depth, scene_normal, camera);
ao_pass.resolutionScale = 1.0;

const ao_denoise = denoise(ao_pass.getTextureNode(), scene_depth, scene_normal, camera)
    .mul(scene_color);
```

**Gotchas/tips**:
- `resolutionScale = 0.5` provides significant performance boost on lower-end hardware
- Denoising is important for AO — raw AO is noisy
- AO works best with depth and normal buffers from MRT
- For dark scenes, AO contribution naturally enhances the moody atmosphere

---

## 9. GPU Compute for Performance (Many Objects/Lights)

**Technique**: TSL compute functions run entirely on GPU, avoiding CPU bottlenecks.

**How it applies**: For many small light sources or animated objects, GPU compute eliminates CPU-GPU data transfer. Pattern: define with `Fn()`, compute with `.compute(count)`.

**Code snippet**:
```javascript
// Storage buffer pattern for GPU-side data
const count = geometry.attributes.position.count;
const position_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);
const velocity_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), "vec3", count);

// Compute initialization
const compute_init = Fn(() => {
    position_storage_at.element(instanceIndex).assign(initial_position.element(instanceIndex));
    velocity_storage_at.element(instanceIndex).assign(vec3(0.0, 0.0, 0.0));
})().compute(count);

renderer.computeAsync(compute_init);

// Per-frame compute update
const compute_update = Fn(() => {
    // GPU-side logic here
})().compute(count);

// Animation loop
function animate() {
    renderer.computeAsync(compute_update);
    renderer.renderAsync(scene, camera);
}
```

**Gotchas/tips**:
- All computation runs on GPU — no CPU-GPU data transfer per frame
- Pre-allocate buffers once, not per-frame
- `instanceIndex` is the GPU-side loop variable
- Compute runs BEFORE render — call `computeAsync()` before `renderAsync()`
- For many lights: use compute to update light positions/intensities, then render

---

## 10. Storage Buffer Linking to Rendering

**Technique**: Connecting GPU compute output to mesh vertex positions.

**How it applies**: After computing positions/colors on GPU, link to material for rendering. Pattern applies to any GPU-computed attribute.

**Code snippet**:
```javascript
mesh.material.positionNode = position_storage_at.toAttribute();
```

**Gotchas/tips**:
- `toAttribute()` converts storage buffer to a renderable attribute
- Can link other attributes: `colorNode`, `emissiveNode`, etc.
- This is how GPU-computed data reaches the shader

---

## 11. Uniforms for CPU → GPU Communication

**Technique**: Uniforms provide CPU-controlled values that GPU shaders can read.

**How it applies**: For interactive scenes, uniforms let CPU send pointer position, time, or other controls to GPU compute. Also useful for global parameters like fog density or bloom intensity.

**Code snippet**:
```javascript
const u_input_pos = uniform(new THREE.Vector3(0, 0, 0));
const u_input_pos_press = uniform(0.0);
const u_spring = uniform(0.05);
const u_friction = uniform(0.9);
```

**Gotchas/tips**:
- Uniforms are single values shared across all GPU threads
- Update uniforms from CPU each frame: `u_input_pos.value.copy(newPosition)`
- Efficient for global parameters — one upload reaches all shader instances

---

## 12. Film Grain Noise for Atmosphere

**Technique**: Procedural noise overlay for cinematic atmosphere.

**How it applies**: Adds subtle texture to dark scenes, preventing flat/banded appearance in shadows. Enhances TRON-like sci-fi aesthetic.

**Code snippet**:
```javascript
const post_noise = mx_noise_float(
    vec3(uv(), time.mul(0.1)).mul(sizes.width), 0.03
).mul(1.0);

composer.outputNode = ao_denoise.add(bloom_pass).add(post_noise);
```

**Gotchas/tips**:
- Uses TSL's `mx_noise_float()` — procedural GPU noise, no texture lookup
- Time-based animation creates subtle "film grain" movement
- Keep multiplier subtle (0.5-1.0) to avoid distracting from main content

---

## Summary: Key Patterns for Target Aesthetic

| Requirement | Primary Technique | Supporting Techniques |
|-------------|-------------------|----------------------|
| Dark scene | Fog + dark background | Low environmentIntensity |
| Orthographic camera | Standard camera setup | Adjust fog distances for ortho |
| Glass/translucent materials | MeshStandardMaterial with metalness/roughness | PMREM environment for reflections |
| Light through glass | Emissive materials + bloom | emissiveNode, bloom pass |
| Selective bloom | High emissive on target objects | Bloom threshold tuning |
| Soft shadows | Ambient occlusion | Depth/normal MRT |
| Atmosphere | Fog + film grain noise | Denoised AO |
| TRON neon aesthetic | Emissive color + bloom | Velocity-driven hue rotation |
| Many lights performance | GPU compute | Storage buffers, uniforms |

---

## Not Applicable (Skipped)

- **TextGeometry creation** — specific to text rendering
- **Text centering** — specific to text baseline issues  
- **Spring physics** — specific to destruction animation
- **Noise deformation** — specific to destruction effect
- **Font loading** — specific to text assets

---

## Gaps in Document Coverage

The document does **not** cover these techniques needed for the target aesthetic:
- **Orthographic camera setup** — uses PerspectiveCamera; adaptation needed
- **Frosted glass material** — would need transmission, roughness, thickness
- **Internal point lights in meshes** — no volumetric/interior lighting
- **Light cookies/gobo patterns** — for light emanating through glass
- **Volumetric lighting** — for visible light beams in atmosphere# Relevant Techniques from Codrops Blended Material Shader Tutorial

## Overview
This document focuses on wireframe-to-solid blending effects, but contains several techniques transferable to the dark/neon aesthetic.

---

## 1. Light Count Optimization for Performance

### Technique
Drastically reduce the number of lights in the scene — each light adds significant GPU cost.

### How it applies
For a TRON-like aesthetic with "many small light sources," consider:
- Using **fake lights** (emissive materials + bloom) instead of actual PointLights
- Limiting real lights to 2-3 key sources
- The doc achieved identical visuals at **120fps vs 30fps** by cutting from 6 to 2 lights

### Code snippet
```javascript
// Performance note from the doc:
// "The Blackbird project went from 6 lights (30fps on M1 Max) to 2 lights (120fps) 
// with no visual difference. 'The lights in WebGL have consequences.'"
```

### Gotchas/tips
- Real lights are expensive — use sparingly
- For "many small lights" aesthetic, prefer emissive materials + post-process bloom
- Test on mid-range hardware, not just M1 Max

---

## 2. Render Target Compositing (Applicable to Selective Bloom)

### Technique
Render specific objects to off-screen `WebGLRenderTarget` textures, then composite them back using a fullscreen quad with a custom shader.

### How it applies
For **selective bloom/glow on specific objects**:
1. Render glowing objects to a render target (with black background)
2. Apply blur pass to the render target texture
3. Composite (add/blend) the blurred result back onto the main scene
4. This isolates bloom to only the objects you want glowing

### Code snippet
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

```javascript
// Multi-pass rendering pattern
render() {
  // Pass 1: render specific objects to target
  Stage.renderer.setRenderTarget(this.targetWireframe);
  Stage.renderer.render(this.scene, this.camera);
  this.material.uniforms.u_texture_wireframe.value = this.targetWireframe.texture;

  // Pass 2: render different objects or same with different material
  Stage.renderer.setRenderTarget(this.targetSolid);
  Stage.renderer.render(this.scene, this.camera);
  this.material.uniforms.u_texture_solid.value = this.targetSolid.texture;

  // CRITICAL: Reset to default framebuffer
  Stage.renderer.setRenderTarget(null);
}
```

### Gotchas/tips
- **Always call `setRenderTarget(null)`** after off-screen passes or normal rendering breaks
- Match render target resolution to `viewport * devicePixelRatio` for crisp output
- Render targets consume GPU memory — size appropriately

---

## 3. Device Pixel Ratio Capping

### Technique
Limit `devicePixelRatio` to a maximum of 2 to prevent excessive GPU work on high-DPI screens.

### How it applies
For dark scenes with glow effects, over-rendering on 4K/Retina displays can kill performance. Cap DPR to balance quality vs. speed.

### Code snippet
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
  viewport.devicePixelRatio = Math.min(window.devicePixelRatio, 2); // Cap at 2x
};
```

### Gotchas/tips
- Ultra-high-density screens (3x, 4x DPR) waste GPU without visible benefit
- For bloom/glow effects, lower resolution can actually look better (natural blur)

---

## 4. MeshNormalMaterial for Lighting-Free Prototyping

### Technique
Use `MeshNormalMaterial` to render geometry without any lighting calculations — useful for prototyping before adding expensive lights.

### How it applies
When building a complex dark scene, prototype geometry and camera angles first without lighting overhead. Add actual materials once composition is set.

### Code snippet
```javascript
// src/gl/torus.js
import { Mesh, MeshNormalMaterial, TorusKnotGeometry } from 'three';

export default class Torus extends Mesh {
  constructor() {
    super();
    this.geometry = new TorusKnotGeometry(1, 0.285, 300, 26);
    this.material = new MeshNormalMaterial(); // No lighting needed
    this.position.set(0, 0, -8);
  }
}
```

### Gotchas/tips
- **Eliminates all lighting GPU cost** — great for testing framerates
- Won't show actual light interactions — switch to real materials for final look
- Useful for isolating performance issues (if MeshNormalMaterial is slow, it's geometry not lighting)

---

## 5. Viewport Cache Object (Avoid Layout Thrashing)

### Technique
Cache all window dimension reads in a single object, updated only on resize. Prevents repeated `window.innerWidth` calls that trigger DOM reflow.

### How it applies
For smooth dark scenes with glow effects, every millisecond counts. Avoid layout thrashing in render loops.

### Code snippet
```javascript
// src/gl/viewport.js
export const viewport = {
  width: 0,
  height: 0,
  devicePixelRatio: 1,
  aspectRatio: 0,
};

// Read from the object, not window, in render loops
// viewport.width instead of window.innerWidth
```

### Gotchas/tips
- Reading `window.innerWidth`/`innerHeight` triggers document reflow
- Cache once on resize, read from cache elsewhere
- Default values to `0` for SSR safety (`window` is undefined server-side)

---

## 6. Stage/Actor Delegation Pattern

### Technique
A central `Stage` class auto-delegates `render()` and `resize()` to all scene children that implement those methods — no manual registration needed.

### How it applies
Clean architecture for managing multiple glowing primitives, lights, and effects. Each object manages its own render logic.

### Code snippet
```javascript
// src/gl/stage.js
class Stage {
  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
    this.scene.children.forEach((child) => {
      if (child.render && typeof child.render === 'function') child.render();
    });
  }

  resize() {
    this.renderer.setSize(viewport.width, viewport.height);
    this.camera.aspect = viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.scene.children.forEach((child) => {
      if (child.resize && typeof child.resize === 'function') child.resize();
    });
  }
}
```

### Gotchas/tips
- Objects can implement `render()` and/or `resize()` as needed
- No manual registration — just add to scene
- Keep files small and single-purpose — "800-line mega-classes are nightmares when debugging WebGL"

---

## 7. ResizeObserver for Responsive Canvas

### Technique
Use `ResizeObserver` instead of `window.onresize` for canvas resize handling. Built-in debouncing, fires on init.

### How it applies
Ensures bloom/glow render targets resize correctly with the canvas.

### Code snippet
```javascript
// src/components/GlCanvas.tsx
onMount(() => {
  if (!el) return;
  gl = Stage;
  gl.init(el);
  gl.render();
  observer = new ResizeObserver((entry) => gl.resize());
  observer.observe(el);
});

onCleanup(() => { if (observer) observer.disconnect(); });
```

### Gotchas/tips
- **ResizeObserver > window resize**: Auto-debounced, fires on init (no need for manual initial call)
- Don't forget cleanup to prevent memory leaks

---

## Techniques NOT Covered (Absent from Source Document)

The following techniques relevant to the target aesthetic are **not in this document**:
- Orthographic camera setup (doc uses PerspectiveCamera)
- Frosted glass/translucent materials
- Point lights inside mesh primitives
- Soft shadows
- Fog/atmosphere
- Bloom post-processing (though render targets are a building block)
- TRON-style neon materials