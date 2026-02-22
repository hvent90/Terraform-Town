### 6. **Enlightening 3D Worlds: Mastering Lighting Techniques in Three.js** (2025, exact date not specified but recent Medium post)
   - **Link**: [https://medium.com/@althafkhanbecse/title-enlightening-3d-worlds-mastering-lighting-techniques-in-three-js-c860caa8cdcf](https://medium.com/@althafkhanbecse/title-enlightening-3d-worlds-mastering-lighting-techniques-in-three-js-c860caa8cdcf)
   - **Overview**: A hands-on article exploring light types and advanced techniques for realistic 3D scenes.
   - **Key Techniques**: Directional, point, spot, and ambient lights; shadow mapping; PBR and IBL for depth; combining for atmospheric effects.
   - **Why Bonus Points?**: Tips on creating captivating atmospheres through light combinations, like soft ambient for moody interiors.
   - **Code Example**:
     ```javascript
     const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
     directionalLight.position.set(0, 10, 0);
     scene.add(directionalLight);
     ```

Here's a curated collection of contemporary Three.js lighting resources, organized from most modern/atmospheric to foundational. I've prioritized 2025–2026 content and stylized/moody material.

---

## Deep Dive

**Source**: [Medium — @althafkhanbecse](https://medium.com/@althafkhanbecse/title-enlightening-3d-worlds-mastering-lighting-techniques-in-three-js-c860caa8cdcf) (2025)
**Note**: Medium blocks automated access (403 Forbidden). Content reconstructed from search indices and companion articles.

The author (Althaf Khan) has a series of Three.js lighting articles on Medium. This article explores light types and advanced techniques for realistic 3D scenes.

### Light Types Covered

**DirectionalLight** — parallel rays simulating sunlight, casting consistent lighting across scenes:
```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);
```

**PointLight** — radiates in all directions from a single point:
```javascript
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 10);
scene.add(pointLight);
```

**SpotLight** — cone-shaped beam with target tracking:
```javascript
const spotlight = new THREE.SpotLight(0x00ff00, 1);
spotlight.position.set(0, 10, 0);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight);
scene.add(spotlight.target);
```

**AmbientLight** — uniform base illumination without direction or shadows.

### Shadow Mapping

Shadows are crucial for creating depth and realism:
```javascript
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
```

### Advanced Techniques

- **PBR (Physically Based Rendering)** — simulates real-world material properties by mimicking how light interacts with different surfaces
- **IBL (Image-Based Lighting)** — uses environment maps to create photorealistic lighting conditions
- **Combining lights** for atmospheric effects — e.g., soft ambient for moody interiors

### Companion Articles by the Same Author

- ["Exploring Different Types of Lighting in Three.js"](https://medium.com/@althafkhanbecse/title-enlightening-3d-worlds-exploring-different-types-of-lighting-in-three-js-3cf06559e423)
- ["Mastering PBR and IBL"](https://medium.com/@althafkhanbecse/elevating-realism-mastering-physically-based-rendering-pbr-and-image-based-lighting-ibl-in-e17c287aa9e1)
- ["Mastering Materials and Textures"](https://medium.com/@althafkhanbecse/illuminating-3d-worlds-mastering-materials-and-textures-in-three-js-1c4984af616b)
