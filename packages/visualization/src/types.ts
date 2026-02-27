export type ResourceType =
  | 'vpc'
  | 'subnet'
  | 'security_group'
  | 'instance'
  | 's3_bucket'
  | 'iam_role'
  | 'lambda_function'
  | 'unknown'
  | (string & {});

export type ResourceState =
  | 'planned'
  | 'applied'
  | 'modified'
  | 'destroyed'
  | 'error';

export type ConnectionType =
  | 'reference'
  | 'attachment'
  | 'dataflow';

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  attributes: Record<string, any>;
  state: ResourceState;
  parentId?: string;
  position?: { x: number; y: number; z: number };
}

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
}

export interface TerraformState {
  resources: Resource[];
  connections: Connection[];
}

export interface Theme {
  name: string;
  background: string;
  ground: {
    color: string;
    dotGrid?: { dotColor: string; spacing: number; dotSize: number };
  };
  ambientLight: { color: string; intensity: number };
  hemisphereLight?: { skyColor: string; groundColor: string; intensity: number };
  directionalLight?: {
    color: string;
    intensity: number;
    position: [number, number, number];
    castShadow: boolean;
    shadowMapSize?: number;
  };
  rimLight?: { color: string; intensity: number; position: [number, number, number] };
  bloom?: { strength: number; radius: number; threshold: number };
  resources: Record<ResourceType, {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    opacity: number;
    wireframe?: boolean;
    pointLight?: { intensity: number; distance: number; decay: number };
    transmission?: number;
    roughness?: number;
    thickness?: number;
    metalness?: number;
  }>;
  states: {
    planned: { opacity: number; pulse: boolean };
    applied: { opacity: number; pulse: boolean };
    modified: { opacity: number; glow: string };
    destroyed: { opacity: number; color: string };
    error: { opacity: number; color: string; icon: string };
  };
  animations: {
    createDuration: number;
    destroyDuration: number;
    hoverScale: number;
    selectionGlow: number;
  };
}

export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutCubic';

export interface Animation {
  id: string;
  type: 'create' | 'destroy' | 'modify' | 'hover' | 'select' | 'focus' | 'pulse';
  target: string | string[];
  duration: number;
  easing: EasingFunction;
  interruptible: boolean;
}
