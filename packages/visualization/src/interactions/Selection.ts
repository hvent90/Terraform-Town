import * as THREE from 'three';

type EventCallback = (...args: any[]) => void;

export class SelectionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hovered: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private domElement: HTMLElement | null = null;
  private tooltip: HTMLDivElement | null = null;

  private boundMouseMove: (e: MouseEvent) => void;

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
  }

  attach(domElement: HTMLElement): void {
    this.domElement = domElement;
    domElement.addEventListener('mousemove', this.boundMouseMove);
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

  getTooltipElement(): HTMLDivElement {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.style.display = 'none';
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.pointerEvents = 'none';
      this.tooltip.style.padding = '6px 10px';
      this.tooltip.style.borderRadius = '4px';
      this.tooltip.style.background = 'rgba(0, 0, 0, 0.85)';
      this.tooltip.style.color = '#00FFFF';
      this.tooltip.style.fontSize = '12px';
      this.tooltip.style.fontFamily = 'monospace';
      this.tooltip.style.border = '1px solid rgba(0, 255, 255, 0.3)';
      this.tooltip.style.zIndex = '1000';
    }
    return this.tooltip;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.domElement) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Find the first intersected mesh with userData.id
    let hitId: string | null = null;
    let hitResource: any = null;
    for (const intersect of intersects) {
      const obj = intersect.object;
      if (obj.userData && obj.userData.id) {
        hitId = obj.userData.id;
        hitResource = obj.userData.resource;
        break;
      }
    }

    // Update tooltip
    const tooltip = this.getTooltipElement();
    if (hitId && hitResource) {
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      tooltip.textContent = `${hitResource.name} (${hitResource.type})`;
    } else {
      tooltip.style.display = 'none';
    }

    // Emit hover event if changed
    if (hitId !== this.hovered) {
      this.hovered = hitId;
      this.emit('hover', hitId);
    }
  }

  dispose(): void {
    if (this.domElement) {
      this.domElement.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.tooltip && this.tooltip.parentElement) {
      this.tooltip.parentElement.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.domElement = null;
  }
}
