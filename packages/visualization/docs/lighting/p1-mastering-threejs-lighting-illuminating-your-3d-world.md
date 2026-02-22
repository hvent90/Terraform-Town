### 2. **Mastering Three.js Lighting: Illuminating Your 3D World** (January 6, 2026)
   - **Link**: [https://blog.iamdipankarpaul.com/mastering-threejs-lighting-illuminating-your-3d-world](https://blog.iamdipankarpaul.com/mastering-threejs-lighting-illuminating-your-3d-world)
   - **Overview**: An updated beginner-to-intermediate tutorial covering all core Three.js light types, with interactive demos and sliders for real-time adjustments. It explains how to combine lights for mood (e.g., cinematic night scenes with low-intensity ambient and cool directional lights).
   - **Key Techniques**: Ambient, directional, point, spot, hemisphere, and rect area lights; 3-point lighting setups (key, fill, rim); color temperature for atmosphere; performance tips like using cheap lights for base illumination.
   - **Why Bonus Points?**: Explicit focus on creating mood and atmosphere, such as dramatic spotlights for stylized effects or hemisphere lights for natural, moody outdoor variations.
   - **Code Example** (Directional Light Setup):
     ```javascript
     const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
     directionalLight.position.set(5, 10, 5);
     scene.add(directionalLight);
     const directionalHelper = new THREE.DirectionalLightHelper(directionalLight, 2);
     scene.add(directionalHelper);
     ```

---

## Deep Dive

**Source**: [blog.iamdipankarpaul.com](https://blog.iamdipankarpaul.com/mastering-threejs-lighting-illuminating-your-3d-world) (Jan 6, 2026)
**Note**: Vercel bot challenge blocks automated fetchers (HTTP 429). Content reconstructed from search indices.

An updated beginner-to-intermediate tutorial covering all core Three.js light types with interactive demos and real-time sliders. The article explains how to combine lights for mood (e.g., cinematic night scenes with low-intensity ambient and cool directional lights).

### All Six Three.js Light Types

1. **AmbientLight** — provides overall base illumination without direction; no shadows
2. **DirectionalLight** — parallel rays like sunlight; primary shadow caster
3. **PointLight** — radiates from a point in all directions (light bulb)
4. **SpotLight** — cone-shaped beam with angle/penumbra control
5. **HemisphereLight** — sky-to-ground gradient for natural outdoor lighting
6. **RectAreaLight** — rectangular emitter for window/panel light

### Code Examples

**DirectionalLight with Helper**:
```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight, 2);
scene.add(directionalHelper);
```

**Three-Point Lighting Setup**:
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

### Creating Mood and Atmosphere

- **Cinematic night scenes**: low-intensity ambient + cool directional light
- **Dramatic spotlights**: for stylized, focused effects
- **HemisphereLight**: natural, moody outdoor variations with sky/ground color contrast
- **Color temperature**: warm tones (amber) for cozy, cool tones (blue) for dramatic

### Performance Tips

- Use cheap lights (AmbientLight, HemisphereLight) for base illumination
- Minimize shadow-casting lights — each adds a render pass
- Use light helpers during development for positioning
- Interactive sliders help tune intensity, color, and position in real-time
