# Codrops — "Interactive Text Destruction with WebGPU and TSL"

**Date:** July 2025
**URL:** https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/

## Overview

Sets up a WebGPU scene using `RoomEnvironment` with `PMREMGenerator` for lighting plus a `DirectionalLight`, with TSL-driven deformation shaders.

## Key Techniques

- WebGPU renderer
- `RoomEnvironment` for lighting
- `PMREMGenerator` for environment maps
- TSL deformation shaders
- DirectionalLight setup

## Why Relevant

Modern WebGPU + TSL pipeline for stylized destruction effects with proper lighting.

## Code Concepts

```javascript
// RoomEnvironment for lighting
const pmremGenerator = new PMREMGenerator(renderer);
const roomEnvironment = new RoomEnvironment();
const envTexture = pmremGenerator.fromScene(roomEnvironment).texture;
scene.environment = envTexture;
```

## Tags

`#webgpu` `#tsl` `#pmremgenerator` `#roomenvironment` `#destruction`
