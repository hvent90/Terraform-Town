import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LERP_SPEED = 4;
const EPSILON = 0.05;

type FocusTarget = {
  selectedResourceId: string | null;
  resourcePositionsRef: React.RefObject<Map<string, [number, number, number]>>;
};

/**
 * Drives a one-shot lerp of the camera toward a selected resource.
 * Returns `animating` ref so the owning controller can yield input while in flight.
 * Calls `onArrive(resourceWorldPos)` when the animation finishes so the
 * controller can re-sync its own state (e.g. spherical coords, pan target).
 *
 * @param cameraOffset - vector from resource position to desired camera position
 */
export function useFocusAnimation(
  focusTarget: FocusTarget | null,
  cameraOffset: THREE.Vector3,
  onArrive?: (targetPos: THREE.Vector3) => void,
) {
  const { camera: _camera } = useThree();
  const camera = _camera as any;
  const animating = useRef(false);
  const goalCamPos = useRef(new THREE.Vector3());
  const goalLookAt = useRef(new THREE.Vector3());
  const prevSelectedId = useRef<string | null>(null);

  useEffect(() => {
    const id = focusTarget?.selectedResourceId ?? null;
    if (!id || id === prevSelectedId.current || !focusTarget?.resourcePositionsRef.current) {
      prevSelectedId.current = id;
      return;
    }
    prevSelectedId.current = id;
    const pos = focusTarget.resourcePositionsRef.current.get(id);
    if (!pos) return;
    const resourcePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    goalLookAt.current.copy(resourcePos);
    goalCamPos.current.copy(resourcePos).add(cameraOffset);
    animating.current = true;
  }, [focusTarget?.selectedResourceId, focusTarget?.resourcePositionsRef, camera, cameraOffset]);

  useFrame((_, delta) => {
    if (!animating.current) return;

    camera.position.lerp(goalCamPos.current, Math.min(delta * LERP_SPEED, 1));
    camera.lookAt(goalLookAt.current);

    if (camera.position.distanceTo(goalCamPos.current) < EPSILON) {
      camera.position.copy(goalCamPos.current);
      camera.lookAt(goalLookAt.current);
      animating.current = false;
      onArrive?.(goalLookAt.current);
    }
  });

  return animating;
}
