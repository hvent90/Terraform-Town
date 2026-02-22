### 3. **On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web** (June 10, 2025)
   - **Link**: [https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/](https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/)
   - **Overview**: A deep-dive tutorial on implementing volumetric lighting (e.g., light beams through fog or openings) using post-processing passes and raymarching in Three.js. It builds a custom effect for atmospheric visuals like god rays or misty scenes.
   - **Key Techniques**: Coordinate transformations; raymarching loops for light accumulation; signed distance functions (SDFs) for shaping (e.g., cylinders, tori); shadow mapping for occlusion; noise (FBM) and scattering for fog-like density; optimizations like blue noise dithering.
   - **Why Bonus Points?**: Perfect for moody, atmospheric effects—creates visible light shafts, shadow beams, and volumetric fog that enhance dramatic, stylized scenes (e.g., light piercing through arches).
   - **Code Example** (Raymarching Loop in GLSL):
     ```glsl
     float t = STEP_SIZE;
     for (int i = 0; i < NUM_STEPS; i++) {
       vec3 samplePos = rayOrigin + rayDir * t;
       if (t > cameraFar) break;
       float distanceToLight = length(samplePos - lightPos);
       float attenuation = exp(-0.05 * distanceToLight);
       fogAmount += attenuation * lightIntensity;
       t += STEP_SIZE;
     }
     ```

---

## Deep Dive

# Volumetric Lighting with Post-Processing and Raymarching

## Code Snippets

### 1. World Position Reconstruction from Screen Space

Converts 2D screen coordinates and depth into 3D world space for raymarching.

```glsl
vec3 getWorldPosition(vec2 uv, float depth) {
  float clipZ = depth * 2.0 - 1.0;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, clipZ, 1.0);

  vec4 view = projectionMatrixInverse * clip;
  vec4 world = viewMatrixInverse * view;

  return world.xyz / world.w;
}
```

Matrix order matters — multiplication is not commutative. The final `/world.w` perspective divide is mandatory.

---

### 2. VolumetricLightingEffect Class

Sets up the post-processing effect with depth buffer access and all uniforms.

```javascript
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
    this.uniforms.get('projectionMatrixInverse').value = this.projectionMatrixInverse;
    this.uniforms.get('viewMatrixInverse').value = this.viewMatrixInverse;
    this.uniforms.get('cameraPosition').value = this.cameraPosition;
    this.uniforms.get('cameraFar').value = this.cameraFar;
    this.uniforms.get('lightDirection').value = this.lightDirection;
    this.uniforms.get('lightPosition').value = this.lightPosition;
    this.uniforms.get('coneAngle').value = this.coneAngle;
  }
}
```

`EffectAttribute.DEPTH` exposes the depth texture as `depthBuffer` in the shader.

---

### 3. Raymarching Loop with Cone Shaping

Accumulates light along a ray, checking cone constraints at each step.

```glsl
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float depth = readDepth(depthBuffer, uv);
  vec3 worldPosition = getWorldPosition(uv, depth);

  vec3 rayOrigin = cameraPosition;
  vec3 rayDir = normalize(worldPosition - rayOrigin);

  vec3 lightPos = lightPosition;
  vec3 lightDir = normalize(lightDirection);

  float coneAngleRad = radians(coneAngle);
  float halfConeAngleRad = coneAngleRad * 0.5;

  float fogAmount = 0.0;
  float lightIntensity = 1.0;
  float t = STEP_SIZE;

  for (int i = 0; i < NUM_STEPS; i++) {
    vec3 samplePos = rayOrigin + rayDir * t;

    if (t > cameraFar) {
      break;
    }

    vec3 toSample = normalize(samplePos - lightPos);
    float cosAngle = dot(toSample, lightDir);

    if (cosAngle < cos(halfConeAngleRad)) {
      t += STEP_SIZE;
      continue;
    }

    float distanceToLight = length(samplePos - lightPos);
    float attenuation = exp(-0.05 * distanceToLight);

    fogAmount += attenuation * lightIntensity;

    t += STEP_SIZE;
  }

  outputColor = vec4(vec3(fogAmount), 1.0) + inputColor;
}
```

