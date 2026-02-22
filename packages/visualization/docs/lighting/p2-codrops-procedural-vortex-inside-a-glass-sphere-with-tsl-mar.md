**4. Codrops — "Procedural Vortex Inside a Glass Sphere with TSL" (Mar 2025)**
Uses TSL emission nodes to create glow effects in the center of a volumetric vortex inside glass, blending with fog and god rays. Deeply atmospheric.

---

## Deep Dive

# Procedural Vortex in Glass Sphere — Three.js + TSL

## Code Snippets & Implementations

### 1. Plane Geometry Foundation

```javascript
const planeGeometry = this.planeGeometry = new THREE.PlaneGeometry(
    this.uniforms.uResolution.value.x,
    this.uniforms.uResolution.value.y,
    512,
    512
)

planeGeometry.rotateX( -Math.PI * 0.5 )
const material = new THREE.MeshBasicNodeMaterial( {
    wireframe: true,
    transparent: true,
} )

this.planeMesh = new THREE.Mesh( planeGeometry, material )
this.scene.add( this.planeMesh )
```

High vertex density (512x512) plane oriented horizontally along the XZ plane for shader-based deformations.

### 2. TSL Imports

```javascript
import {
    sin, positionLocal, time, vec2, vec3, vec4, uv, uniform, color, fog, rangeFogFactor,
    texture, If, min, range, instanceIndex, timerDelta, step, timerGlobal,
    mix, max, uint, cond, varying, varyingProperty, Fn, struct, output, emissive, diffuseColor, PI, PI2,
    oneMinus, cos, atan, float, pass, mrt, assign, normalize, mul, log2, length, pow, smoothstep,
    screenUV, distance, instancedArray, instancedBufferAttribute, attribute, attributeArray, pointUV,
    select, equals
} from 'three/tsl'
```

### 3. Basic Color Output

```javascript
material.colorNode = Fn( () => {
   return vec4( 1, 0, 0, 1)
} )()
```

### 4. Centered UV Coordinates with Aspect Ratio Correction

```javascript
material.colorNode = Fn( () => {
   const uResolution = this.uniforms.uResolution;
   const aspect = uResolution.x.div( uResolution.y );
   const _uv = uv().mul( 2 ).sub( 1 );
   _uv.y.mulAssign( aspect );

   return vec4(_uv.xy, 0, 1);
} )()
```

Transforms UV coords so origin is at center. Multiply by 2 and subtract 1, then apply aspect ratio to Y.

### 5. Animated 3D Vector with Time

```javascript
const color = vec3( _uv, 0.0 ).toVar();
color.z.addAssign( 0.5 );
color.assign( normalize( color ) );
color.subAssign( mul( this.uniforms.speed, vec3( 0.0, 0.0, time ) ) );

return vec4(color, 1.0);
```

Creates a normalized 3D vector from UV data + Z component, animated over time for infinite directional motion.

### 6. Logarithmic Rotation (Vortex Core)

```javascript
const angle = float( log2( length( _uv ) ).negate() ).toVar();
color.assign( rotateZ( color, angle ) );

return vec4(color, 1.0);
```

Rotation proportional to the log of distance from center — this creates the whirlpool appearance.

### 7. FBM Noise (5 Octaves)

```javascript
const frequency = this.uniforms.frequency;
const distortion = this.uniforms.distortion;

color.x.assign( fbm3d( color.mul( frequency ).add( 0.0 ), 5 ).add( distortion ) );
color.y.assign( fbm3d( color.mul( frequency ).add( 1.0 ), 5 ).add( distortion ) );
color.z.assign( fbm3d( color.mul( frequency ).add( 2.0 ), 5 ).add( distortion ) );
const noiseColor = this.color.toVar();

return vec4(color, 1.0);
```

3D Perlin noise with 5 octaves applied to each channel independently. Offset inputs (0.0, 1.0, 2.0) generate uncorrelated noise layers.

### 8. Center Isolation with Emission

