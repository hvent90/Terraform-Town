import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';

/**
 * In-scene performance monitor for WebGPU renderer.
 * Renders a fixed-position HTML overlay showing:
 * - FPS and frame time (ms)
 * - Draw calls, triangles, geometries, textures
 * - Frame time breakdown (min/max/avg over rolling window)
 *
 * Drop inside <Canvas> to activate.
 */
export function PerfMonitor() {
  const { gl: renderer } = useThree();
  const divRef = useRef<HTMLDivElement | null>(null);
  const timesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  // Snapshot previous render counters to compute per-frame deltas
  const prevRef = useRef({ calls: 0, drawCalls: 0, triangles: 0, points: 0, lines: 0 });

  useEffect(() => {
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: '9999',
      background: 'rgba(0,0,0,0.85)',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px 14px',
      borderRadius: '6px',
      border: '1px solid rgba(0,255,0,0.3)',
      pointerEvents: 'none',
      lineHeight: '1.6',
      minWidth: '220px',
      whiteSpace: 'pre',
    });
    document.body.appendChild(div);
    divRef.current = div;
    return () => {
      document.body.removeChild(div);
    };
  }, []);

  useFrame(() => {
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const times = timesRef.current;
    times.push(dt);
    if (times.length > 120) times.shift();

    const info = (renderer as any).info;
    const render = info?.render ?? {};
    const memory = info?.memory ?? {};

    // Compute per-frame deltas (robust regardless of whether info.reset() works)
    const prev = prevRef.current;
    const calls = (render.calls ?? 0) - prev.calls;
    const drawCalls = (render.drawCalls ?? 0) - prev.drawCalls;
    const triangles = (render.triangles ?? 0) - prev.triangles;
    const points = (render.points ?? 0) - prev.points;
    const lines = (render.lines ?? 0) - prev.lines;
    prev.calls = render.calls ?? 0;
    prev.drawCalls = render.drawCalls ?? 0;
    prev.triangles = render.triangles ?? 0;
    prev.points = render.points ?? 0;
    prev.lines = render.lines ?? 0;

    // WebGPU uses drawCalls, WebGL uses calls
    const frameDrawCalls = drawCalls || calls;

    frameCountRef.current++;
    // Update DOM every 10 frames to avoid overhead
    if (frameCountRef.current % 10 === 0) {
      const fps = 1000 / dt;
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      const displayLines = [
        `FPS: ${fps.toFixed(0)}  (${dt.toFixed(1)}ms)`,
        `avg: ${avg.toFixed(1)}ms  min: ${min.toFixed(1)}ms  max: ${max.toFixed(1)}ms`,
        `─────────────────────────`,
        `draw calls: ${frameDrawCalls}`,
        `triangles:  ${triangles}`,
        `points:     ${points}`,
        `lines:      ${lines}`,
        `─────────────────────────`,
        `geometries: ${memory.geometries ?? '?'}`,
        `textures:   ${memory.textures ?? '?'}`,
      ];

      if (divRef.current) {
        divRef.current.textContent = displayLines.join('\n');
      }
    }
  });

  return null;
}
