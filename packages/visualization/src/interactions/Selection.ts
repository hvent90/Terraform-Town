import * as THREE from 'three';

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

  // Focus animation state
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
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    this.boundClick = (e: MouseEvent) => this.onClick(e);
    this.boundDblClick = (e: MouseEvent) => this.onDoubleClick(e);
    this.boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  }

  attach(domElement: HTMLElement): void {
    this.domElement = domElement;
    domElement.addEventListener('mousemove', this.boundMouseMove);
    domElement.addEventListener('click', this.boundClick);
    domElement.addEventListener('dblclick', this.boundDblClick);
    document.addEventListener('keydown', this.boundKeyDown);
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

  getDetailPanel(): HTMLDivElement {
    if (!this.detailPanel) {
      this.detailPanel = document.createElement('div');
      this.detailPanel.style.display = 'none';
      this.detailPanel.style.position = 'fixed';
      this.detailPanel.style.top = '16px';
      this.detailPanel.style.right = '16px';
      this.detailPanel.style.width = '320px';
      this.detailPanel.style.maxHeight = '80vh';
      this.detailPanel.style.overflow = 'auto';
      this.detailPanel.style.padding = '16px';
      this.detailPanel.style.borderRadius = '6px';
      this.detailPanel.style.background = 'rgba(0, 0, 0, 0.9)';
      this.detailPanel.style.color = '#00FFFF';
      this.detailPanel.style.fontSize = '12px';
      this.detailPanel.style.fontFamily = 'monospace';
      this.detailPanel.style.border = '1px solid rgba(0, 255, 255, 0.3)';
      this.detailPanel.style.zIndex = '999';
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
      const obj = intersect.object;
      if (obj.userData && obj.userData.id) {
        return { id: obj.userData.id, resource: obj.userData.resource };
      }
    }
    return null;
  }

  private onMouseMove(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    const hitId = hit?.id ?? null;
    const hitResource = hit?.resource ?? null;

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

  private onClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    const hitId = hit?.id ?? null;
    const hitResource = hit?.resource ?? null;

    this.selected = hitId;

    const panel = this.getDetailPanel();
    if (hitId && hitResource) {
      this.renderDetailPanel(hitResource);
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }

    this.emit('select', hitId);
  }

  private onDoubleClick(event: MouseEvent): void {
    const hit = this.raycastHit(event);
    if (hit) {
      const obj = this.scene.children.find(
        (c) => c.userData && c.userData.id === hit.id
      );
      if (obj) {
        const pos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        this.emit('focus', hit.id, pos);
      }
    }
  }

  focusCamera(target: THREE.Vector3, cam: THREE.Camera, duration: number): void {
    // Calculate end position: offset above and behind the target
    const offset = new THREE.Vector3(0, 20, 40);
    const endPos = target.clone().add(offset);

    this.focusAnim = {
      startPos: cam.position.clone(),
      endPos,
      elapsed: 0,
      duration,
      camera: cam,
    };
  }

  updateFocusAnimation(deltaMs: number): void {
    if (!this.focusAnim) return;

    this.focusAnim.elapsed += deltaMs;
    const t = Math.min(this.focusAnim.elapsed / this.focusAnim.duration, 1);

    // easeInOut cubic for smooth animation
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.focusAnim.camera.position.lerpVectors(
      this.focusAnim.startPos,
      this.focusAnim.endPos,
      eased
    );

    if (t >= 1) {
      this.focusAnim = null;
    }
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

    // Header: name and type
    const header = document.createElement('div');
    header.style.marginBottom = '12px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid rgba(0, 255, 255, 0.2)';
    header.innerHTML = `<div style="font-size:14px;font-weight:bold">${resource.name}</div><div style="opacity:0.7">${resource.type}</div>`;
    panel.appendChild(header);

    // Attributes
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
    if (this.tooltip && this.tooltip.parentElement) {
      this.tooltip.parentElement.removeChild(this.tooltip);
    }
    if (this.detailPanel && this.detailPanel.parentElement) {
      this.detailPanel.parentElement.removeChild(this.detailPanel);
    }
    this.tooltip = null;
    this.detailPanel = null;
    this.domElement = null;
    this.focusAnim = null;
  }
}
