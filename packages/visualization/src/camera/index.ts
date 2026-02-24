export type CameraMode = 'orbit' | 'map' | 'focus';

export const ALL_CAMERA_MODES: CameraMode[] = ['orbit', 'map', 'focus'];

export const CAMERA_LABELS: Record<CameraMode, string> = {
  orbit: 'Orbit',
  map: 'Map',
  focus: 'Focus',
};
