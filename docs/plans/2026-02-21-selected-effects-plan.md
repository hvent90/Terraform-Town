# Selected Effects System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 8 toggleable visual effects that activate when the cube is selected, with an independent control panel mirroring the hover effects UI.

**Architecture:** Mirror the existing hover effects pattern — a `SelectEffectKey` type, `selectedTRef` (smooth 0→1), `selectTogglesRef`, all on the renamed `CubeContext`. New standalone components for orbit ring, data stream particles, and ground beam. Existing components gain additional uniforms for effects that modify the cube/traces directly.

**Tech Stack:** React Three Fiber, Three.js ShaderMaterial, R3F `useFrame`

---

### Task 1: Add Selected Effects Types and Context

**Files:**
- Modify: `src/glowing-cube-2.tsx:31-60` (types and context)

**Step 1: Add SelectEffectKey type and labels after the existing hover types (line ~44)**

After the closing of `EFFECT_LABELS` and `ALL_EFFECTS` and `DEFAULT_TOGGLES`, add:

```tsx
/* ─── Selected Effects System ─── */
type SelectEffectKey = 'orbitRing' | 'dataStream' | 'groundBeam' | 'holoFlicker' | 'edgePulse' | 'faceDataOverlay' | 'statusGlow' | 'traceActivation';

const SELECT_EFFECT_LABELS: Record<SelectEffectKey, string> = {
  orbitRing: 'Orbit Ring',
  dataStream: 'Data Stream',
  groundBeam: 'Ground Beam',
  holoFlicker: 'Holo Flicker',
  edgePulse: 'Edge Pulse',
  faceDataOverlay: 'Face Data Overlay',
  statusGlow: 'Status Glow',
  traceActivation: 'Trace Activation',
};

const ALL_SELECT_EFFECTS: SelectEffectKey[] = Object.keys(SELECT_EFFECT_LABELS) as SelectEffectKey[];

const DEFAULT_SELECT_TOGGLES: Record<SelectEffectKey, boolean> = Object.fromEntries(
  ALL_SELECT_EFFECTS.map(k => [k, false])
) as Record<SelectEffectKey, boolean>;
```

**Step 2: Rename HoverContext to CubeContext and expand the type**

Replace the `HoverContextType` and `HoverContext` (lines 52-60) with:

```tsx
type CubeContextType = {
  togglesRef: React.MutableRefObject<Record<EffectKey, boolean>>;
  hoverTRef: React.MutableRefObject<number>;
  selectTogglesRef: React.MutableRefObject<Record<SelectEffectKey, boolean>>;
  selectedTRef: React.MutableRefObject<number>;
  onSelect: () => void;
  onDeselect: () => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
};

const CubeContext = createContext<CubeContextType>(null!);
```

**Step 3: Update all `useContext(HoverContext)` calls to `useContext(CubeContext)`**

Find and replace every occurrence. These are in:
- `HoverDetector` (line 102)
- `GlowingCube` (line 139)
- `TraceLines` (line 333)
- `GroundParticles` (line 581)
- `GroundLightPool` (line 673)
- `SceneLights` (line 724)

**Step 4: Update App to wire up selected state into context**

In `App()`, add state and refs for selected toggles:

```tsx
const [selectToggles, setSelectToggles] = useState<Record<SelectEffectKey, boolean>>({ ...DEFAULT_SELECT_TOGGLES });

const selectTogglesRef = useRef(selectToggles);
selectTogglesRef.current = selectToggles;
const selectedTRef = useRef(0);
```

Update the context value (rename `hoverCtx` to `cubeCtx`):

```tsx
const cubeCtx = useMemo<CubeContextType>(() => ({
  togglesRef,
  hoverTRef,
  selectTogglesRef,
  selectedTRef,
  onSelect,
  onDeselect,
  tooltipRef,
}), []);
```

Replace `<HoverContext.Provider value={hoverCtx}>` with `<CubeContext.Provider value={cubeCtx}>`.

