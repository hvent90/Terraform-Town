import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SelectionManager } from '../src/interactions/Selection';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-009: Click shows detail panel', () => {
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let selection: SelectionManager;

  const mockResource = {
    id: 'aws_vpc.main',
    name: 'main',
    type: 'vpc',
    attributes: {
      cidr_block: '10.0.0.0/16',
      enable_dns_support: true,
      tags: { Name: 'my-vpc' },
    },
    state: 'applied',
  };

  function addMeshToScene(resource = mockResource) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial()
    );
    mesh.userData = {
      id: resource.id,
      type: resource.type,
      resource,
    };
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    return mesh;
  }

  function mockBoundingRect() {
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
      x: 0, y: 0, toJSON: () => {},
    });
  }

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

  describe('Click selects resource', () => {
    test('click on mesh emits select event with resource id', () => {
      addMeshToScene();
      mockBoundingRect();

      let selectedId: string | null = null;
      selection.on('select', (id: string) => {
        selectedId = id;
      });

      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      expect(selectedId).toBe('aws_vpc.main');
    });

    test('click on empty space emits select null (deselect)', () => {
      addMeshToScene();
      mockBoundingRect();

      const events: (string | null)[] = [];
      selection.on('select', (id: string | null) => {
        events.push(id);
      });

      // Click on mesh first
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));
      // Click on empty space
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 10, clientY: 10, bubbles: true,
      }));

      expect(events).toContain(null);
    });

    test('attach binds click event to canvas', () => {
      const spy = vi.spyOn(canvas, 'addEventListener');
      const sel = new SelectionManager(camera, scene);
      sel.attach(canvas);
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
      sel.dispose();
    });
  });

  describe('Detail panel appears', () => {
    test('getDetailPanel returns an HTML element', () => {
      const panel = selection.getDetailPanel();
      expect(panel).toBeInstanceOf(HTMLElement);
    });

    test('detail panel is hidden by default', () => {
      const panel = selection.getDetailPanel();
      expect(panel.style.display).toBe('none');
    });

    test('clicking a mesh shows the detail panel', () => {
      addMeshToScene();
      mockBoundingRect();

      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.style.display).not.toBe('none');
    });

    test('clicking empty space hides the detail panel', () => {
      addMeshToScene();
      mockBoundingRect();

      // Click mesh to show panel
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));
      // Click empty space to hide panel
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 10, clientY: 10, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.style.display).toBe('none');
    });
  });

  describe('Panel shows all attributes', () => {
    test('panel displays resource name and type', () => {
      addMeshToScene();
      mockBoundingRect();

      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.textContent).toContain('main');
      expect(panel.textContent).toContain('vpc');
    });

    test('panel displays resource attributes', () => {
      addMeshToScene();
      mockBoundingRect();

      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.textContent).toContain('cidr_block');
      expect(panel.textContent).toContain('10.0.0.0/16');
    });

    test('panel displays nested attributes', () => {
      addMeshToScene();
      mockBoundingRect();

      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.textContent).toContain('tags');
      expect(panel.textContent).toContain('Name');
    });
  });

  describe('Escape closes panel', () => {
    test('pressing Escape closes the detail panel', () => {
      addMeshToScene();
      mockBoundingRect();

      // Click to open panel
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      const panel = selection.getDetailPanel();
      expect(panel.style.display).not.toBe('none');

      // Press Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(panel.style.display).toBe('none');
    });

    test('pressing Escape emits select null', () => {
      addMeshToScene();
      mockBoundingRect();

      const events: (string | null)[] = [];
      selection.on('select', (id: string | null) => {
        events.push(id);
      });

      // Click to select
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      // Press Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(events[events.length - 1]).toBeNull();
    });

    test('dispose removes keydown listener', () => {
      const spy = vi.spyOn(document, 'removeEventListener');
      selection.dispose();
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
