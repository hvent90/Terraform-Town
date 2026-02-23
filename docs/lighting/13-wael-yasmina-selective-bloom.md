# Wael Yasmina — "Selective Unreal Bloom"

**Date:** 2025
**URL:** https://waelyasmina.net/articles/unreal-bloom-selective-threejs-post-processing/

## Overview

Uses layers to isolate bloomed objects, a bloom `EffectComposer`, and a custom `ShaderPass` to merge bloom textures back with the base scene.

## Key Techniques

- Selective bloom using layers
- `EffectComposer` setup
- `UnrealBloomPass`
- Custom `ShaderPass` for merging
- Layer-based isolation

## Code Concepts

```javascript
// Selective bloom via layers
const BLOOM_LAYER = 1;

// Objects to bloom
bloomedObject.layers.set(BLOOM_LAYER);

// EffectComposer setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(...);

// Custom shader to merge bloom with base
const finalPass = new ShaderPass(FinalShader);
```

## Why Relevant

Essential for making specific objects glow without blooming the entire scene. Perfect for TRON-style effects.

## Tags

`#bloom` `#selective` `#layers` `#post-processing` `#effect-composer`
