import { OrbitCameraController } from './OrbitCameraController';
import type { FocusRegion } from '.';

type Props = {
  isOrtho: boolean;
  selectedResourceId: string | null;
  resourcePositionsRef: React.RefObject<Map<string, [number, number, number]>>;
  focusRegion?: FocusRegion | null;
};

/**
 * Focus mode is just orbit with focus-on-click always active.
 */
export function FocusCameraController({ isOrtho, selectedResourceId, resourcePositionsRef, focusRegion }: Props) {
  return (
    <OrbitCameraController
      isOrtho={isOrtho}
      focusTarget={{ selectedResourceId, resourcePositionsRef }}
      focusRegion={focusRegion}
    />
  );
}
