# Wael Yasmina — "Ultra-Realistic Scenes in Three.js"

**Date:** 2025
**URL:** https://waelyasmina.net/articles/how-to-create-ultra-realistic-scenes-in-three.js/

## Overview

Covers HDR, tone mapping, color space, gamma correction, and `MeshPhysicalMaterial` with IOR, transmission, and environment maps for photorealistic results.

## Key Techniques

- HDR (High Dynamic Range)
- Tone mapping
- Color space management
- Gamma correction
- `MeshPhysicalMaterial`
- IOR (Index of Refraction)
- Transmission
- Environment maps

## Code Concepts

```javascript
// HDR + tone mapping setup
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// MeshPhysicalMaterial for realism
const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.1,
  transmission: 0.9,
  ior: 1.5,
  thickness: 0.5,
});
```

## Why Relevant

Foundation for realistic PBR rendering. Essential knowledge for high-quality materials.

## Tags

`#hdr` `#tone-mapping` `#pbr` `#meshphysicalmaterial` `#realistic`
