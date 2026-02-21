import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SelectionManager } from '../src/interactions/Selection';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-008: Hover shows tooltip', () => {
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let selection: SelectionManager;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800 });
    Object.defineProperty(container, 'clientHeight', { value: 600 });
    document.body.appendChild(container);

    canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });
    container.appendChild(canvas);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);

    selection = new SelectionManager(camera, scene);
    selection.attach(canvas);
  });

  afterEach(() => {
    selection.dispose();
    document.body.removeChild(container);
  });

  describe('SelectionManager raycasting', () => {
    test('attach binds mousemove event to canvas', () => {
      const spy = vi.spyOn(canvas, 'addEventListener');
      const sel = new SelectionManager(camera, scene);
      sel.attach(canvas);
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      sel.dispose();
    });

    test('emits hover event with resource id on mouseover mesh', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshBasicMaterial()
      );
      mesh.userData = { id: 'aws_vpc.main', type: 'vpc', resource: { name: 'main' } };
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      let hoveredId: string | null = null;
      selection.on('hover', (id: string | null) => {
        hoveredId = id;
      });

      // Simulate a mousemove event at center of canvas (pointing at the mesh)
      const event = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300,
        bubbles: true,
      });
      // Need to mock getBoundingClientRect for coordinate calculation
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => {},
      });
      canvas.dispatchEvent(event);

      expect(hoveredId).toBe('aws_vpc.main');
    });

    test('emits hover null when mouse leaves mesh', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial()
      );
      mesh.userData = { id: 'aws_vpc.main', type: 'vpc', resource: { name: 'main' } };
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      const events: (string | null)[] = [];
      selection.on('hover', (id: string | null) => {
        events.push(id);
      });

      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => {},
      });

      // Move to mesh center
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }));
      // Move far off to the side (no mesh hit)
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true }));

      // Should have received a hover id then hover null
      expect(events).toContain(null);
    });

    test('dispose removes event listeners', () => {
      const spy = vi.spyOn(canvas, 'removeEventListener');
      selection.dispose();
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });
  });

  describe('Tooltip DOM element', () => {
    test('getTooltipElement returns an HTML element', () => {
      const tooltip = selection.getTooltipElement();
      expect(tooltip).toBeInstanceOf(HTMLElement);
    });

    test('tooltip is hidden by default', () => {
      const tooltip = selection.getTooltipElement();
      expect(tooltip.style.display).toBe('none');
    });

    test('tooltip shows resource name and type on hover', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshBasicMaterial()
      );
      mesh.userData = {
        id: 'aws_vpc.main',
        type: 'vpc',
        resource: { id: 'aws_vpc.main', name: 'main', type: 'vpc' },
      };
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => {},
      });

      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }));

      const tooltip = selection.getTooltipElement();
      expect(tooltip.style.display).not.toBe('none');
      expect(tooltip.textContent).toContain('main');
      expect(tooltip.textContent).toContain('vpc');
    });

    test('tooltip follows mouse position', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshBasicMaterial()
      );
      mesh.userData = {
        id: 'aws_vpc.main',
        type: 'vpc',
        resource: { id: 'aws_vpc.main', name: 'main', type: 'vpc' },
      };
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => {},
      });

      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }));

      const tooltip = selection.getTooltipElement();
      // Tooltip should be positioned near the mouse (with offset)
      const left = parseInt(tooltip.style.left);
      const top = parseInt(tooltip.style.top);
      expect(left).toBeGreaterThan(0);
      expect(top).toBeGreaterThan(0);
    });

    test('tooltip hides when hovering off mesh', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial()
      );
      mesh.userData = {
        id: 'aws_vpc.main',
        type: 'vpc',
        resource: { id: 'aws_vpc.main', name: 'main', type: 'vpc' },
      };
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => {},
      });

      // Hover on mesh
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }));
      // Hover off mesh
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true }));

      const tooltip = selection.getTooltipElement();
      expect(tooltip.style.display).toBe('none');
    });
  });
});
