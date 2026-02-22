### 4. **Creating an Immersive 3D Weather Visualization with React Three Fiber** (September 18, 2025)
   - **Link**: [https://tympanus.net/codrops/2025/09/18/creating-an-immersive-3d-weather-visualization-with-react-three-fiber](https://tympanus.net/codrops/2025/09/18/creating-an-immersive-3d-weather-visualization-with-react-three-fiber)
   - **Overview**: A step-by-step guide to building a dynamic 3D weather app in React Three Fiber (R3F), integrating real-time data for effects like sun/moon lighting, rain, snow, and storms.
   - **Key Techniques**: Point lights for sun/moon; instanced particles for rain/snow with physics (drift, rotation); dark clouds with high opacity; lightning via timed point light flashes; dynamic sky with turbidity and inclination for dawn/dusk moods; conditional rendering based on weather APIs.
   - **Why Bonus Points?**: Highly atmospheric—storms with brooding clouds, lightning, and heavy rain create moody, immersive effects; overcast or night setups add stylized drama.
   - **Code Example** (Lightning in Storm Component):
     ```javascript
     useFrame((state) => {
       if (Math.random() < 0.003 && !lightningActive.current) {
         lightningActive.current = true;
         lightningLightRef.current.intensity = 90;
         setTimeout(() => { lightningLightRef.current.intensity = 0; lightningActive.current = false; }, 400);
       }
     });
     ```

---

## Deep Dive — Extracted Learnings

# Creating an Immersive 3D Weather Visualization with React Three Fiber

## Code Snippets & Implementations

### Sun Component with Lighting

```javascript
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};
```

Uses a 2K sun texture from Solar System Scope (CC0). The `pointLight` intensity is deliberately low (2.5) because most scene lighting comes from Drei's Sky component.

---

### Rain Particle System (Instanced Rendering)

```javascript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) particle.y = 20;
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

Uses `instancedMesh` with a single reusable `dummy` Object3D — one geometry is transformed via matrix math instead of creating thousands of individual meshes. Particles recycle top-to-bottom continuously.

---

### Snow Particle System with Drift

```javascript
const Snow = ({ count = 400 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.03 + 0.01,
        drift: Math.random() * 0.02 + 0.01,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
      if (particle.y < -1) {
        particle.y = 20;
        particle.x = (Math.random() - 0.5) * 20;
      }
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.rotation.x = state.clock.elapsedTime * 2;
      dummy.rotation.y = state.clock.elapsedTime * 3;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <icosahedronGeometry args={[0.15, 3]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </instancedMesh>
  );
};
```

Drift uses `Math.sin(state.clock.elapsedTime + i)` — the offset `i` gives each snowflake its own sinusoidal path. Rotation on both X/Y axes creates realistic tumbling.

---

### Storm System with Lightning

```javascript
const Storm = () => {
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame(() => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        lightningLightRef.current.position.x = (Math.random() - 0.5) * 10;
        lightningLightRef.current.intensity = 90;
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <DreiClouds material={new THREE.MeshLambertMaterial()}>
        <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
          color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
      </DreiClouds>
      <Rain count={1500} />
      <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
        intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
    </group>
  );
};
```

Lightning uses a ref-based cooldown (`lightningActive`) to prevent continuous flashing. The 0.3% probability per frame creates realistic irregularity. Random X position varies strike location.

---

### Clouds with Portal Mode

```javascript
const Clouds = ({ intensity = 0.7, speed = 0.1, portalMode = false }) => {
  if (portalMode) {
    return (
      <DreiClouds material={new THREE.MeshLambertMaterial()}>
        <Cloud segments={40} bounds={[8, 3, 3]} volume={8}
          color="#FFFFFF" fade={50} speed={speed} opacity={intensity} position={[0, 4, -2]} />
        <Cloud segments={35} bounds={[6, 2.5, 2.5]} volume={6}
          color="#FFFFFF" fade={50} speed={speed} opacity={intensity} position={[2, 3, -3]} />
      </DreiClouds>
    );
  }
  // Full scene: ~6 clouds with segments 60-80
  return (
    <DreiClouds material={new THREE.MeshLambertMaterial()}>
      <Cloud segments={80} bounds={[12, 4, 4]} volume={15}
        color="#FFFFFF" fade={50} speed={speed} opacity={intensity} position={[-5, 4, -2]} />
      {/* ...additional clouds */}
    </DreiClouds>
  );
};
```

Portal mode: 2 simplified clouds. Full mode: 6 detailed clouds. A 67% reduction in geometry for small previews.

---

### Weather Type Detection

```javascript
export const getWeatherConditionType = (condition) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return 'sunny';
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'stormy';
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return 'cloudy';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rainy';
  if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) return 'snowy';
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) return 'foggy';
  return 'cloudy';
};
```

Order matters: check `'storm'` before `'rain'` to prevent thunderstorms from being classified as simple rain.

---

### Conditional Weather Rendering

```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.5} /></>;
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return <><Clouds intensity={0.8} /><Rain count={portalMode ? 100 : 800} /></>;
  } else if (weatherType === 'snowy') {
    return <><Clouds intensity={0.6} /><Snow count={portalMode ? 50 : 400} /></>;
  } else if (weatherType === 'stormy') {
    return <Storm />;
  } else if (weatherType === 'cloudy') {
    return <>{isNight ? <Moon /> : <Sun />}<Clouds intensity={0.7} /></>;
  }
};
```

Portal mode drops particle counts by ~87.5% (rain: 800 to 100, snow: 400 to 50).

---

### Dynamic Sky Configuration (Time-of-Day)

```javascript
const getTimeOfDay = () => {
  if (!weatherData?.location?.localtime) return 'day';
  const currentHour = new Date(weatherData.location.localtime).getHours();
  if (currentHour >= 19 || currentHour <= 6) return 'night';
  if (currentHour >= 6 && currentHour < 8) return 'dawn';
  if (currentHour >= 17 && currentHour < 19) return 'dusk';
  return 'day';
};

