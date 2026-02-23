# Dipankar Paul — "Mastering Three.js Lighting"

**Date:** January 2026
**URL:** https://blog.iamdipankarpaul.com/mastering-threejs-lighting-illuminating-your-3d-world

## Overview

Frames Three.js lighting like film/photography: key light (DirectionalLight), fill light (AmbientLight/HemisphereLight), rim/back light (PointLight/SpotLight), practical lights (PointLight with visible geometry).

## Key Techniques

- Cinematic lighting theory
- 3-point lighting (key, fill, rim)
- Light types for specific roles
- Practical lights with visible geometry
- Color temperature for mood

## Film/Photography Lighting Model

| Role | Light Type | Purpose |
|------|------------|---------|
| Key light | DirectionalLight | Main illumination |
| Fill light | AmbientLight/HemisphereLight | Soften shadows |
| Rim/Back light | PointLight/SpotLight | Separate subject from background |
| Practical lights | PointLight (visible) | Realistic source (lamp, candle) |

## Code Example

```javascript
// Cinematic 3-point setup
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(5, 10, 5);

const fillLight = new THREE.HemisphereLight(0x8888ff, 0xff8844, 0.5);

const rimLight = new THREE.PointLight(0xffffff, 0.5);
rimLight.position.set(-5, 5, -5);
```

## Why Relevant

Cinematic lighting theory applied to Three.js. Essential for moody, film-like scenes.

## Tags

`#cinematic` `#3-point-lighting` `#film-theory` `#mood`
