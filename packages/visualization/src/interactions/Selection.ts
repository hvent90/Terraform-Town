import * as THREE from 'three/webgpu';

type EventCallback = (...args: any[]) => void;

export class SelectionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hovered: string | null = null;
  private selected: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private domElement: HTMLElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private detailPanel: HTMLDivElement | null = null;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundDblClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  private focusAnim: {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    elapsed: number;
    duration: number;
    camera: THREE.Camera;
  } | null = null;

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.boundMouseMove = (e) => this.onMouseMove(e);
    this.boundClick = (e) => this.onClick(e);
    this.boundDblClick = (e) => this.onDoubleClick(e);
    this.boundKeyDown = (e) => this.onKeyDown(e);
  }

  setCamera(camera: THREE.Camera): void { this.camera = camera; }

  attach(domElement: HTMLElement): void {
    this.domElement = domElement;
    domElement.addEventListener('mousemove', this.boundMouseMove);
    domElement.addEventListener('click', this.boundClick);
    domElement.addEventListener('dblclick', this.boundDblClick);
    document.addEventListener('keydown', this.boundKeyDown);
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  protected emit(event: string, ...args: any[]): void {
    for (const cb of this.listeners.get(event) ?? []) cb(...args);
  }

  getTooltipElement(): HTMLDivElement {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      Object.assign(this.tooltip.style, {
        display: 'none', position: 'fixed', pointerEvents: 'none',
        padding: '6px 10px', borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.85)', color: '#00FFFF',
        fontSize: '12px', fontFamily: 'monospace',
        border: '1px solid rgba(0, 255, 255, 0.3)', zIndex: '1000',
      });
    }
    return this.tooltip;
  }

  getDetailPanel(): HTMLDivElement {
    if (!this.detailPanel) {
      this.detailPanel = document.createElement('div');
      Object.assign(this.detailPanel.style, {
        display: 'none', position: 'fixed', top: '16px', right: '16px',
        width: '320px', maxHeight: '80vh', overflow: 'auto', padding: '16px',
        borderRadius: '6px', background: 'rgba(0, 0, 0, 0.9)', color: '#00FFFF',
        fontSize: '12px', fontFamily: 'monospace',
        border: '1px solid rgba(0, 255, 255, 0.3)', zIndex: '999',
      });
    }
    return this.detailPanel;
  }

  private raycastHit(event: MouseEvent): { id: string; resource: any } | null {
    if (!this.domElement) return null;
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.id) return { id: obj.userData.id, resource: obj.userData.resource };
        obj = obj.parent;
      }
    }
    return null;
  }

  private onMouseMove(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    const tooltip = this.getTooltipElement();
    if (hit?.resource) {
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      tooltip.textContent = `${hit.resource.name} (${hit.resource.type})`;
    } else {
      tooltip.style.display = 'none';
    }
    if (hit?.id !== this.hovered) {
      this.hovered = hit?.id ?? null;
      this.emit('hover', this.hovered);
    }
  }

  private onClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    this.selected = hit?.id ?? null;
    const panel = this.getDetailPanel();
    if (hit?.resource) {
      this.renderDetailPanel(hit.resource);
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
    this.emit('select', this.selected);
  }

  private onDoubleClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    if (hit) {
      const obj = this.scene.children.find(c => c.userData?.id === hit.id);
      if (obj) {
        this.emit('focus', hit.id, { x: obj.position.x, y: obj.position.y, z: obj.position.z });
      }
    }
  }

  focusCamera(target: THREE.Vector3, cam: THREE.Camera, duration: number): void {
    const offset = new THREE.Vector3(0, 20, 40);
    this.focusAnim = {
      startPos: cam.position.clone(),
      endPos: target.clone().add(offset),
      elapsed: 0, duration, camera: cam,
    };
  }

  updateFocusAnimation(deltaMs: number): void {
    if (!this.focusAnim) return;
    this.focusAnim.elapsed += deltaMs;
    const t = Math.min(this.focusAnim.elapsed / this.focusAnim.duration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    this.focusAnim.camera.position.lerpVectors(this.focusAnim.startPos, this.focusAnim.endPos, eased);
    if (t >= 1) this.focusAnim = null;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selected !== null) {
      this.selected = null;
      this.getDetailPanel().style.display = 'none';
      this.emit('select', null);
    }
  }

  private renderDetailPanel(resource: any): void {
    const panel = this.getDetailPanel();
    panel.innerHTML = '';
    const header = document.createElement('div');
    header.style.marginBottom = '12px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid rgba(0, 255, 255, 0.2)';
    header.innerHTML = `<div style="font-size:14px;font-weight:bold">${resource.name}</div><div style="opacity:0.7">${resource.type}</div>`;
    panel.appendChild(header);
    if (resource.attributes) {
      const attrs = document.createElement('div');
      this.renderAttributes(attrs, resource.attributes);
      panel.appendChild(attrs);
    }
  }

  private renderAttributes(container: HTMLElement, obj: Record<string, any>, indent = 0): void {
    for (const [key, value] of Object.entries(obj)) {
      const row = document.createElement('div');
      row.style.paddingLeft = `${indent * 12}px`;
      row.style.marginBottom = '4px';
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        row.innerHTML = `<span style="opacity:0.7">${key}:</span>`;
        container.appendChild(row);
        this.renderAttributes(container, value, indent + 1);
      } else {
        const displayValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
        row.innerHTML = `<span style="opacity:0.7">${key}:</span> ${displayValue}`;
        container.appendChild(row);
      }
    }
  }

  dispose(): void {
    if (this.domElement) {
      this.domElement.removeEventListener('dblclick', this.boundDblClick);
      this.domElement.removeEventListener('mousemove', this.boundMouseMove);
      this.domElement.removeEventListener('click', this.boundClick);
    }
    document.removeEventListener('keydown', this.boundKeyDown);
    this.tooltip?.parentElement?.removeChild(this.tooltip);
    this.detailPanel?.parentElement?.removeChild(this.detailPanel);
    this.tooltip = null;
    this.detailPanel = null;
    this.domElement = null;
    this.focusAnim = null;
  }
}