Add selected toggle callback:

```tsx
const toggleSelectEffect = useCallback((key: SelectEffectKey) => {
  setSelectToggles(prev => ({ ...prev, [key]: !prev[key] }));
}, []);
```

**Step 5: Add selectedT interpolation to HoverDetector**

In `HoverDetector`, destructure `selectedTRef` from context. The `selected` boolean needs to be passed somehow — add it as a prop to `HoverDetector` or derive from context. Simplest: pass `selected` as a prop.

Change the component signature:

```tsx
function HoverDetector({ selected }: { selected: boolean }) {
```

Add to the `useFrame` callback, after the hover interpolation:

```tsx
const selectTarget = selected ? 1 : 0;
selectedTRef.current += (selectTarget - selectedTRef.current) * Math.min(1, delta * 8);
```

Update the JSX in App to pass the prop: `<HoverDetector selected={selected} />`

**Step 6: Verify the app still compiles and runs**

Run: `bun run dev`
Expected: App runs, no errors. Hover effects work as before. No visual changes yet.

**Step 7: Commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add selected effects types, context, and selectedT interpolation"
```

---

### Task 2: Selected Effects Control Panel

**Files:**
- Modify: `src/glowing-cube-2.tsx` (after ControlPanel, ~line 1016)

**Step 1: Add SelectedControlPanel component**

Add right after the existing `ControlPanel` component (before `/* ─── App ─── */`):

```tsx
/* ─── Selected Control Panel ─── */
function SelectedControlPanel({ toggles, onToggle }: {
  toggles: Record<SelectEffectKey, boolean>;
  onToggle: (key: SelectEffectKey) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      position: 'fixed', top: 'auto', left: 16, zIndex: 1000,
      background: 'rgba(10, 8, 5, 0.85)',
      border: '1px solid rgba(255, 150, 50, 0.25)',
      borderRadius: 8,
      padding: collapsed ? '8px 14px' : '12px 16px',
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'rgba(255, 200, 140, 0.7)',
      backdropFilter: 'blur(10px)',
      userSelect: 'none',
      minWidth: 180,
    }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span style={{
          display: 'inline-block',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: 10,
        }}>&#9660;</span>
        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>Selected Effects</span>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ALL_SELECT_EFFECTS.map(key => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <span style={{
                opacity: toggles[key] ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}>
                {SELECT_EFFECT_LABELS[key]}
              </span>
              <div
                onClick={() => onToggle(key)}
                style={{
                  width: 32, height: 16, borderRadius: 8,
                  background: toggles[key] ? 'rgba(255, 136, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${toggles[key] ? 'rgba(255, 136, 0, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: toggles[key] ? '#ff8800' : 'rgba(255, 255, 255, 0.25)',
                  position: 'absolute', top: 2,
                  left: toggles[key] ? 19 : 2,
                  transition: 'left 0.2s ease, background 0.2s',
                  boxShadow: toggles[key] ? '0 0 6px rgba(255, 136, 0, 0.5)' : 'none',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Stack panels using a wrapper in App**

To position the selected panel below the hover panel, wrap both in a flex column container. In `App`'s return JSX, replace:

```tsx
<ControlPanel toggles={toggles} onToggle={toggleEffect} />
```

with:

```tsx
<div style={{
  position: 'fixed', top: 16, left: 16, zIndex: 1000,
  display: 'flex', flexDirection: 'column', gap: 8,
}}>
  <ControlPanel toggles={toggles} onToggle={toggleEffect} />
  <SelectedControlPanel toggles={selectToggles} onToggle={toggleSelectEffect} />
</div>
```

Then remove the `position: 'fixed', top: 16, left: 16, zIndex: 1000` from both `ControlPanel` and `SelectedControlPanel` since the wrapper handles positioning. Keep the rest of their styles.

**Step 3: Verify both panels render**

Run: `bun run dev`
Expected: Both panels visible, stacked vertically. Toggles click on/off in both. No visual effects yet from selected toggles.

**Step 4: Commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add selected effects control panel UI"
```

---

### Task 3: Orbit Ring Effect

**Files:**
- Modify: `src/glowing-cube-2.tsx` (add new component before `/* ─── Ground ─── */`)

**Step 1: Add OrbitRing component**

Insert before the `Ground` component:

```tsx
/* ─── Orbit Ring ─── */
function OrbitRing() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const ringRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float dash = smoothstep(0.4, 0.5, fract(vUv.x * 20.0 - uTime * 0.5));
        vec3 col = vec3(1.0, 0.55, 0.1);
        float alpha = dash * uOpacity * 0.8;
        gl_FragColor = vec4(col * 3.0, alpha);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.orbitRing ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, CUBE_Y, 0]} rotation={[Math.PI / 6, 0, Math.PI / 12]} material={material}>
      <torusGeometry args={[CUBE_SIZE * 0.75, 0.008, 8, 64]} />
    </mesh>
  );
}
```

**Step 2: Add `<OrbitRing />` to App's scene, after `<GlowingCube />`**

```tsx
<GlowingCube />
<OrbitRing />
```

**Step 3: Verify**

Run: `bun run dev`
Expected: Toggle "Orbit Ring" on in selected panel, click cube to select → dashed amber ring orbits the cube. Deselect → ring fades out.

**Step 4: Commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add orbit ring selected effect"
```

---

### Task 4: Data Stream Particles Effect

**Files:**
- Modify: `src/glowing-cube-2.tsx` (add new component after OrbitRing)

**Step 1: Add DataStreamParticles component**

```tsx
/* ─── Data Stream Particles ─── */
function DataStreamParticles() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);
  const particleCount = 200;

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      pos[i * 3 + 1] = Math.random() * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * CUBE_SIZE * 0.8;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    return { positions: pos, speeds: spd };
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float speed;
      uniform float uTime;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        float cycle = fract(pos.y / 1.5 + uTime * speed * 0.3);
        pos.y = cycle * 1.5;
        vAlpha = (1.0 - cycle) * uOpacity;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (1.0 - cycle) * 3.0 + 1.0;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float c = smoothstep(1.0, 0.3, d);
        gl_FragColor = vec4(1.0, 0.6, 0.15, c * vAlpha * 0.6);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.dataStream ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points material={material} position={[0, CUBE_Y + CUBE_SIZE * 0.5, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-speed" count={particleCount} array={speeds} itemSize={1} />
      </bufferGeometry>
    </points>
  );
}
```

**Step 2: Add `<DataStreamParticles />` to scene**

**Step 3: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add data stream particles selected effect"
```

---

### Task 5: Ground Connection Beam Effect

**Files:**
- Modify: `src/glowing-cube-2.tsx` (add new component)

**Step 1: Add GroundConnectionBeam component**

```tsx
/* ─── Ground Connection Beam ─── */
function GroundConnectionBeam() {
  const { selectTogglesRef, selectedTRef } = useContext(CubeContext);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float centerFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
        float heightFade = pow(1.0 - vUv.y, 1.5);
        float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + vUv.y * 8.0);
        float alpha = centerFade * heightFade * pulse * uOpacity * 0.3;
        vec3 col = vec3(1.0, 0.55, 0.1);
        gl_FragColor = vec4(col * 2.0, alpha);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    const s = selectedTRef.current;
    const t = selectTogglesRef.current.groundBeam ? s : 0;
    material.uniforms.uOpacity.value = t;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  const beamHeight = CUBE_Y;

  return (
    <mesh material={material} position={[0, beamHeight / 2, 0]}>
      <planeGeometry args={[CUBE_SIZE * 0.3, beamHeight]} />
    </mesh>
  );
}
```

**Step 2: Add to scene, verify, commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add ground connection beam selected effect"
```

---

### Task 6: Holographic Flicker Effect (modify face shader)

**Files:**
- Modify: `src/glowing-cube-2.tsx` GlowingCube component (face material)

**Step 1: Add `uSelectHoloFlicker` uniform to the face material**

In the `faceMat` useMemo (line ~151), add to uniforms:

```tsx
uHoloFlicker: { value: 0 },
```

**Step 2: Update face fragment shader**

Add before the final `gl_FragColor` line in the face fragment shader:

```glsl
// Holographic flicker
float scanline = smoothstep(0.4, 0.5, fract(vWorldPos.y * 30.0 + uTime * 2.0)) * 0.3;
float flicker = step(0.97, fract(sin(uTime * 43.0) * 4375.5453)) * 0.4;
baseAlpha += (scanline + flicker) * uHoloFlicker;
col = mix(col, vec3(0.7, 0.9, 1.0), (scanline * 0.3 + flicker * 0.2) * uHoloFlicker);
```

Add `uniform float uHoloFlicker;` to the fragment shader uniforms block.

**Step 3: Drive the uniform in useFrame**

In `GlowingCube`'s useFrame, add:

```tsx
const selectToggles = selectTogglesRef.current;
const s = selectedTRef.current;
faceMat.uniforms.uHoloFlicker.value = selectToggles.holoFlicker ? s : 0;
```

Also destructure `selectTogglesRef, selectedTRef` from `useContext(CubeContext)`.

**Step 4: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add holographic flicker selected effect"
```

---

### Task 7: Edge Highlight Pulse Effect (modify edge shader)

**Files:**
- Modify: `src/glowing-cube-2.tsx` GlowingCube component (edge material)

**Step 1: Add uniforms to edge material**

```tsx
uSelectEdgePulse: { value: 0 },
uSelectTime: { value: 0 },
```

**Step 2: Update edge fragment shader**

Add `uniform float uSelectEdgePulse;` and `uniform float uSelectTime;` to the fragment shader.

Before the final `gl_FragColor`, add:

```glsl
float pulse = exp(-mod(uSelectTime, 2.0) * 3.0) * uSelectEdgePulse;
col = mix(col, vec3(1.0, 0.95, 0.9), pulse * 0.6);
alpha = min(alpha + pulse * 0.3 + uSelectEdgePulse * 0.2, 1.0);
```

**Step 3: Drive in useFrame**

Track elapsed time since selection for the one-shot pulse. Add a `selectTimeRef` useRef in GlowingCube:

```tsx
const selectTimeRef = useRef(0);
```

In useFrame:

```tsx
const edgePulseT = selectToggles.edgePulse ? s : 0;
if (edgePulseT > 0.01) selectTimeRef.current += delta;
else selectTimeRef.current = 0;
edgesMat.uniforms.uSelectEdgePulse.value = edgePulseT;
edgesMat.uniforms.uSelectTime.value = selectTimeRef.current;
```

(Need to add `delta` to the useFrame destructure — it's the second arg: `useFrame(({ clock, camera }, delta) => {`)

**Step 4: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add edge highlight pulse selected effect"
```

---

### Task 8: Face Data Overlay Effect (modify face shader)

**Files:**
- Modify: `src/glowing-cube-2.tsx` GlowingCube face material

**Step 1: Add uniform**

```tsx
uDataOverlay: { value: 0 },
```

**Step 2: Update face fragment shader**

Add `uniform float uDataOverlay;` and add before `gl_FragColor`:

```glsl
// Data overlay grid
float gridX = smoothstep(0.9, 0.95, fract(vUv.x * 8.0));
float gridY = smoothstep(0.9, 0.95, fract(vUv.y * 8.0));
float grid = max(gridX, gridY);
float scrollData = step(0.6, fract(sin(floor(vUv.x * 8.0) * 17.0 + floor(vUv.y * 8.0 - uTime * 1.5) * 31.0) * 43758.5453));
float overlay = (grid * 0.4 + scrollData * 0.15) * uDataOverlay;
col = mix(col, vec3(1.0, 0.7, 0.2), overlay);
baseAlpha += overlay * 0.3;
```

**Step 3: Drive in useFrame**

```tsx
faceMat.uniforms.uDataOverlay.value = selectToggles.faceDataOverlay ? s : 0;
```

**Step 4: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add face data overlay selected effect"
```

---

### Task 9: Status Glow Shift Effect

**Files:**
- Modify: `src/glowing-cube-2.tsx` GlowingCube

**Step 1: Add status color constant at the top of the file (constants section)**

```tsx
const STATUS_GREEN = new THREE.Color(0x44ff88);
const STATUS_GREEN_BRIGHT = new THREE.Color(0x88ffbb);
```

**Step 2: In GlowingCube useFrame, apply status glow**

After the existing color temp logic, add:

```tsx
// Status glow shift
const statusT = selectToggles.statusGlow ? s : 0;
if (statusT > 0.001) {
  faceMat.uniforms.uColorInner.value.lerp(STATUS_GREEN, statusT * 0.4);
  faceMat.uniforms.uColorEdge.value.lerp(STATUS_GREEN_BRIGHT, statusT * 0.3);
  edgesMat.uniforms.uColorBot.value.lerp(STATUS_GREEN, statusT * 0.3);
}
```

**Step 3: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add status glow shift selected effect"
```

---

### Task 10: Trace Activation Effect (modify TraceLines)

**Files:**
- Modify: `src/glowing-cube-2.tsx` TraceLines component

**Step 1: Destructure select refs from context**

In `TraceLines`, update the destructure:

```tsx
const { togglesRef, hoverTRef, selectTogglesRef, selectedTRef } = useContext(CubeContext);
```

**Step 2: Add uniforms to trace material**

```tsx
uSelectPulseAlpha: { value: 0 },
uSelectPulseTime: { value: 0 },
```

**Step 3: Add a selectPulseTimeRef**

```tsx
const selectPulseTimeRef = useRef(0);
```

**Step 4: Update the trace fragment shader**

Add uniforms and a second pulse effect. After the existing pulse calculation, add:

```glsl
uniform float uSelectPulseAlpha;
uniform float uSelectPulseTime;
```

And in the main function, after `float pulse = ...`:

```glsl
float selectPhase = fract(d * 0.8 - uSelectPulseTime * 1.5);
float selectPulse = exp(-selectPhase * selectPhase * 20.0) * uSelectPulseAlpha;
pulse = max(pulse, selectPulse);
```

**Step 5: Drive in useFrame**

```tsx
const selectTraceT = selectTogglesRef.current.traceActivation ? selectedTRef.current : 0;
if (selectTraceT > 0.01) selectPulseTimeRef.current += delta;
else selectPulseTimeRef.current = 0;
material.uniforms.uSelectPulseAlpha.value = selectTraceT;
material.uniforms.uSelectPulseTime.value = selectPulseTimeRef.current;
```

(Need to get `delta` from useFrame: `useFrame((_, delta) => {` → `useFrame(({ clock }, delta) => {` if needed for time. Actually the existing TraceLines useFrame uses `(_, delta)` so just keep that pattern.)

**Step 6: Verify and commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: add trace activation selected effect"
```

---

### Task 11: Final Integration and Polish

**Files:**
- Modify: `src/glowing-cube-2.tsx`

**Step 1: Ensure all new components are in the scene JSX**

In App's Canvas, after `<GlowingCube />`:

```tsx
<OrbitRing />
<DataStreamParticles />
<GroundConnectionBeam />
```

**Step 2: Verify all 8 effects work**

Run: `bun run dev`

Test each toggle:
1. Click cube to select it
2. Toggle each of the 8 effects one by one
3. Verify each activates/deactivates smoothly
4. Click away to deselect — verify all effects fade out
5. Toggle some effects on, hover the cube — verify hover effects still work independently

**Step 3: Final commit**

```bash
git add src/glowing-cube-2.tsx
git commit -m "feat: complete selected effects system with all 8 effects"
```
