import * as THREE from 'three';

type EventCallback = (...args: any[]) => void;

export class SelectionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hovered: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  protected emit(event: string, ...args: any[]): void {
    for (const cb of this.listeners.get(event) ?? []) {
      cb(...args);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    // TODO: Raycast to find mesh
  }

  private onClick(event: MouseEvent): void {
    // TODO: Select mesh
  }
}
