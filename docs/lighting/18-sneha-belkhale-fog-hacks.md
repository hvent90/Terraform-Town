# Sneha Belkhale — "Three.js Fog Hacks"

**Date:** 2025
**URL:** https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386

## Overview

Shows how to replace fog shader chunks via `onBeforeCompile` while keeping integration with scene lights and properties — custom fog that goes beyond `FogExp2`.

## Key Techniques

- `onBeforeCompile` for shader modification
- Custom fog shader chunks
- Scene light integration
- Beyond `FogExp2`
- Atmospheric depth customization

## Code Concepts

```javascript
material.onBeforeCompile = (shader) => {
  // Replace fog chunk with custom implementation
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <fog_fragment>',
    customFogChunk
  );
};
```

## Why Relevant

Custom atmospheric depth. Essential for stylized fog effects that integrate with lighting.

## Tags

`#fog` `#shader-hacks` `#onBeforeCompile` `#custom` `#atmospheric`
