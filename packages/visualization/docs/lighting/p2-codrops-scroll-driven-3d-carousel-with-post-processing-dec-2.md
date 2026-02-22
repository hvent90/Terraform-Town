**8. Codrops — "Scroll-Driven 3D Carousel with Post-Processing" (Dec 2025)**
Cinematic shader with horizontal wave distortion and chromatic aberration applied to scene edges for a premium feel.

---

## Deep Dive

**Full title**: "The Mechanics Behind a Scroll-Driven Circular 3D Carousel with Three.js and Post-Processing"
**Source**: [tympanus.net/codrops](https://tympanus.net/codrops/2025/12/14/the-mechanics-behind-a-scroll-driven-circular-3d-carousel-with-three-js-and-post-processing/) (Dec 14, 2025)
**Author**: Yousuf Soomro
**Note**: Codrops blocks automated fetchers (HTTP 404). Content reconstructed from search indices and related sources.

The tutorial explores how designer Gionatan Nese created a 2026 portfolio with circular images that respond to mouse movements, maintaining the appearance of a movie.

### Circular Arrangement (Trigonometry)

Images are arranged in a circle using basic trigonometric rules:

```
angle = (index / totalElements) * 2 * Math.PI
x = radius * Math.cos(angle)
y = radius * Math.sin(angle)
```

### Scroll Physics (Inertial Scrolling)

Smooth, momentum-based scrolling using linear interpolation (lerp):

```javascript
// Lerp for smooth scroll with inertia
currentScroll = lerp(currentScroll, targetScroll, lerpFactor);
```

### Cursor Interaction (Raycasting)

3D raycasting detects which carousel item the cursor hovers over, enabling proximity-based effects — items near the cursor respond with scale, rotation, or displacement changes.

### Post-Processing Shader

A custom `DistortionChromaticAberrationShader` fuses two effects into a single pass:

**Horizontal wave distortion** — adds a soft ripple across the scene
**Chromatic aberration** — color channel separation for a cinematic lens feel

The shader uniforms control:
- Distortion intensity
- Wave frequency
- Animation speed
- Chromatic aberration strength
- Start/end parameters defining where effects appear (top and bottom edges only, for a premium cinematic border effect)

### Key Techniques

- Trigonometric circular layout for 3D carousel items
- Lerp-based inertial scroll physics
- Raycasting for mouse proximity effects
- Single-pass post-processing combining wave distortion + chromatic aberration
- Edge-only effects (top/bottom) for cinematic framing
