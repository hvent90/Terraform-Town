# Utsubo — "Migrate Three.js to WebGPU (2026)"

**Date:** January 2026
**URL:** https://www.utsubo.com/blog/webgpu-threejs-migration-guide

## Overview

Includes TSL bloom setup: `import { bloom, pass } from 'three/tsl'` with threshold, intensity parameters — the modern way to do post-processing lighting.

## Key Techniques

- WebGPU migration
- TSL bloom setup
- Modern post-processing API
- Threshold and intensity parameters

## Code Example

```javascript
import { bloom, pass } from 'three/tsl';

// Modern TSL bloom
const bloomPass = bloom(threshold, intensity);
```

## Why Relevant

Future-proof bloom implementation. This is where Three.js is heading in 2026.

## Tags

`#webgpu` `#tsl` `#bloom` `#migration` `#future`
