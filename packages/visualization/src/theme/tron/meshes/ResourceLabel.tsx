import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useContext, useMemo, useRef, useState, useEffect } from 'react';
import { ResourceIdContext, ResourceTypeContext, useSceneContext } from '../../../shared/context';
import { RESOURCE_COLORS, DEFAULT_RESOURCE_COLORS } from '../colors';
import { CUBE_SIZE } from '../../../shared/geometry';
import type { LabelStyle } from '../labels';
import fontUrl from '../../../assets/fonts/GeistPixel-Grid.ttf';

const FONT_NAME = 'GeistPixel-Grid';
const CANVAS_SCALE = 4;
const FONT_SIZE = 14 * CANVAS_SCALE;
const PADDING = 8 * CANVAS_SCALE;

let fontReady = false;
const fontPromise = new FontFace(FONT_NAME, `url(${fontUrl})`).load().then((face) => {
  document.fonts.add(face);
  fontReady = true;
});

function colorToCSS(c: THREE.Color, alpha = 1): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function fontStr(): string {
  return `${FONT_SIZE}px '${FONT_NAME}', monospace`;
}

function measureText(text: string): { width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontStr();
  const metrics = ctx.measureText(text);
  return {
    width: Math.ceil(metrics.width) + PADDING * 2,
    height: FONT_SIZE + PADDING * 2,
  };
}

// --- Texture renderers ---