```javascript
noiseColor.mulAssign( 2 );
noiseColor.subAssign( 0.1 );
noiseColor.mulAssign( 0.188 );
noiseColor.addAssign( vec3(_uv.xy, 0 ) );

const noiseColorLength = length( noiseColor );
noiseColorLength.assign( float( 0.770 ).sub( noiseColorLength ) );
noiseColorLength.mulAssign( 4.2 );
noiseColorLength.assign( pow( noiseColorLength, 1.0 ) );

return vec4( vec3(noiseColorLength), 1 );
```

Isolates vortex center: scale noise (x2), subtract threshold (0.1), reduce magnitude (x0.188), add UV, compute distance from origin, subtract from threshold (0.770), amplify (x4.2).

### 9. Edge Highlighting

```javascript
const fac = length( _uv ).sub( facture( color.add( 0.32 ) ) );
fac.addAssign( 0.1 );
fac.mulAssign( 3.0 );

return vec4( vec3(fac), 1);
```

Subtracts texture fracture values from radial distance and amplifies to emphasize outer boundaries.

### 10. Glow + Color Blending + Alpha

```javascript
// Emission glow
const emissionColor = emission( this.uniforms.emissionColor, noiseColorLength.mul( this.uniforms.emissionMultiplier ) );

// Blend
color.assign( mix( emissionColor, vec3( fac ), fac.add( 1.2 ) ) );

// Alpha transparency
const alpha = float( 1 ).sub( fac );

return vec4( color, alpha );
```

### 11. Fragment Shader Abstracted as Reusable Function with Varying

```javascript
varyings = {
    vSwirl: varying( vec4( 0 ), 'vSwirl' )
}

this.swirlTexture = Fn( ( params ) => {
   const _uv = params.uv.mul( 1 );
   // ... all swirl computation ...
   this.varyings.vSwirl.assign( color );
   return vec4( noiseColor, alpha );
} )
```

Encapsulates texture generation into a reusable function. `varying` passes data from vertex to fragment shader without recomputation.

### 12. Position-Based Vertex Deformation

```javascript
material.positionNode = Fn( () => {
   const uResolution = this.uniforms.uResolution;
   const aspect = uResolution.x.div( uResolution.y );
   const _uv = uv().mul( 2 ).sub( 1 );
   _uv.y.mulAssign( aspect );
   _uv.mulAssign( 1.1 );

   const swirl = this.swirlTexture( { uv: _uv } );
   const finalPosition = positionLocal;
   finalPosition.y.addAssign( swirl.g.mul( 0.9 ) );

   return finalPosition;
} )();
```

Displaces the plane geometry's Y-position using the G-channel of swirl texture (FBM noise Y-component), scaled by 0.9.

### 13. Instanced Particle System

```javascript
const positionAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array( this.planeGeometry.attributes.position.array ), 3
);
const pos = instancedBufferAttribute( positionAttribute );

const uvAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array( this.planeGeometry.attributes.uv.array ), 2
);
const uvA = instancedBufferAttribute( uvAttribute );

const particleMaterial = new THREE.SpriteNodeMaterial( {} );

particleMaterial.positionNode = Fn( () => {
   const uResolution = this.uniforms.uResolution;
   const aspect = uResolution.x.div( uResolution.y );
   const _uv = uvA.mul( 2 ).sub( 1 );
   _uv.y.mulAssign( aspect );

   const swirl = this.swirlTexture( { uv: _uv } );
   const finalPosition = pos.toVar();
   finalPosition.y.addAssign( swirl.g );

   return finalPosition;
} )();

particleMaterial.scaleNode = this.uniforms.size;

const particlesMesh = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), particleMaterial );
particlesMesh.count = this.planeGeometry.attributes.position.count;
particlesMesh.frustumCulled = false;
```

Extracts position/UV from plane as instanced buffers. `SpriteNodeMaterial` renders each as a sprite. `frustumCulled = false` prevents pop-in at edges.

### 14. Particle Culling by Alpha Threshold

