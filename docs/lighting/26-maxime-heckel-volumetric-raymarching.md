# Maxime Heckel — "On Shaping Light: Volumetric Lighting with Post-Processing and Raymarching"

**Date:** June 2025
**URL:** https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/

## Overview

Deep-dive on implementing volumetric lighting (light beams through fog) using post-processing passes and raymarching. Builds custom effect for god rays or misty scenes.

## Key Techniques

- Coordinate transformations
- Raymarching loops for light accumulation
- Signed distance functions (SDFs) for shaping
- Shadow mapping for occlusion
- Noise (FBM) and scattering for fog density
- Blue noise dithering optimization

## Code Example (Raymarching Loop)

```glsl
float t = STEP_SIZE;
for (int i = 0; i < NUM_STEPS; i++) {
  vec3 samplePos = rayOrigin + rayDir * t;
  if (t > cameraFar) break;
  float distanceToLight = length(samplePos - lightPos);
  float attenuation = exp(-0.05 * distanceToLight);
  fogAmount += attenuation * lightIntensity;
  t += STEP_SIZE;
}
```

## Why Relevant

Perfect for moody, atmospheric effects—creates visible light shafts, shadow beams, and volumetric fog that enhance dramatic, stylized scenes.

## Tags

`#volumetric` `#raymarching` `#god-rays` `#sdf` `#fog` `#advanced`