function renderEtched(text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  const { width, height } = measureText(text);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontStr();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colorToCSS(color, 0.85);
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

function renderHolographic(text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  const { width: textW, height: textH } = measureText(text);
  const pillPadX = 12 * CANVAS_SCALE;
  const pillPadY = 6 * CANVAS_SCALE;
  const borderW = 4 * CANVAS_SCALE;
  const width = textW + pillPadX * 2 + borderW;
  const height = textH + pillPadY * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const r = 8 * CANVAS_SCALE;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, r);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
  ctx.fill();

  // Colored left border
  ctx.beginPath();
  ctx.roundRect(0, 0, borderW, height, [r, 0, 0, r]);
  ctx.fillStyle = colorToCSS(color, 0.9);
  ctx.fill();

  ctx.font = fontStr();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, width / 2 + borderW / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

function renderNeon(text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  const { width: textW } = measureText(text);
  const underlineH = 4 * CANVAS_SCALE;
  const gap = 4 * CANVAS_SCALE;
  const glowBlur = 10 * CANVAS_SCALE;
  const width = textW + glowBlur * 2;
  const height = FONT_SIZE + PADDING * 2 + gap + underlineH + glowBlur * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const cx = width / 2;
  const textY = PADDING + glowBlur;

  // White text
  ctx.font = fontStr();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(text, cx, textY);

  // Glowing colored underline
  const lineY = textY + FONT_SIZE + gap;
  const lineX = glowBlur + PADDING / 2;
  const lineW = textW - PADDING;

  ctx.shadowColor = colorToCSS(color);
  ctx.shadowBlur = glowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = colorToCSS(color, 0.9);
  ctx.fillRect(lineX, lineY, lineW, underlineH);
  ctx.fillRect(lineX, lineY, lineW, underlineH);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

function renderWireframe(text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  const { width, height } = measureText(text);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontStr();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = colorToCSS(color, 0.8);
  ctx.lineWidth = 1.5;
  ctx.strokeText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

function renderLed(text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  // Render text to temp canvas, then sample pixel grid
  const { width: textW, height: textH } = measureText(text);
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = textW;
  tmpCanvas.height = textH;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.font = fontStr();
  tmpCtx.textAlign = 'center';
  tmpCtx.textBaseline = 'middle';
  tmpCtx.fillStyle = '#fff';
  tmpCtx.fillText(text, textW / 2, textH / 2);

  const dotSize = 3 * CANVAS_SCALE;
  const dotGap = 1 * CANVAS_SCALE;
  const step = dotSize + dotGap;
  const cols = Math.floor(textW / step);
  const rows = Math.floor(textH / step);
  const outW = cols * step;
  const outH = rows * step;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  const imageData = tmpCtx.getImageData(0, 0, textW, textH);

  const css = colorToCSS(color, 0.9);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = Math.floor(col * step + step / 2);
      const sy = Math.floor(row * step + step / 2);
      if (sx < textW && sy < textH) {
        const idx = (sy * textW + sx) * 4;
        if (imageData.data[idx + 3] > 80) {
          ctx.beginPath();
          ctx.arc(col * step + step / 2, row * step + step / 2, dotSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = css;
          ctx.fill();
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: outW / outH || 1 };
}

function renderGhost(text: string): { texture: THREE.CanvasTexture; aspect: number } {
  const { width, height } = measureText(text);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontStr();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

// --- Rendering maps ---

const GROUND_STYLES = new Set<LabelStyle>(['etched', 'wireframe', 'led']);
const BILLBOARD_STYLES = new Set<LabelStyle>(['holographic', 'neon', 'ghost']);

const BILLBOARD_POSITIONS: Record<string, [number, number, number]> = {
  holographic: [0, CUBE_SIZE + 0.15, 0],
  neon: [0, -0.05, CUBE_SIZE / 2 + 0.35],
  ghost: [0, 0.1, CUBE_SIZE / 2 + 0.3],
};

function createTexture(style: LabelStyle, text: string, color: THREE.Color): { texture: THREE.CanvasTexture; aspect: number } {
  switch (style) {
    case 'etched': return renderEtched(text, color);
    case 'holographic': return renderHolographic(text, color);
    case 'neon': return renderNeon(text, color);
    case 'wireframe': return renderWireframe(text, color);
    case 'led': return renderLed(text, color);
    case 'ghost': return renderGhost(text);
    default: return renderEtched(text, color);
  }
}

export function ResourceLabel() {
  const ctx = useSceneContext();
  const resourceId = useContext(ResourceIdContext);
  const type = useContext(ResourceTypeContext);
  const colors = RESOURCE_COLORS[type] ?? DEFAULT_RESOURCE_COLORS;

  const [ready, setReady] = useState(fontReady);
  const [activeStyle, setActiveStyle] = useState<LabelStyle>(ctx.labelStyleRef.current as LabelStyle);

  useEffect(() => {
    if (!ready) fontPromise.then(() => setReady(true));
  }, [ready]);

  // Sync ref changes to state for re-renders
  useFrame(() => {
    const current = ctx.labelStyleRef.current as LabelStyle;
    if (current !== activeStyle) setActiveStyle(current);
  });

  const { texture, aspect } = useMemo(
    () => createTexture(activeStyle, resourceId, colors.trace),
    [activeStyle, resourceId, colors.trace, ready],
  );

  // Ghost hover opacity
  const matRef = useRef<THREE.SpriteMaterial>(null);
  useFrame(() => {
    if (activeStyle !== 'ghost' || !matRef.current) return;
    const hoverT = ctx.hoverTMapRef.current[resourceId] ?? 0;
    matRef.current.opacity = 0.1 + hoverT * 0.7;
  });

  if (!ready || activeStyle === 'off') return null;

  const height = 0.14;
  const width = height * aspect;

  if (GROUND_STYLES.has(activeStyle)) {
    return (
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, CUBE_SIZE / 2 + 0.4]}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.9}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  if (BILLBOARD_STYLES.has(activeStyle)) {
    const pos = BILLBOARD_POSITIONS[activeStyle] ?? [0, 0, CUBE_SIZE / 2 + 0.4];
    return (
      <sprite
        position={pos}
        scale={[width, height, 1]}
      >
        <spriteMaterial
          ref={matRef}
          map={texture}
          transparent
          opacity={activeStyle === 'ghost' ? 0.1 : 0.9}
          depthWrite={false}
          sizeAttenuation
        />
      </sprite>
    );
  }

  return null;
}
