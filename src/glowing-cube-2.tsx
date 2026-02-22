import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

// @ts-ignore
import GEIST_PIXEL_GRID from './fonts/GeistPixel-Grid.ttf';

const TRACE_COLOR = '#ff8800';
const WHITE_HOT = new THREE.Color(0xffeedd);
const CUBE_SIZE = 0.6;
const CUBE_Y = CUBE_SIZE / 2;

const faceConfigs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
  { rot: [0, 0, 0],             pos: [0, 0, CUBE_SIZE / 2] },
  { rot: [0, Math.PI, 0],       pos: [0, 0, -CUBE_SIZE / 2] },
  { rot: [0, Math.PI / 2, 0],   pos: [CUBE_SIZE / 2, 0, 0] },
  { rot: [0, -Math.PI / 2, 0],  pos: [-CUBE_SIZE / 2, 0, 0] },
  { rot: [-Math.PI / 2, 0, 0],  pos: [0, CUBE_SIZE / 2, 0] },
  { rot: [Math.PI / 2, 0, 0],   pos: [0, -CUBE_SIZE / 2, 0] },
];

function createHaloTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 190, 100, 0.06)');
  g.addColorStop(0.15, 'rgba(255, 150, 60, 0.03)');
  g.addColorStop(0.35, 'rgba(255, 120, 30, 0.005)');
  g.addColorStop(0.6, 'rgba(255, 80, 10, 0.0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function CubeFace({ rot, pos }: { rot: [number, number, number]; pos: [number, number, number] }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCameraPos: { value: new THREE.Vector3() },
      uColorInner: { value: new THREE.Color(0xffbb55) },
      uColorEdge: { value: WHITE_HOT },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uCameraPos;
      uniform vec3 uColorInner;
      uniform vec3 uColorEdge;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      void main() {
        vec3 viewDir = normalize(uCameraPos - vWorldPos);
        float facing = abs(dot(viewDir, vWorldNormal));
        float fresnel = pow(1.0 - facing, 1.5);

        vec2 edgeDist = abs(vUv - 0.5) * 2.0;
        float edgeFactor = max(edgeDist.x, edgeDist.y);
        edgeFactor = smoothstep(0.7, 1.0, edgeFactor);

        float baseAlpha = 0.15 + fresnel * 0.45 + edgeFactor * 0.5;

        vec3 col = mix(uColorInner, uColorEdge, fresnel * 0.6 + edgeFactor * 0.4);

        float topBoost = smoothstep(0.3, 1.0, vWorldNormal.y) * 0.2;
        baseAlpha += topBoost;
        col = mix(col, uColorEdge, topBoost);

        baseAlpha *= 0.95 + 0.05 * sin(uTime * 1.5);
        gl_FragColor = vec4(col, clamp(baseAlpha, 0.0, 0.85));
      }
    `,
  }), []);

  useFrame(({ clock, camera }) => {
    material.uniforms.uCameraPos.value.copy(camera.position);
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh material={material} position={pos} rotation={rot}>
      <planeGeometry args={[CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  );
}

function GlowingCube() {
  const facesRef = useRef<THREE.Group>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const edgesGeo = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)), []);

  const edgesMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColorBot: { value: AMBER_WARM },
      uColorTop: { value: WHITE_HOT },
      uCubeY: { value: CUBE_Y },
      uCubeSize: { value: CUBE_SIZE },
    },
    vertexShader: `
      varying float vHeight;
      uniform float uCubeY;
      uniform float uCubeSize;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vHeight = (worldPos.y - (uCubeY - uCubeSize * 0.5)) / uCubeSize;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorBot;
      uniform vec3 uColorTop;
      varying float vHeight;
      void main() {
        vec3 col = mix(uColorBot, uColorTop, smoothstep(0.0, 1.0, vHeight));
        float alpha = 0.6 + vHeight * 0.4;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  }), []);

  const haloTexture = useMemo(() => createHaloTexture(), []);

  // Breathing animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const b = 1 + Math.sin(t * 1.2) * 0.008;
    facesRef.current?.scale.setScalar(b);
    edgesRef.current?.scale.setScalar(b);
  });

  return (
    <group>
      {/* Frosted glass faces */}
      <group ref={facesRef} position={[0, CUBE_Y, 0]}>
        {faceConfigs.map((cfg, i) => (
          <CubeFace key={i} rot={cfg.rot} pos={cfg.pos} />
        ))}
      </group>

      {/* Edge lines */}
      <lineSegments ref={edgesRef} geometry={edgesGeo} material={edgesMat} position={[0, CUBE_Y, 0]} />

      {/* Halo */}
      <sprite position={[0, CUBE_Y + 0.1, 0]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          map={haloTexture}
          color={0xffaa55}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.15}
        />
      </sprite>
    </group>
  );
}

