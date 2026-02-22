import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// ── Scene ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010103);
scene.fog = new THREE.FogExp2(0x010103, 0.08);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
document.body.appendChild(renderer.domElement);

// ── Cameras ──
const perspCamera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
perspCamera.position.set(0, 0.8, 4.5);
perspCamera.lookAt(0, 0.5, 0);

const orthoFrustum = 2.2;
const aspect = window.innerWidth / window.innerHeight;
const orthoCamera = new THREE.OrthographicCamera(
  -orthoFrustum * aspect, orthoFrustum * aspect,
  orthoFrustum, -orthoFrustum, 0.1, 100
);
// Classic isometric angle
const isoDist = 6;
orthoCamera.position.set(isoDist, isoDist, isoDist);
orthoCamera.lookAt(0, 0.3, 0);

let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspCamera;
let isOrtho = false;

const perspControls = new OrbitControls(perspCamera, renderer.domElement);
perspControls.target.set(0, 0.5, 0);
perspControls.enableDamping = true;
perspControls.dampingFactor = 0.05;
perspControls.maxPolarAngle = Math.PI / 2.05;
perspControls.minDistance = 2;
perspControls.maxDistance = 12;

const orthoControls = new OrbitControls(orthoCamera, renderer.domElement);
orthoControls.target.set(0, 0.3, 0);
orthoControls.enableDamping = true;
orthoControls.dampingFactor = 0.05;
orthoControls.enableRotate = true;
orthoControls.enabled = false;

let controls = perspControls;

// ── Colors ──
const AMBER = new THREE.Color(0xff8822);
const AMBER_WARM = new THREE.Color(0xffaa44);
const WHITE_HOT = new THREE.Color(0xffeedd);

// ── Ground Plane — reflective water-like surface ──
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

    // Hash-based pseudo-noise for high-frequency ripples
    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    }

    // Value noise with smooth interpolation
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
      float distFactor = smoothstep(0.2, 2.5, dist);

      // High-frequency ripple noise (fine grain water texture)
      float t = uTime * 0.6;
      vec2 turb = vec2(
        noise(vWorldPos.xz * 18.0 + vec2(t * 1.2, t * 0.9)),
        noise(vWorldPos.xz * 18.0 + vec2(t * 0.8, t * 1.3) + 50.0)
      ) * 0.009;

      // Medium frequency layer
      turb += vec2(
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.7, t * 0.5)),
        noise(vWorldPos.xz * 7.0 + vec2(t * 0.6, t * 0.8) + 100.0)
      ) * 0.004;

      // Low frequency swell
      turb += vec2(
        sin(vWorldPos.x * 2.0 + t) * cos(vWorldPos.z * 1.5 + t * 0.7),
        cos(vWorldPos.x * 1.5 + t * 0.8) * sin(vWorldPos.z * 2.0 + t * 1.1)
      ) * 0.002;

      // Scale up distortion with distance, keep center cleaner
      turb *= 0.4 + distFactor * 0.6;

      // 9-tap blur that increases with distance
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

      // Abrupt falloff — 70% near cube, fading quickly to near-zero
      float falloff = exp(-dist * dist * 0.35);
      col.rgb *= falloff * 0.7;

      gl_FragColor = col;
    }
  `,
};

const groundGeo = new THREE.PlaneGeometry(80, 80);
const dpr = Math.min(window.devicePixelRatio, 2);
const ground = new Reflector(groundGeo, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * dpr,
  textureHeight: window.innerHeight * dpr,
  color: 0x888880,
  shader: waterShader,
});
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// ── Frosted Glass Cube — per-face shader ──
const cubeSize = 0.6;
const cubeY = 0.45;

const cubeFaces = new THREE.Group();
cubeFaces.position.y = cubeY;

const faceConfigs: { rot: [number, number, number]; pos: [number, number, number] }[] = [
  { rot: [0, 0, 0],             pos: [0, 0, cubeSize/2] },
  { rot: [0, Math.PI, 0],       pos: [0, 0, -cubeSize/2] },
  { rot: [0, Math.PI/2, 0],     pos: [cubeSize/2, 0, 0] },
  { rot: [0, -Math.PI/2, 0],    pos: [-cubeSize/2, 0, 0] },
  { rot: [-Math.PI/2, 0, 0],    pos: [0, cubeSize/2, 0] },
  { rot: [Math.PI/2, 0, 0],     pos: [0, -cubeSize/2, 0] },
];

faceConfigs.forEach(cfg => {
  const faceGeo = new THREE.PlaneGeometry(cubeSize, cubeSize);
  const faceMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCameraPos: { value: camera.position },
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

        // Edge proximity within face
        vec2 edgeDist = abs(vUv - 0.5) * 2.0;
        float edgeFactor = max(edgeDist.x, edgeDist.y);
        edgeFactor = smoothstep(0.7, 1.0, edgeFactor);

        float baseAlpha = 0.15 + fresnel * 0.45 + edgeFactor * 0.5;

        vec3 col = mix(uColorInner, uColorEdge, fresnel * 0.6 + edgeFactor * 0.4);

        // Top face brighter
        float topBoost = smoothstep(0.3, 1.0, vWorldNormal.y) * 0.2;
        baseAlpha += topBoost;
        col = mix(col, uColorEdge, topBoost);

        baseAlpha *= 0.95 + 0.05 * sin(uTime * 1.5);
        gl_FragColor = vec4(col, clamp(baseAlpha, 0.0, 0.85));
      }
    `,
  });

  const face = new THREE.Mesh(faceGeo, faceMat);
  face.position.set(...cfg.pos);
  face.rotation.set(...cfg.rot);
  cubeFaces.add(face);
});
scene.add(cubeFaces);