---

### 4. Depth-Based Stopping

Prevents light from appearing through scene geometry.

```glsl
float sceneDepth = length(worldPosition - cameraPosition);

for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;

  if (t > sceneDepth || t > cameraFar) {
    break;
  }
  // ...
}
```

---

### 5. SDF-Based Light Shaping (Cylinder)

Uses signed distance functions for arbitrary light volume shapes.

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

Any SDF works (cone, sphere, torus, etc.). `smoothstep` creates soft edges.

---

### 6. Light Camera & Shadow FBO Setup

Creates a virtual camera at the light source to generate a shadow map.

```javascript
const lightCamera = useMemo(() => {
  const cam = new THREE.PerspectiveCamera(90, 1.0, 0.1, 100);
  cam.fov = coneAngle;
  return cam;
}, [coneAngle]);

const shadowFBO = useFBO(shadowMapSize, shadowMapSize, {
  depth: true,
  depthTexture: new THREE.DepthTexture(shadowMapSize, shadowMapSize, THREE.FloatType),
});

useFrame((state) => {
  const { gl, camera, scene } = state;

  lightCamera.position.copy(lightPosition.current);
  const currentLightTargetPos = new THREE.Vector3().addVectors(
    lightPosition.current, lightDirection.current
  );
  lightCamera.lookAt(currentLightTargetPos);
  lightCamera.updateMatrixWorld();
  lightCamera.updateProjectionMatrix();

  const currentRenderTarget = gl.getRenderTarget();
  gl.setRenderTarget(shadowFBO);
  gl.clear(false, true, false);
  gl.render(scene, lightCamera);

  gl.setRenderTarget(currentRenderTarget);
  gl.render(scene, camera);
});
```

---

### 7. Shadow Calculation Function

Determines if a world-space point is occluded from the light.

```glsl
uniform sampler2D shadowMap;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;
uniform float shadowBias;

float calculateShadow(vec3 worldPosition) {
  vec4 lightClipPos = lightProjectionMatrix * lightViewMatrix * vec4(worldPosition, 1.0);
  vec3 lightNDC = lightClipPos.xyz / lightClipPos.w;

  vec2 shadowCoord = lightNDC.xy * 0.5 + 0.5;
  float lightDepth = lightNDC.z * 0.5 + 0.5;

  if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
      shadowCoord.y < 0.0 || shadowCoord.y > 1.0 ||
      lightDepth > 1.0) {
    return 1.0;
  }

  float shadowMapDepth = texture2D(shadowMap, shadowCoord).x;

  if (lightDepth > shadowMapDepth + shadowBias) {
    return 0.0;
  }

  return 1.0;
}
```

---

### 8. Shadow Integration — Skip, Don't Break

```glsl
float shadowFactor = calculateShadow(samplePos);
if (shadowFactor == 0.0) {
  t += STEP_SIZE;
  continue;  // NOT break — points beyond shadow may be lit
}
```

---

### 9. Henyey-Greenstein Phase Function

Simulates directional light scattering.

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

`mu` = dot(rayDir, -lightDir). `g` near 0 = isotropic; positive = forward scattering; negative = backward.

---

### 10. Full Light Accumulation with Beer's Law

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

vec3 finalColor = inputColor.rgb + accumulatedLight;
outputColor = vec4(finalColor, 1.0);
```

---

### 11. Fractal Brownian Motion (FBM) for Organic Fog

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

Time-based offset creates animated drift.

---

### 12. Blue Noise Dithering

Randomized ray offsets to reduce banding while cutting step count ~5x.

```glsl
uniform sampler2D blueNoiseTexture;
uniform int frame;

