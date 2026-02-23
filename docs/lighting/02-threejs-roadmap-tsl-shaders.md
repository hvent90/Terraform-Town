# Three.js Roadmap — "TSL: A Better Way to Write Shaders"

**Date:** December 2025
**URL:** https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs

## Overview

Shows how assigning to `colorNode` feeds your logic into PBR calculations where lights, shadows, and fog all still work — you're extending the material rather than replacing it. Includes an animated glass material with vertex displacement.

## Key Techniques

- `colorNode` for extending PBR materials
- Preserving lights/shadows/fog in custom materials
- Vertex displacement in TSL
- Animated glass material

## Why Relevant

Modern approach to custom materials that preserve lighting. Key for stylized effects without losing PBR benefits.

## Code Concepts

```javascript
// colorNode feeds into PBR calculations
material.colorNode = /* custom color logic */;
// All scene lights still affect the material
```

## Tags

`#tsl` `#pbr` `#custom-materials` `#glass`