// ── Bright Edge Lines — white-hot at top ──
const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize));
const edgesMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uColorBot: { value: AMBER_WARM },
    uColorTop: { value: WHITE_HOT },
    uCubeY: { value: cubeY },
    uCubeSize: { value: cubeSize },
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
});
const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
edgeLines.position.y = cubeY;
scene.add(edgeLines);

// ── Inner Glow Volume ──
const innerGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const innerMat = new THREE.MeshBasicMaterial({
  color: 0xffcc88,
  transparent: true,
  opacity: 0.15,
});
const innerCube = new THREE.Mesh(innerGeo, innerMat);
innerCube.position.y = cubeY;
scene.add(innerCube);

// ── Tight Halo ──
function createHaloTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255, 190, 100, 0.06)');
  g.addColorStop(0.15, 'rgba(255, 150, 60, 0.03)');
  g.addColorStop(0.35, 'rgba(255, 120, 30, 0.005)');
  g.addColorStop(0.6, 'rgba(255, 80, 10, 0.0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: createHaloTexture(),
  color: 0xffaa55,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.15,
}));
halo.position.y = cubeY + 0.1;
halo.scale.set(1.2, 1.2, 1);
scene.add(halo);

// ── Ground Light Pool — radial emission ──
const poolGeo = new THREE.PlaneGeometry(16, 16);
const poolMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
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
      // Square core matching cube footprint (0.6 world units)
      vec2 world = c * 8.0;
      float boxDist = max(abs(world.x), abs(world.y));
      float coreGlow = exp(-pow(max(boxDist - 0.3, 0.0), 2.0) * 120.0) * 0.3;
      float outerGlow = exp(-r * r * 18.0) * 0.06;
      float intensity = coreGlow + outerGlow;
      vec3 col = mix(uColor, uColorBright, coreGlow / max(intensity, 0.001));
      gl_FragColor = vec4(col, intensity);
    }
  `,
});
const pool = new THREE.Mesh(poolGeo, poolMat);
pool.rotation.x = -Math.PI / 2;
pool.position.y = 0.003;
scene.add(pool);

// ── Ground Particles — tiny sparse specks in a thin band ──
const particleCount = 3000;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
const pSizes = new Float32Array(particleCount);
const pAlphas = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const r = 0.6 + Math.pow(Math.random(), 0.7) * 2.2;
  pPos[i*3] = Math.cos(angle) * r;
  pPos[i*3+1] = 0.005 + Math.random() * 0.01;
  pPos[i*3+2] = Math.sin(angle) * r;
  pSizes[i] = 0.2 + Math.random() * 0.4;
  const falloff = Math.max(0, 1 - (r - 0.6) / 2.2);
  pAlphas[i] = (0.1 + Math.random() * 0.5) * falloff * falloff;
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
pGeo.setAttribute('alpha', new THREE.BufferAttribute(pAlphas, 1));

const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: AMBER_WARM }, uTime: { value: 0 } },
  vertexShader: `
    attribute float size;
    attribute float alpha;
    varying float vAlpha;
    uniform float uTime;
    void main() {
      vAlpha = alpha;
      vec3 pos = position;
      pos.y += sin(uTime * 1.5 + length(pos.xz) * 4.0) * 0.002;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (40.0 / -mv.z);
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
});
scene.add(new THREE.Points(pGeo, pMat));

