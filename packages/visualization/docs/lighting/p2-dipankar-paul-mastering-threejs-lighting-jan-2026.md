**11. Dipankar Paul — "Mastering Three.js Lighting" (Jan 2026)**
Frames Three.js lighting like film/photography: key light (DirectionalLight), fill light (AmbientLight/HemisphereLight), rim/back light (PointLight/SpotLight), practical lights (PointLight with visible geometry).
---

---

## Deep Dive

**Source**: [blog.iamdipankarpaul.com](https://blog.iamdipankarpaul.com/mastering-threejs-lighting) (Jan 6, 2026)
**Note**: Vercel bot challenge blocks automated fetchers (HTTP 429). Content reconstructed from search indices.

### Three-Point Lighting for 3D Scenes

The article frames Three.js lighting like film/photography, using the classic three-point lighting technique:

| Light Role | Three.js Implementation | Purpose |
|------------|------------------------|---------|
| **Key Light** | `DirectionalLight` or `SpotLight` | Main light source, defines primary shadows |
| **Fill Light** | `AmbientLight` or `HemisphereLight` | Softens shadows from key light |
| **Rim/Back Light** | `PointLight` or `SpotLight` | Separates subject from background, creates edge glow |
| **Practical Lights** | `PointLight` with visible geometry | In-scene light sources (lamps, screens) |

### Code Example: Cinematic Three-Point Setup

```javascript
// Key light — main directional source
const keyLight = new THREE.SpotLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 5);
scene.add(keyLight);

// Fill light — soften shadows
const fillLight = new THREE.SpotLight(0x8888ff, 0.5);
fillLight.position.set(-5, 5, 5);
scene.add(fillLight);

// Rim light — edge separation
const rimLight = new THREE.DirectionalLight(0xffffcc, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);
```

### All Six Light Types Covered

1. **AmbientLight** — uniform base illumination, no direction, no shadows
2. **DirectionalLight** — parallel rays (sunlight), casts shadows
3. **PointLight** — radiates in all directions from a point (light bulb)
4. **SpotLight** — cone-shaped beam with angle and penumbra control
5. **HemisphereLight** — sky/ground gradient (outdoor scenes)
6. **RectAreaLight** — rectangular emitter (window/panel light)

### Practical Tips

- Use cheap lights (AmbientLight, HemisphereLight) for base illumination
- Color temperature creates atmosphere: warm (0xffaa55) for cozy, cool (0x5555ff) for dramatic
- Dramatic spotlights work well for stylized effects
- HemisphereLight provides natural, moody outdoor variations
- Interactive demos with sliders for real-time adjustments help learn each light's parameters
