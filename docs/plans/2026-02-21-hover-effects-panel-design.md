# Hover Effects Control Panel Design

## Summary

Add a floating control panel with toggles for 9 hover effects on the glowing cube. Effects activate on mouse hover over the cube when their toggle is enabled. All changes in `glowing-cube-2.tsx`.

## Hover Detection

- Invisible box mesh at cube position with `onPointerEnter`/`onPointerLeave`
- `hovered` float lerps 0-1 in useFrame (~6 units/sec, ~150ms transition)
- Each effect reads `toggles[effect] ? hovered : 0` for its animation factor

## Effects

1. **Edge intensification** - Lerp edgesMat `uColorBot` toward WHITE_HOT, alpha to 1.0
2. **Face opacity swell** - Add `uHover` uniform, boost baseAlpha cap and inner brightness
3. **Breathing amplification** - Scale amplitude from 0.008 to 0.03
4. **Halo bloom** - Scale sprite 1.2->1.8, opacity 0.15->0.4
5. **Lift + shadow** - Offset cube group Y by +0.1
6. **Particle attraction** - Add `uHover` uniform, shrink particle radii toward cube
7. **Face separation** - Offset each face outward along normal by 0.08
8. **Trace line pulse** - Animate `uPulsePos` uniform inward along trace lines
9. **Color temp shift** - Lerp amber palette toward cool blue-white across all components

## Control Panel

- Fixed position, top-left, translucent dark bg with amber border
- Monospace font matching existing camera button
- Labeled toggle switches per effect
- Collapsible with arrow toggle
- Panel title "Hover Effects"

## Approach

- Pure HTML/CSS overlay (no extra dependencies)
- React state in App, passed via props/context into R3F components
- All effects use smooth lerp transitions in useFrame
