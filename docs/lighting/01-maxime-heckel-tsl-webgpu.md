# Maxime Heckel — "Field Guide to TSL and WebGPU"

**Date:** October 2025
**URL:** https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

## Overview

Covers writing shaders in TSL (Three.js Shading Language) for WebGPU, including lighting integration with `positionNode` and `normalNode` for custom materials with proper shadows and reflections.

## Key Techniques

- TSL (Three.js Shading Language) for WebGPU
- `positionNode` and `normalNode` for custom materials
- Proper shadows and reflections in custom shaders
- Lighting integration with TSL

## Why Relevant

Excellent for understanding the future of lighting in Three.js. TSL is renderer-agnostic and compiles to both GLSL and WGSL.

## Code Concepts

```javascript
// TSL allows extending materials while preserving lighting
material.positionNode = /* custom position logic */;
material.normalNode = /* custom normal logic */;
// Lights, shadows, fog still work automatically
```

## Tags

`#tsl` `#webgpu` `#shaders` `#future` `#custom-materials`