function TraceLines() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(TRACE_COLOR) },
      fadeDistance: { value: 7.5 },
      uBorderDist: { value: CUBE_SIZE / 2 + 0.08 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float fadeDistance;
      uniform float uBorderDist;
      varying vec3 vWorldPosition;
      void main() {
        float distFromBorder = max(abs(vWorldPosition.x), abs(vWorldPosition.z)) - uBorderDist;
        float alpha = 1.0 - smoothstep(0.0, fadeDistance, max(distFromBorder, 0.0));
        gl_FragColor = vec4(color * 4.0, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  const half = CUBE_SIZE / 2 + 0.08;
  const borderLen = CUBE_SIZE + 0.16 + 0.02;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Z-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half + 3.75]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Z-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(half + 3.75)]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (positive) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half + 3.75, 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* X-axis line (negative) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-(half + 3.75), 0, 0]}>
        <planeGeometry args={[0.02, 7.5]} />
      </mesh>
      {/* Front border (z+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Back border (z-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -half]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Right border (x+) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* Left border (x-) */}
      <mesh material={material} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-half, 0, 0]}>
        <planeGeometry args={[borderLen, 0.02]} />
      </mesh>
      {/* EC2 label on right trace line */}
      <Text
        font={GEIST_PIXEL_GRID}
        fontSize={0.45}
        position={[0, -0.05, -(half + 1.2)]}
        rotation={[0, Math.PI / 2, 0]}
        anchorX="center"
        anchorY="bottom"
        color={TRACE_COLOR}
      >
        EC2
        <meshBasicMaterial color={TRACE_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </Text>
    </group>
  );
}

const AMBER = new THREE.Color(0xff8822);
const AMBER_WARM = new THREE.Color(0xffaa44);

const waterShader = {
  name: 'WaterReflector',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec4 vUv;
    varying vec3 vWorldPos;

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = dot(hash22(i), f);
      float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
      float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
      float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      float dist = length(vWorldPos.xz);
      float distFactor = smoothstep(0.2, 1.2, dist);

      float t = uTime * 0.6;
      vec2 turb = vec2(
        noise(vWorldPos.xz * 18.0 + vec2(t * 1.2, t * 0.9)),
        noise(vWorldPos.xz * 18.0 + vec2(t * 0.8, t * 1.3) + 50.0)
      ) * 0.009;

      turb += vec2(
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.7, t * 0.5)),
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.6, t * 0.8) + 100.0)
      ) * 0.004;

      turb += vec2(
        sin(vWorldPos.x * 2.0 + t) * cos(vWorldPos.z * 1.5 + t * 0.7),
        cos(vWorldPos.x * 1.5 + t * 0.8) * sin(vWorldPos.z * 2.0 + t * 1.1)
      ) * 0.002;

      turb *= 0.4 + distFactor * 0.6;

      float blur = (0.001 + distFactor * 0.005) * vUv.w;
      vec4 uv = vUv;
      uv.xy += turb * uv.w;

      vec4 col = vec4(0.0);
      col += texture2DProj(tDiffuse, uv) * 2.0;
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, 0.0), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, 0.0), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, -blur), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(0.0, blur), uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, -blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, -blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(-blur, blur) * 0.7, uv.zw));
      col += texture2DProj(tDiffuse, vec4(uv.xy + vec2(blur, blur) * 0.7, uv.zw));
      col /= 10.0;

      float falloff = exp(-dist * dist * 1.2);
      col.rgb *= falloff * 0.85;

      gl_FragColor = col;
    }
  `,
};

function ReflectiveGround() {
  const { size } = useThree();
  const dpr = Math.min(window.devicePixelRatio, 2);

  const reflector = useMemo(() => {
    const geo = new THREE.PlaneGeometry(80, 80);
    const ref = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: size.width * dpr,
      textureHeight: size.height * dpr,
      color: 0x888880,
      shader: waterShader,
    });
    ref.rotation.x = -Math.PI / 2;

    // Fix for orthographic cameras
    const origBeforeRender = ref.onBeforeRender;
    ref.onBeforeRender = function (rend: any, scn: any, cam: any) {
      if (!cam.isOrthographicCamera) {
        origBeforeRender.call(this, rend, scn, cam);
        return;
      }
      const savedProjection = cam.projectionMatrix.clone();
      const origRender = rend.render.bind(rend);
      rend.render = function (s: any, c: any) {
        c.projectionMatrix.copy(savedProjection);
        origRender(s, c);
      };
      origBeforeRender.call(this, rend, scn, cam);
      rend.render = origRender;
    };

    return ref;
  }, []);

  useFrame(({ clock }) => {
    (reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime();
  });

  return <primitive object={reflector} />;
}

function GroundParticles() {
  const particleCount = 3000;

  const { positions, sizes, alphas } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const al = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 2.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = 0.005 + Math.random() * 0.01;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      sz[i] = 0.2 + Math.random() * 0.4;
      const falloff = Math.max(0, 1 - (r - 0.6) / 2.2);
      al[i] = (0.1 + Math.random() * 0.5) * falloff * falloff;
    }
    return { positions: pos, sizes: sz, alphas: al };
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: AMBER_WARM }, uTime: { value: 0 }, uZoom: { value: 80.0 } },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      uniform float uTime;
      uniform float uZoom;
      void main() {
        vAlpha = alpha;
        vec3 pos = position;
        pos.y += sin(uTime * 1.5 + length(pos.xz) * 4.0) * 0.002;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uZoom * 0.04;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float c = smoothstep(1.0, 0.2, d);
        gl_FragColor = vec4(uColor, c * vAlpha);
      }
    `,
  }), []);

  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    if ((camera as THREE.OrthographicCamera).zoom) {
      material.uniforms.uZoom.value = (camera as THREE.OrthographicCamera).zoom;
    }
  });

  return (
    <points material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-alpha" count={particleCount} array={alphas} itemSize={1} />
      </bufferGeometry>
    </points>
  );
}

