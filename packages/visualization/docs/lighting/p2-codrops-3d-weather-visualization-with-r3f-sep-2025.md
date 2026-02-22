**7. Codrops — "3D Weather Visualization with R3F" (Sep 2025)**
Simulates dark, brooding storm clouds with flashing pointLight lightning, rain particles, and atmospheric day/night lighting transitions. Peak moody/atmospheric.

---

## Deep Dive

# Creating an Immersive 3D Weather Visualization with React Three Fiber

## Code Snippets & Implementations

### Sun Component (Sun.js)

A texture-wrapped sphere with slow rotation and point lighting:

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

Textures sourced from CC0 materials (Solar System Scope for sun, Wikimedia Commons for moon). Point light intensity kept low because most lighting comes from the sky.

---

### Rain Particle System (Instanced Rendering)

```javascript
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
      if (particle.y < -1) {
        particle.y = 20;
      }
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

Uses `instancedMesh` instead of individual mesh components per raindrop. A single reusable `THREE.Object3D()` dummy avoids garbage collection overhead. Particles recycle when they fall below Y = -1.

---

### Snow with Physics-Based Tumbling

```javascript
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
```

Horizontal drift uses `Math.sin(state.clock.elapsedTime + i)` where the `i` index offsets each particle's phase. Rotation on X and Y axes creates natural tumbling.

---

### Storm Component with Lightning

```javascript
const Storm = () => {
  const cloudsRef = useRef();
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame((state) => {
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      if (lightningLightRef.current) {
        const randomX = (Math.random() - 0.5) * 10;
        lightningLightRef.current.position.x = randomX;
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
      <group ref={cloudsRef}>
        <DreiClouds material={THREE.MeshLambertMaterial}>
          <Cloud segments={60} bounds={[12, 3, 3]} volume={10}
            color="#8A8A8A" fade={100} speed={0.2} opacity={0.8} position={[-3, 4, -2]} />
        </DreiClouds>
        <Rain count={1500} />
        <pointLight ref={lightningLightRef} position={[0, 6, -5.5]}
          intensity={0} color="#e6d8b3" distance={30} decay={0.8} castShadow />
      </group>
    </group>
  );
};
```

Lightning probability ~0.3% per frame. Ref-based cooldown prevents stacking. Intensity resets after 400ms.

---

### Weather Condition Classification

```javascript
export const getWeatherConditionType = (condition) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return 'sunny';
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'stormy';
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return 'cloudy';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rainy';
  if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) return 'snowy';
  return 'cloudy';
};
```

String matching handles variations like "Light rain," "Heavy rain," and "Patchy light drizzle" uniformly.

---

### Conditional Component Rendering

```javascript
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) {
      return (
        <>
          {isNight ? <Moon /> : <Sun />}
          <Clouds intensity={0.5} speed={0.1} />
        </>
      );
    }
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return (
      <>
        <Clouds intensity={0.8} speed={0.15} />
        <Rain count={800} />
      </>
    );
  } else if (weatherType === 'stormy') {
    return <Storm />;
  }
};
```

Only loads components actually needed — sunny days skip particle systems entirely.

---

### Time-of-Day System

```javascript
const getTimeOfDay = () => {
  if (!weatherData?.location?.localtime) return 'day';
  const currentHour = new Date(weatherData.location.localtime).getHours();
  if (currentHour >= 19 || currentHour <= 6) return 'night';
  if (currentHour >= 6 && currentHour < 8) return 'dawn';
  if (currentHour >= 17 && currentHour < 19) return 'dusk';
  return 'day';
};
```

Four periods: Night (7PM-6AM), Dawn (6-8AM), Dusk (5-7PM), Day (8AM-5PM).

---

### Dynamic Sky Configuration

```javascript
{timeOfDay !== 'night' && (
  <Sky
    sunPosition={(() => {
      if (timeOfDay === 'dawn') return [100, -5, 100];
      if (timeOfDay === 'dusk') return [-100, -5, 100];
      return [100, 20, 100]; // day
    })()}
    turbidity={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 8 : 2}
    inclination={timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.6 : 0.9}
  />
)}
```

During dawn/dusk, sun positioned below horizon (Y = -5) so Drei's Sky generates warm colors. Higher turbidity creates dramatic atmospheric scattering.

At night, Sky is skipped entirely — black background + 5,000 Stars instead:

```javascript
{isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
```

---

### Forecast Portals with MeshPortalMaterial

```javascript
const ForecastPortal = ({ position, dayData, index, onEnter }) => {
  const materialRef = useRef();

  const portalWeatherData = useMemo(() => ({
    current: {
      temp_f: dayData.day.maxtemp_f,
      condition: dayData.day.condition,
      is_day: 1,
      humidity: dayData.day.avghumidity,
      wind_mph: dayData.day.maxwind_mph,
    },
    location: { localtime: dayData.date + 'T12:00' }
  }), [dayData]);

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial ref={materialRef} blur={0} resolution={256} worldUnits={false}>
          <color attach="background" args={['#87CEEB']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <WeatherVisualization weatherData={portalWeatherData} isLoading={false} portalMode={true} />
        </MeshPortalMaterial>
      </mesh>
      <Text position={[-0.8, 1.0, 0.1]} fontSize={0.18} color="#FFFFFF">
        {formatDay(dayData.date, index)}
      </Text>
    </group>
  );
};
```

`roundedPlaneGeometry` from maath library (2x2.5 portal with 0.15-radius corners). Each portal renders a complete weather scene at 256px resolution.

Portal fullscreen transition uses `THREE.MathUtils.lerp` for smooth blend animation:

```javascript
useFrame(() => {
  if (materialRef.current) {
    const targetBlend = isFullscreen ? 1 : 0;
    materialRef.current.blend = THREE.MathUtils.lerp(
      materialRef.current.blend || 0, targetBlend, 0.1
    );
  }
});
```

---

### Lens Flare System

```javascript
const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;
  return (
    <EffectComposer>
      <UltimateLensFlare position={[0, 5, 0]} opacity={1.00} glareSize={1.68}
        starPoints={2} animated={false} flareShape={0.81} flareSize={1.68}
        secondaryGhosts={true} ghostScale={0.03} aditionalStreaks={true} haloScale={3.88} />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

Visibility controlled by weather + time:

```javascript
const showLensFlare = useMemo(() => {
  if (isNight || !weatherData) return false;
  return shouldShowSun(weatherData);
}, [isNight, weatherData]);
```

---

### API Caching & Rate Limiting

```javascript
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Graceful degradation on rate limit
if (error.response?.status === 429) {
  return getDemoWeatherData(location);
}
```

---

## Key Techniques & Patterns

| Pattern | Description |
|---------|-------------|
| **Instanced Mesh** | Single GPU draw call for thousands of particles via `instancedMesh` + reusable dummy `Object3D` |
| **Time-Based Animation** | `state.clock.elapsedTime + i` offsets create unique per-particle motion paths |
| **Conditional Rendering** | Weather type maps to specific component combos; sunny skips all particle systems |
| **Portal Composition** | `MeshPortalMaterial` renders complete 3D scenes to texture planes, clickable for fullscreen |
| **Ref-Based State** | Lightning cooldowns and blend animations use refs for frame-perfect updates without re-renders |
| **API Decoupling** | String matching converts API text descriptions to component types, keeping rendering independent of API shape |

---

## Practical Tips & Gotchas

- **Particle recycling**: When particles fall below Y=-1, reset to top with randomized X — creates infinite effect without allocation
- **Portal timing**: Force noon (`'T12:00'`) and daytime (`is_day: 1`) in portals for consistent lighting
- **Lightning probability**: `Math.random() < 0.003` per frame creates natural intervals without hardcoded timers
- **API timeout**: 10-second timeout prevents hanging on slow connections
- **Timezone accuracy**: Include `Intl.DateTimeFormat().resolvedOptions().timeZone` in API calls for correct day/night
- **Texture licensing**: Author used CC0 textures from Solar System Scope and Wikimedia Commons

---

## Performance Considerations

| Optimization | Main Scene | Portal Mode | Savings |
|-------------|-----------|-------------|---------|
| Rain particles | 800 | 100 | 87.5% |
| Snow particles | 400 | 50 | 87.5% |
| Cloud count | 6+ (60-80 segments each) | 2 (35-40 segments) | ~67% |
| Sky component | Full atmospheric scattering | Skipped at night (black bg) | 100% at night |

**Total portal efficiency**: With 3 precipitation portals: 800 + 3x100 = 1,100 particles instead of 4x800 = 3,200.

**Technologies used**: React Three Fiber, @react-three/drei (Sky, Stars, Cloud, Text, Sphere, Bloom), R3F-Ultimate-Lens-Flare, maath (roundedPlaneGeometry), WeatherAPI.com, Axios, `THREE.MathUtils.lerp`.