// ── Lights ──
const cubeLight = new THREE.PointLight(AMBER, 0.5, 3, 2);
cubeLight.position.set(0, cubeY, 0);
scene.add(cubeLight);

const groundLight = new THREE.PointLight(AMBER, 0.2, 2, 2);
groundLight.position.set(0, 0.05, 0);
scene.add(groundLight);

scene.add(new THREE.AmbientLight(0x0a0a18, 0.15));

// ── Post Processing ──
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3, 0.1, 0.1
));
composer.addPass(new OutputPass());

// ── Fix Reflector for orthographic cameras ──
// The Reflector's oblique clip plane math assumes perspective projection.
// For ortho cameras, intercept the internal render call and restore the
// clean ortho projection matrix before the reflected scene is drawn.
const origReflectorBeforeRender = ground.onBeforeRender;
ground.onBeforeRender = function (rend: any, scn: any, cam: any) {
  if (!cam.isOrthographicCamera) {
    origReflectorBeforeRender.call(this, rend, scn, cam);
    return;
  }
  const savedProjection = cam.projectionMatrix.clone();
  const origRender = rend.render.bind(rend);
  rend.render = function (s: any, c: any) {
    c.projectionMatrix.copy(savedProjection);
    origRender(s, c);
  };
  origReflectorBeforeRender.call(this, rend, scn, cam);
  rend.render = origRender;
};

// ── Camera Toggle UI ──
const camBtn = document.createElement('button');
camBtn.innerHTML = `<span style="border:1px solid rgba(255,200,140,0.4);border-radius:3px;padding:1px 5px;font-weight:bold;margin-right:6px">C</span>Camera`;
Object.assign(camBtn.style, {
  position: 'fixed', top: '16px', right: '16px', zIndex: '1000',
  background: 'none', border: 'none', color: 'rgba(255, 200, 140, 0.5)',
  fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer',
  transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center',
});
camBtn.addEventListener('mouseenter', () => { camBtn.style.color = 'rgba(255, 200, 140, 0.8)'; });
camBtn.addEventListener('mouseleave', () => { camBtn.style.color = isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)'; });
document.body.appendChild(camBtn);

function toggleCamera() {
  isOrtho = !isOrtho;
  if (isOrtho) {
    camera = orthoCamera;
    perspControls.enabled = false;
    orthoControls.enabled = true;
    controls = orthoControls;
  } else {
    camera = perspCamera;
    orthoControls.enabled = false;
    perspControls.enabled = true;
    controls = perspControls;
  }
  renderPass.camera = camera;
  camBtn.style.color = isOrtho ? 'rgba(255, 200, 140, 0.7)' : 'rgba(255, 200, 140, 0.5)';
}

camBtn.addEventListener('click', toggleCamera);
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') toggleCamera();
});

// ── Animate ──
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  cubeFaces.children.forEach(f => {
    (f as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material.uniforms.uCameraPos.value.copy(camera.position);
    (f as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material.uniforms.uTime.value = t;
  });
  pMat.uniforms.uTime.value = t;
  (ground.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

  const b = 1 + Math.sin(t * 1.2) * 0.008;
  cubeFaces.scale.setScalar(b);
  edgeLines.scale.setScalar(b);
  innerCube.scale.setScalar(b);

  cubeLight.intensity = 0.5 + Math.sin(t * 1.5) * 0.05;

  controls.update();
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const a = w / h;

  perspCamera.aspect = a;
  perspCamera.updateProjectionMatrix();

  orthoCamera.left = -orthoFrustum * a;
  orthoCamera.right = orthoFrustum * a;
  orthoCamera.top = orthoFrustum;
  orthoCamera.bottom = -orthoFrustum;
  orthoCamera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);
  const dpr = Math.min(window.devicePixelRatio, 2);
  ground.getRenderTarget().setSize(w * dpr, h * dpr);
});
