# Codrops — "3D Weather Visualization with R3F"

**Date:** September 2025
**URL:** https://tympanus.net/codrops/2025/09/18/creating-an-immersive-3d-weather-visualization-with-react-three-fiber/

## Overview

A step-by-step guide to building a dynamic 3D weather app in React Three Fiber (R3F), integrating real-time data for effects like sun/moon lighting, rain, snow, and storms.

## Key Techniques

- Point lights for sun/moon
- Instanced particles for rain/snow with physics (drift, rotation)
- Dark clouds with high opacity
- Lightning via timed point light flashes
- Dynamic sky with turbidity and inclination for dawn/dusk moods
- Conditional rendering based on weather APIs

## Why Relevant

Highly atmospheric—storms with brooding clouds, lightning, and heavy rain create moody, immersive effects; overcast or night setups add stylized drama.

## Code Example (Lightning)

```javascript
useFrame((state) => {
  if (Math.random() < 0.003 && !lightningActive.current) {
    lightningActive.current = true;
    lightningLightRef.current.intensity = 90;
    setTimeout(() => {
      lightningLightRef.current.intensity = 0;
      lightningActive.current = false;
    }, 400);
  }
});
```

## Tags

`#r3f` `#weather` `#lightning` `#particles` `#atmospheric` `#storm`