function GroundLightPool() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: AMBER },
      uColorBright: { value: new THREE.Color(0xffcc88) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uColorBright;
      varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * 2.0;
        float r = length(c);
        vec2 world = c * 8.0;
        float boxDist = max(abs(world.x), abs(world.y));
        float coreGlow = exp(-pow(max(boxDist - 0.3, 0.0), 2.0) * 120.0) * 0.3;
        float outerGlow = exp(-r * r * 18.0) * 0.06;
        float intensity = coreGlow + outerGlow;
        vec3 col = mix(uColor, uColorBright, coreGlow / max(intensity, 0.001));
        gl_FragColor = vec4(col, intensity);
      }
    `,
  }), []);

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <planeGeometry args={[16, 16]} />
    </mesh>
  );
}

function Ground() {
  return (
    <group>
      <ReflectiveGround />
      <GroundLightPool />
      <GroundParticles />
      <TraceLines />
    </group>
  );
}

export default function App() {
  const [isOrtho, setIsOrtho] = useState(true);

  const toggle = useCallback(() => setIsOrtho(prev => !prev), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') toggle();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.6 }}>
        <color attach="background" args={['#010103']} />

        {isOrtho ? (
          <OrthographicCamera makeDefault position={[6, 6, 6]} zoom={80} near={-100} far={100} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 0.8, 4.5]} fov={32} near={0.1} far={100} />
        )}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={isOrtho ? [0, 0.3, 0] : [0, 0.5, 0]}
          minDistance={isOrtho ? undefined : 2}
          maxDistance={isOrtho ? undefined : 12}
        />

        <ambientLight color={0x0a0a18} intensity={0.15} />
        <pointLight color={AMBER} intensity={0.5} distance={3} decay={2} position={[0, 0.45, 0]} />
        <pointLight color={AMBER} intensity={0.2} distance={2} decay={2} position={[0, 0.05, 0]} />

        <GlowingCube />
        <Ground />

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      <button
        onClick={toggle}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255, 200, 140, 0.8)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)'; }}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 1000,
          background: 'none', border: 'none',
          color: isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)',
          fontFamily: 'monospace', fontSize: 13, cursor: 'pointer',
          transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center',
        }}
      >
        <span style={{
          border: '1px solid rgba(255, 200, 140, 0.4)',
          borderRadius: 3, padding: '1px 5px',
          fontWeight: 'bold', marginRight: 6,
        }}>C</span>
        Camera
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);