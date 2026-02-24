import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

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
};

export function MapCameraController({ isOrtho, focusTarget }: Props) {
  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[0, 8, 2]} zoom={80} near={-100} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 8, 2]} fov={32} near={0.1} far={100} />
      )}
      <MapController isOrtho={isOrtho} focusTarget={focusTarget ?? null} />
    </>
  );
}

function MapController({ isOrtho, focusTarget }: { isOrtho: boolean; focusTarget: FocusTarget | null }) {
  const { camera: _camera, gl, viewport, size } = useThree();
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
  const keys = useRef(new Set<string>());
  const radius = useRef(8);
  const prevSelectedId = useRef<string | null>(null);

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
      const dx = e.clientX - prev.current.x;
      const dy = e.clientY - prev.current.y;
      prev.current = { x: e.clientX, y: e.clientY };

      // Camera-relative pan: project camera's right/forward onto XZ plane
      camera.getWorldDirection(_fwd.current);
      _rht.current.crossVectors(_fwd.current, camera.up).normalize();
      _fwd.current.y = 0;
      _fwd.current.normalize();
      _rht.current.y = 0;
      _rht.current.normalize();

      // Convert pixel movement to world units so pan tracks the cursor 1:1
      const worldPerPixelX = viewport.width / size.width;
      const worldPerPixelZ = viewport.height / size.height;
      goalTarget.current.addScaledVector(_rht.current, -dx * worldPerPixelX);
      goalTarget.current.addScaledVector(_fwd.current, dy * worldPerPixelZ);
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
  }, [gl, viewport, size]);

  useFrame(() => {
    // WASD keyboard pan — camera-relative directions on XZ plane
    const k = keys.current;
    if (k.size > 0) {
      _fwd.current.set(-Math.sin(AZIMUTH), 0, -Math.cos(AZIMUTH));
      _rht.current.set(_fwd.current.z, 0, -_fwd.current.x);
      if (k.has('w')) goalTarget.current.addScaledVector(_fwd.current, KEY_PAN_SPEED);
      if (k.has('s')) goalTarget.current.addScaledVector(_fwd.current, -KEY_PAN_SPEED);
      if (k.has('a')) goalTarget.current.addScaledVector(_rht.current, KEY_PAN_SPEED);
      if (k.has('d')) goalTarget.current.addScaledVector(_rht.current, -KEY_PAN_SPEED);
    }

    // Smooth pan — lerp actual target toward goal
    target.current.lerp(goalTarget.current, DAMPING);

    // Apply zoom
    if (!isOrtho) {
      radius.current = THREE.MathUtils.clamp(radius.current + zoomDelta.current * 0.01, 2, 20);
    } else if (zoomDelta.current !== 0) {
      camera.zoom = Math.max(20, Math.min(200, camera.zoom - zoomDelta.current * 0.3));
      camera.updateProjectionMatrix();
    }

    zoomDelta.current *= 0.92;
    if (Math.abs(zoomDelta.current) < 0.001) zoomDelta.current = 0;

    // Recompute camera position from fixed spherical angle
    _spherical.current.set(radius.current, POLAR_ANGLE, AZIMUTH);
    _offset.current.setFromSpherical(_spherical.current);
    camera.position.copy(target.current).add(_offset.current);
    camera.lookAt(target.current);
  });

  return null;
}
