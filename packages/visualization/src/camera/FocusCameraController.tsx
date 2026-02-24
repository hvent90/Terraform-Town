import { OrbitCameraController } from './OrbitCameraController';

type Props = {
  isOrtho: boolean;
  selectedResourceId: string | null;
  resourcePositionsRef: React.RefObject<Map<string, [number, number, number]>>;
};

/**
 * Focus mode is just orbit with focus-on-click always active.
 */
export function FocusCameraController({ isOrtho, selectedResourceId, resourcePositionsRef }: Props) {
  return (
    <OrbitCameraController
      isOrtho={isOrtho}
      focusTarget={{ selectedResourceId, resourcePositionsRef }}
    />
  );
}
