# Codrops — "Warping 3D Text Inside a Glass Torus"

**Date:** March 2025
**URL:** https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/

## Overview

Deep dive into `MeshTransmissionMaterial` (built on `MeshPhysicalMaterial`), exploring how transmission, IOR, and resolution fields control how much light passes through for refraction effects.

## Key Techniques

- `MeshTransmissionMaterial`
- Transmission parameter
- IOR (Index of Refraction)
- Resolution fields
- Refraction lighting

## Why Relevant

Moody glass-refraction lighting. Essential for transparent/translucent stylized objects.

## Key Parameters

```javascript
// MeshTransmissionMaterial key params
material.transmission = 1.0;  // How much light passes through
material.ior = 1.5;           // Index of refraction
material.thickness = 0.5;     // Material thickness
```

## Tags

`#transmission` `#glass` `#refraction` `#meshphysicalmaterial` `#ior`
