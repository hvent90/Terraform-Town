export type CameraMode = 'orbit' | 'map' | 'focus';

export type FocusRegion = {
  center: [number, number, number];
  size: [number, number, number];
  id: number; // monotonic counter to detect re-clicks on the same cluster
};

export const ALL_CAMERA_MODES: CameraMode[] = ['orbit', 'map', 'focus'];

export const CAMERA_LABELS: Record<CameraMode, string> = {
  orbit: 'Orbit',
  map: 'Map',
  focus: 'Focus',
};