```javascript
If( swirl.a.lessThan( this.uniforms.radius ), () => {
    finalPosition.xyz.assign( vec3( 99999999 ) );
} );
```

Particles below alpha threshold are moved to `vec3(99999999)` — effectively invisible without modifying buffers.

### 15. Particle Color from Varying

```javascript
particleMaterial.colorNode = Fn( () => {
   return this.varyings.vSwirl;
} )();
```

Reuses computed color from the varying instead of recalculating.

### 16. Glass Sphere (MeshPhysicalNodeMaterial)

```javascript
const sphereGeometry = new THREE.SphereGeometry( 2.3, 32, 32 );
const sphereMaterial = new THREE.MeshPhysicalNodeMaterial( {
   color: new THREE.Color( 0xffffff ),
   metalness: 0.0,
   roughness: 0,
   ior: 1.5,
   dispersion: 5.0,
   thickness: 0.3,
   clearcoat: 0.73,
   envMapIntensity: 1,
   transmission: 1,
   specularIntensity: 1,
   specularColor: new THREE.Color( 0xffffff ),
   opacity: 1,
   side: THREE.DoubleSide,
   transparent: false,
});
const sphereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
```

Key glass parameters: IOR 1.5 (real glass), transmission 1.0 (full transparency), clearcoat 0.73, dispersion 5.0 (chromatic aberration).

### 17. Environment Map

```javascript
const hdriTexture = this.resources.items.hdriTexture;
hdriTexture.mapping = THREE.EquirectangularReflectionMapping;
this.scene.environment = hdriTexture;
```

---

## Key Techniques & Patterns

- **UV Centering**: `uv().mul(2).sub(1)` moves origin from corner to center; rectangular displays need aspect ratio correction on Y
- **Logarithmic Rotation**: `log2(length(uv)).negate()` as rotation angle creates the swirl — rotation speed increases toward center
- **FBM Noise (5 octaves)**: Applied per-channel with different offsets for uncorrelated organic turbulence
- **Varying Variables**: Compute once in vertex shader, pass to fragment shader — eliminates redundant texture calls
- **Instanced Rendering**: `InstancedBufferAttribute` + `SpriteNodeMaterial` for efficient particle rendering in a single draw call
- **Conditional Culling in Shader**: TSL `If()` repositions unwanted particles to infinity rather than modifying geometry buffers
- **Physical Glass**: IOR (refraction), transmission (transparency), clearcoat (surface reflection), dispersion (rainbow edge aberration)

---

## Practical Tips & Gotchas

1. **Aspect ratio matters**: `mul(2).sub(1)` only works for square planes. Rectangular screens need `_uv.y.mulAssign(aspect)`
2. **Orient geometry before shading**: Rotate plane `-Math.PI * 0.5` on X so Y-axis behaves correctly in the shader
3. **512x512 wireframe is invisible**: At that vertex density, individual wires can't be distinguished at typical display scale
4. **Magic numbers need tuning**: The center isolation thresholds (0.770, 0.188, 4.2) require manual adjustment for your desired visual balance
5. **Hide particles at infinity**: `vec3(99999999)` is simpler than buffer modification or complex culling logic
6. **HDRI choice matters**: The background HDRI significantly affects glass sphere reflections and final composition
7. **`frustumCulled = false`**: Required to prevent particles from disappearing at viewport edges, but means all particles are always processed

---

## Performance Considerations

The author recommends these optimizations:

1. **Reduce particle count & size** — minimize overlaps for fewer overdraw operations
2. **Use WebGPU Storage** — improved performance (WebGPU only)
3. **Precomputed noise texture** — replace runtime FBM with a baked noise texture
4. **Lower-poly glass enclosure** — use a cube instead of sphere, apply normals for interior distortion effects
5. **Bake the vortex texture** — pre-render the vortex and simply rotate the geometry, significantly boosting performance

Additional implicit considerations:
- **Instanced rendering** reduces draw calls from thousands to one
- **Varying variables** prevent redundant per-pixel texture computation
- **Shader-based culling** avoids CPU-side geometry manipulation