float blueNoise = texture2D(blueNoiseTexture, gl_FragCoord.xy / 1024.0).r;
float offset = fract(blueNoise + float(frame%32) / sqrt(0.5));
float t = STEP_SIZE * offset;
```

`frame%32` prevents float precision loss. Decorrelates pattern across frames for temporal supersampling.

---

### 13. Cube Camera for Omnidirectional Point Light Shadows

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

---

### 14. Custom Shadow Material for Cube Depth

Three.js lacks native `CubeDepthTexture`, so a custom material stores normalized distance.

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

Swap materials during cube camera render, restore afterward.

---

### 15. Cube Shadow Sampling in Fragment Shader

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

---

## Key Techniques & Patterns

**Coordinate Space Pipeline**: Screen → NDC → Clip → View → World. Inverse matrices reverse this. The `projectionMatrixInverse` then `viewMatrixInverse` order is critical.

**Volumetric vs Surface Raymarching**: Standard raymarching finds first surface intersection. Volumetric raymarching *accumulates contributions along the entire ray*, producing semi-transparent atmospheric effects.

**SDF Shape Control**: Any signed distance function can define light volume boundaries. `smoothstep` on the SDF value creates soft edges. Common SDFs from Inigo Quilez's dictionary apply directly.

**Beer's Law Transmittance**: Models how light is absorbed passing through a medium. Each step multiplies accumulated transmittance by `exp(-density * stepSize)`. Result: exponential falloff through dense media.

**Henyey-Greenstein Phase Function**: Controls whether light scatters forward (toward viewer) or backward. Parameter `g ≈ 0.5` gives realistic atmospheric scattering.

---

## Practical Tips & Gotchas

| Gotcha | Fix |
|--------|-----|
| Light leaks through walls | Add depth-based stopping (`t > sceneDepth`) |
| Shadow acne (self-shadowing speckles) | Add small `shadowBias` (0.001–0.01) |
| Light appears on wrong side of occluder | Use `continue` not `break` in shadow check |
| Cone angle twice as wide as expected | Use `halfConeAngleRad` (divide by 2) |
| Black screen after world pos reconstruction | Check matrix multiplication order; ensure `/world.w` |
| Hard light edges | Add `smoothstep` with `smoothEdgeWidth` on SDF |
| Flickering shadows | Increase shadow map resolution |
| UV origin confusion (DirectX vs OpenGL) | Three.js/WebGL uses OpenGL convention |
| FBM artifacts | Use world-space coordinates for noise sampling |
| Unbounded float precision loss | Use `frame%32` for blue noise frame counter |
| Transmittance too dark | Start transmittance > 1.0 (e.g., 5.0) |
| CubeCamera depth unavailable | Use custom material outputting normalized distance (hack, not production-grade) |
| Use `CameraHelper` during dev to visualize light camera frustum |

---

## Performance Considerations

| Factor | Impact | Guidance |
|--------|--------|----------|
| **Step count** | Dominant cost | 250 steps = high quality; blue noise dithering enables ~50 steps at similar perceived quality |
| **Shadow map resolution** | Per-step texture read | 128² = fast/blocky, 512² = good balance, 1024² = expensive |
| **Cube camera** | 6x scene renders per frame | Major overhead; avoid for directional lights |
| **Multiple lights** | Cost scales linearly with N | N shadow FBOs + N lookups per step; 2 lights shown; 3+ may need optimization |
| **FBM noise** | Multiple texture reads per step | Use small wrapping texture (256²) or generate in-shader |
| **Blue noise dithering** | Negligible cost | Single texture read + fract; huge quality/step-count win |
| **Beer's Law** | Single `exp` per step | Not a bottleneck |
| **Early exit** | Free speedup | Depth/far-plane checks save work on close geometry |
| **Bandwidth** | At 1080p, 50 steps ≈ 500M texture accesses | Compress shadow data, reduce noise resolution |
