import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useFocusAnimation } from './useFocusAnimation';

const ROTATE_SPEED = 0.001;
const ZOOM_SPEED = 0.1;
const DAMPING = 0.08;
const FOCUS_OFFSET = new THREE.Vector3(1.5, 1.2, 1.5);
const MIN_POLAR = 0.1;
const MAX_POLAR = Math.PI / 2 - 0.05;
const MIN_DIST = 2;
const MAX_DIST = 12;

type FocusTarget = {
  selectedResourceId: string | null;
  resourcePositionsRef: React.RefObject<Map<string, [number, number, number]>>;
};

type Props = {
  isOrtho: boolean;
  focusTarget?: FocusTarget | null;
};

export function OrbitCameraController({ isOrtho, focusTarget }: Props) {
  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[6, 6, 6]} zoom={80} near={-100} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 0.8, 4.5]} fov={32} near={0.1} far={100} />
      )}
      <OrbitController isOrtho={isOrtho} focusTarget={focusTarget ?? null} />
    </>
  );
}

function OrbitController({ isOrtho, focusTarget }: { isOrtho: boolean; focusTarget: FocusTarget | null }) {
  const { camera: _camera, gl } = useThree();
  const camera = _camera as any;
  const target = useRef(new THREE.Vector3(0, isOrtho ? 0.3 : 0.5, 0));
  const spherical = useRef(new THREE.Spherical());
  const sphericalDelta = useRef(new THREE.Spherical());
  const zoomDelta = useRef(0);
  const _offset = useRef(new THREE.Vector3());
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });

  // Re-sync spherical state after focus animation lands
  const onArrive = useCallback((arriveTarget: THREE.Vector3) => {
    target.current.copy(arriveTarget);
    const offset = camera.position.clone().sub(target.current);
    spherical.current.setFromVector3(offset);
    sphericalDelta.current.set(0, 0, 0);
  }, [camera]);

  const animating = useFocusAnimation(focusTarget, FOCUS_OFFSET, onArrive);

  // Initialize spherical from camera position
  useEffect(() => {
    const offset = camera.position.clone().sub(target.current);
    spherical.current.setFromVector3(offset);
    sphericalDelta.current.set(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || animating.current) return;
      dragging.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - prev.current.x;
      const dy = e.clientY - prev.current.y;
      prev.current = { x: e.clientX, y: e.clientY };
      sphericalDelta.current.theta -= dx * ROTATE_SPEED;
      sphericalDelta.current.phi -= dy * ROTATE_SPEED;
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      el.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      if (animating.current) return;
      e.preventDefault();
      zoomDelta.current += e.deltaY * ZOOM_SPEED;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, animating]);

  useFrame(() => {
    if (animating.current) return;

    const s = spherical.current;
    const sd = sphericalDelta.current;

    s.theta += sd.theta;
    s.phi += sd.phi;
    s.phi = THREE.MathUtils.clamp(s.phi, MIN_POLAR, MAX_POLAR);

    if (!isOrtho) {
      s.radius = THREE.MathUtils.clamp(s.radius + zoomDelta.current * 0.01, MIN_DIST, MAX_DIST);
    } else if (zoomDelta.current !== 0) {
      camera.zoom = Math.max(20, Math.min(200, camera.zoom - zoomDelta.current * 0.3));
      camera.updateProjectionMatrix();
    }

    sd.theta *= 1 - DAMPING;
    sd.phi *= 1 - DAMPING;
    zoomDelta.current *= 1 - DAMPING;
    if (Math.abs(sd.theta) < 0.0001) sd.theta = 0;
    if (Math.abs(sd.phi) < 0.0001) sd.phi = 0;
    if (Math.abs(zoomDelta.current) < 0.001) zoomDelta.current = 0;

    _offset.current.setFromSpherical(s);
    camera.position.copy(target.current).add(_offset.current);
    camera.lookAt(target.current);
  });

  return null;
}