// Sky rendering:
{timeOfDay !== 'night' && (
  <Sky
    sunPosition={timeOfDay === 'dawn' ? [100, -5, 100]
      : timeOfDay === 'dusk' ? [-100, -5, 100] : [100, 20, 100]}
    turbidity={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 8 : 2}
  />
)}

// Night:
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
```

Sun below horizon (negative Y = -5) triggers atmospheric scattering for warm sunrise/sunset colors. Sky component is skipped at night entirely — black background + Stars is both better-looking and faster.

---

### Forecast Portals with MeshPortalMaterial

```javascript
const ForecastPortal = ({ position, dayData, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  const portalWeatherData = useMemo(() => ({
    current: {
      temp_f: dayData.day.maxtemp_f,
      condition: dayData.day.condition,
      is_day: 1, // Force daytime
    },
    location: { localtime: dayData.date + 'T12:00' } // Noon for optimal lighting
  }), [dayData]);

  useFrame(() => {
    if (materialRef.current) {
      const targetBlend = isFullscreen ? 1 : 0;
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0, targetBlend, 0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} resolution={256}>
          <WeatherVisualization weatherData={portalWeatherData} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
      {!isFullscreen && (
        <Text position={[-0.8, 1.0, 0.1]} fontSize={0.18} color="#FFFFFF">
          {formatDay(dayData.date)}
        </Text>
      )}
    </group>
  );
};
```

`roundedPlaneGeometry` from maath provides organic corners. `THREE.MathUtils.lerp` at factor 0.1 creates ~10-frame smooth blend between preview and fullscreen.

---

### Lens Flare with Post-Processing

```javascript
const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.0} glareSize={1.68}
        starPoints={2} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};

// Visibility logic:
const showLensFlare = useMemo(() => {
  if (isNight || !weatherData) return false;
  return shouldShowSun(weatherData); // false for overcast, rain, storm, snow
}, [isNight, weatherData]);
```

---

### API Integration with Caching & Fallback

```javascript
// 10-minute cache
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

// Rate limit fallback
if (error.response?.status === 429) {
  return getDemoWeatherData(location); // Returns time-aware synthetic data
}
```

---

## Key Techniques & Patterns

| Technique | How It Works |
|-----------|-------------|
| **Instanced Rendering** | `instancedMesh` renders thousands of particles in a single draw call via matrix transforms |
| **Time-Based Animation** | `state.clock.elapsedTime` drives all continuous motion — rotation, drift, tumbling |
| **Sinusoidal Drift** | `Math.sin(time + particleIndex)` gives each snowflake a unique oscillation path |
| **Atmospheric Scattering** | Drei's `Sky` generates sunrise/sunset colors when sun position Y is negative |
| **Portal Rendering** | `MeshPortalMaterial` renders complete 3D scenes to textures on 2D planes |
| **Conditional Component Loading** | Only active weather effects are mounted — sunny skips all particle systems |
| **Ref-Based Cooldown** | Lightning uses `useRef` boolean to prevent overlapping flash cycles |

---

## Practical Tips & Gotchas

1. **Never create `new Object3D()` in the animation loop** — use `useMemo` to create a single dummy object at mount. Per-frame allocation causes GC pressure.

2. **Always set `instanceMatrix.needsUpdate = true`** after updating particle transforms, or particles freeze in place.

3. **Check weather condition string order** — `'storm'` must be checked before `'rain'` to avoid misclassification.

4. **Force `is_day: 1` in portal data** — without this, forecast portals may show nighttime styling depending on actual forecast time.

5. **Skip Sky component at night** — it's computationally expensive and a black backdrop with Stars looks better and performs faster.

6. **Lens flare position must track the sun** — the hardcoded `[0, 5, 0]` only works because Sun stays at `[0, 4.5, 0]`. Animated suns need dynamic position passing.

7. **Adjust particle recycling boundaries if camera moves** — the reset threshold `y < -1` / respawn at `y = 20` depends on camera distance from origin.

8. **Portal resolution 256 is the sweet spot** — higher values (512+) increase GPU memory per portal. With 3 portals, 256 keeps total texture memory ~768 KB.

9. **Sun texture source**: Solar System Scope (CC0). Moon: Wikimedia Commons. Verify license compatibility.

---

## Performance Considerations

| Concern | Strategy | Impact |
|---------|----------|--------|
| **Particle counts** | Portal mode: 87.5% reduction (800→100 rain, 400→50 snow) | Prevents 3200+ simultaneous particles |
| **Draw calls** | `instancedMesh` collapses 1000 particles → 1 draw call | Orders of magnitude fewer GPU calls |
| **Conditional rendering** | Only mount active weather components | No wasted polygon processing |
| **Portal textures** | 256px resolution, 3 portals = ~768 KB total | Manageable GPU memory budget |
| **Cloud geometry** | Portal mode: 2 clouds (segments 35-40) vs full: 6 clouds (segments 60-80) | 67% mesh reduction |
| **Sky at night** | Replaced with black background + Stars | Removes expensive atmospheric computation |
| **API caching** | 10-minute Map-based cache | Prevents redundant network requests |
| **Memory lifecycle** | `useMemo` for particle arrays and dummy objects | Eliminates per-frame GC churn |
| **Stars budget** | 5000 points, but only rendered when no rain/snow active | Total particle budget stays manageable |
