import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { FocusRegion } from '.';

const ZOOM_SPEED = 0.1;
const DAMPING = 0.1;
const KEY_PAN_SPEED = 0.08;
// Match orbit's default isometric angle: position [6,6,6] target [0,0.3,0]
const POLAR_ANGLE = Math.PI / 4;
const AZIMUTH = Math.PI / 4;

type FocusTarget = {
  selectedResourceId: string | null;
  resourcePositionsRef: React.RefObject<Map<string, [number, number, number]>>;
};

type Props = {
  isOrtho: boolean;
  focusTarget?: FocusTarget | null;
  focusRegion?: FocusRegion | null;
};

export function MapCameraController({ isOrtho, focusTarget, focusRegion }: Props) {
  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[0, 8, 2]} zoom={80} near={-500} far={500} />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 8, 2]} fov={32} near={0.1} far={5000} />
      )}
      <MapController isOrtho={isOrtho} focusTarget={focusTarget ?? null} focusRegion={focusRegion ?? null} />
    </>
  );
}

function MapController({ isOrtho, focusTarget, focusRegion }: { isOrtho: boolean; focusTarget: FocusTarget | null; focusRegion: FocusRegion | null }) {
  const { camera: _camera, gl } = useThree();
  const camera = _camera as any;
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const goalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const zoomDelta = useRef(0);
  const _fwd = useRef(new THREE.Vector3());
  const _rht = useRef(new THREE.Vector3());
  const _offset = useRef(new THREE.Vector3());
  const _spherical = useRef(new THREE.Spherical());
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const panPixelDelta = useRef({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const radius = useRef(8);
  const prevSelectedId = useRef<string | null>(null);
  const prevRegionId = useRef<number>(-1);
  // Active cluster focus: stored size so we can recompute zoom each frame
  const clusterFocusSize = useRef<[number, number, number] | null>(null);

  // Set initial camera looking down at the slight tilt
  useEffect(() => {
    const offset = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(radius.current, POLAR_ANGLE, AZIMUTH),
    );
    camera.position.copy(target.current).add(offset);
    camera.lookAt(target.current);
  }, [camera]);

  // Focus on click: just set goalTarget to resource position.
  // The existing target.lerp(goalTarget) handles the smooth pan,
  // and the camera angle stays fixed throughout.
  useEffect(() => {
    const id = focusTarget?.selectedResourceId ?? null;
    if (!id || id === prevSelectedId.current || !focusTarget?.resourcePositionsRef.current) {
      prevSelectedId.current = id;
      return;
    }
    prevSelectedId.current = id;
    const pos = focusTarget.resourcePositionsRef.current.get(id);
    if (!pos) return;
    goalTarget.current.set(pos[0], pos[1], pos[2]);
  }, [focusTarget?.selectedResourceId, focusTarget?.resourcePositionsRef]);

  // Focus on cluster: pan to center, store size for per-frame zoom computation
  useEffect(() => {
    if (!focusRegion || focusRegion.id === prevRegionId.current) return;
    prevRegionId.current = focusRegion.id;
    const [cx, , cz] = focusRegion.center;
    goalTarget.current.set(cx, 0, cz);
    clusterFocusSize.current = focusRegion.size;
  }, [focusRegion]);

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      panPixelDelta.current.x += e.clientX - prev.current.x;
      panPixelDelta.current.y += e.clientY - prev.current.y;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      el.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDelta.current += e.deltaY * ZOOM_SPEED;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') keys.current.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gl]);

  useFrame(({ camera: cam }) => {
    // Apply accumulated mouse drag pan (converted to world units with fresh camera state)
    const pd = panPixelDelta.current;
    if (pd.x !== 0 || pd.y !== 0) {
      cam.getWorldDirection(_fwd.current);
      _rht.current.crossVectors(_fwd.current, cam.up).normalize();
      _fwd.current.y = 0;
      _fwd.current.normalize();
      _rht.current.y = 0;
      _rht.current.normalize();

      const h = gl.domElement.clientHeight;
      const c = cam as any;
      const worldPerPixel = isOrtho
        ? (c.top - c.bottom) / c.zoom / h
        : 2 * radius.current * Math.tan((c.fov * Math.PI / 180) * 0.5) / h;
      goalTarget.current.addScaledVector(_rht.current, -pd.x * worldPerPixel);
      goalTarget.current.addScaledVector(_fwd.current, pd.y * worldPerPixel);
      pd.x = 0;
      pd.y = 0;
    }

    // WASD keyboard pan — camera-relative directions on XZ plane, scaled by zoom
    const k = keys.current;
    if (k.size > 0) {
      const panScale = isOrtho
        ? KEY_PAN_SPEED * (80 / camera.zoom)
        : KEY_PAN_SPEED * (radius.current / 8);
      _fwd.current.set(-Math.sin(AZIMUTH), 0, -Math.cos(AZIMUTH));
      _rht.current.set(_fwd.current.z, 0, -_fwd.current.x);
      if (k.has('w')) goalTarget.current.addScaledVector(_fwd.current, panScale);
      if (k.has('s')) goalTarget.current.addScaledVector(_fwd.current, -panScale);
      if (k.has('a')) goalTarget.current.addScaledVector(_rht.current, panScale);
      if (k.has('d')) goalTarget.current.addScaledVector(_rht.current, -panScale);
    }

    // Smooth pan — lerp actual target toward goal
    target.current.lerp(goalTarget.current, DAMPING);

    // Manual zoom from wheel — cancels cluster focus zoom
    if (Math.abs(zoomDelta.current) > 0.01) {
      clusterFocusSize.current = null;
    }
    if (!isOrtho) {
      radius.current = THREE.MathUtils.clamp(
        radius.current * (1 + zoomDelta.current * 0.001), 1, 2000,
      );
    } else if (zoomDelta.current !== 0) {
      camera.zoom = Math.max(0.5, Math.min(200, camera.zoom * (1 - zoomDelta.current * 0.003)));
      camera.updateProjectionMatrix();
    }

    zoomDelta.current *= 0.92;
    if (Math.abs(zoomDelta.current) < 0.001) zoomDelta.current = 0;

    // Cluster focus zoom: compute the extent needed to keep the cluster
    // visible from the *current* target position. As the pan converges,
    // the offset d shrinks and the zoom tightens in lockstep.
    if (clusterFocusSize.current) {
      const sz = clusterFocusSize.current;
      const dx = Math.abs(target.current.x - goalTarget.current.x);
      const dz = Math.abs(target.current.z - goalTarget.current.z);
      // Visible extent must cover cluster + the remaining pan offset on each axis
      const neededX = 2 * dx + sz[0];
      const neededZ = 2 * dz + sz[2];
      // Isometric projection factor (~1.5) accounts for the 45° viewing angle
      const needed = Math.max(neededX, neededZ) * 1.5;

      if (isOrtho) {
        const frustumMin = Math.min(camera.right - camera.left, camera.top - camera.bottom);
        const computedZoom = THREE.MathUtils.clamp(frustumMin / needed, 0.5, 200);
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, computedZoom, DAMPING * 2);
        camera.updateProjectionMatrix();
      } else {
        const fovRad = camera.fov * Math.PI / 180;
        const computedRadius = THREE.MathUtils.clamp(needed / (2 * Math.tan(fovRad / 2)), 1, 2000);
        radius.current = THREE.MathUtils.lerp(radius.current, computedRadius, DAMPING * 2);
      }

      // Done when pan has converged
      if (dx < 0.05 && dz < 0.05) clusterFocusSize.current = null;
    }

    // Recompute camera position from fixed spherical angle
    _spherical.current.set(radius.current, POLAR_ANGLE, AZIMUTH);
    _offset.current.setFromSpherical(_spherical.current);
    camera.position.copy(target.current).add(_offset.current);
    camera.lookAt(target.current);
  });

  return null;
}
