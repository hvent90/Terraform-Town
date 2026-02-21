import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SelectionManager } from '../src/interactions/Selection';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-010: Double-click focuses camera', () => {
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let selection: SelectionManager;

  const mockResource = {
    id: 'aws_vpc.main',
    name: 'main',
    type: 'vpc',
    attributes: { cidr_block: '10.0.0.0/16' },
    state: 'applied',
  };

  function addMeshToScene(resource = mockResource, position = { x: 20, y: 0, z: 30 }) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial()
    );
    mesh.userData = {
      id: resource.id,
      type: resource.type,
      resource,
    };
    mesh.position.set(position.x, position.y, position.z);
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

  describe('Double-click triggers camera animation', () => {
    test('dblclick event is bound to canvas', () => {
      const spy = vi.spyOn(canvas, 'addEventListener');
      const sel = new SelectionManager(camera, scene);
      sel.attach(canvas);
      expect(spy).toHaveBeenCalledWith('dblclick', expect.any(Function));
      sel.dispose();
    });

    test('double-click on mesh emits focus event with resource id', () => {
      addMeshToScene();
      mockBoundingRect();

      let focusedId: string | null = null;
      selection.on('focus', (id: string) => {
        focusedId = id;
      });

      canvas.dispatchEvent(new MouseEvent('dblclick', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      expect(focusedId).toBe('aws_vpc.main');
    });

    test('double-click on empty space does not emit focus', () => {
      addMeshToScene();
      mockBoundingRect();

      let focusCalled = false;
      selection.on('focus', () => {
        focusCalled = true;
      });

      canvas.dispatchEvent(new MouseEvent('dblclick', {
        clientX: 10, clientY: 10, bubbles: true,
      }));

      expect(focusCalled).toBe(false);
    });

    test('focus event includes mesh position', () => {
      addMeshToScene(mockResource, { x: 20, y: 0, z: 30 });
      mockBoundingRect();

      let focusPosition: { x: number; y: number; z: number } | null = null;
      selection.on('focus', (_id: string, pos: { x: number; y: number; z: number }) => {
        focusPosition = pos;
      });

      canvas.dispatchEvent(new MouseEvent('dblclick', {
        clientX: 400, clientY: 300, bubbles: true,
      }));

      expect(focusPosition).toEqual({ x: 20, y: 0, z: 30 });
    });
  });

  describe('Camera moves to resource', () => {
    test('focusCamera animates camera toward target position', () => {
      // The camera should move closer to the target
      const startPos = camera.position.clone();
      const targetPos = new THREE.Vector3(20, 0, 30);

      selection.focusCamera(targetPos, camera, 600);

      // After calling focusCamera, an animation should be set up
      // Simulate time passing by calling update
      selection.updateFocusAnimation(600); // full duration

      const endPos = camera.position.clone();
      // Camera should have moved closer to the target
      const startDist = startPos.distanceTo(targetPos);
      const endDist = endPos.distanceTo(targetPos);
      expect(endDist).toBeLessThan(startDist);
    });

    test('focusCamera maintains offset above target (not inside it)', () => {
      const targetPos = new THREE.Vector3(20, 0, 30);
      selection.focusCamera(targetPos, camera, 600);
      selection.updateFocusAnimation(600);

      // Camera should be above target, not at the exact position
      expect(camera.position.y).toBeGreaterThan(targetPos.y);
    });
  });

  describe('Animation duration ~600ms', () => {
    test('animation completes after 600ms', () => {
      const targetPos = new THREE.Vector3(20, 0, 30);
      selection.focusCamera(targetPos, camera, 600);

      // At 0ms, camera should be at start
      const startPos = camera.position.clone();

      // At 300ms (halfway), camera should have moved partially
      selection.updateFocusAnimation(300);
      const midPos = camera.position.clone();
      expect(midPos).not.toEqual(startPos);

      // At 600ms (complete), camera should be at final position
      selection.updateFocusAnimation(300);
      const endPos = camera.position.clone();

      // Additional updates should not move camera further
      selection.updateFocusAnimation(100);
      const afterPos = camera.position.clone();
      expect(afterPos.x).toBeCloseTo(endPos.x, 5);
      expect(afterPos.y).toBeCloseTo(endPos.y, 5);
      expect(afterPos.z).toBeCloseTo(endPos.z, 5);
    });
  });

  describe('Animation is smooth', () => {
    test('intermediate positions form a smooth path (no teleporting)', () => {
      const targetPos = new THREE.Vector3(20, 0, 30);
      selection.focusCamera(targetPos, camera, 600);

      const positions: THREE.Vector3[] = [camera.position.clone()];
      const steps = 10;
      const stepDuration = 600 / steps;

      for (let i = 0; i < steps; i++) {
        selection.updateFocusAnimation(stepDuration);
        positions.push(camera.position.clone());
      }

      // Each step should move less than the total distance (no teleporting)
      const totalDist = positions[0].distanceTo(positions[positions.length - 1]);
      for (let i = 1; i < positions.length; i++) {
        const stepDist = positions[i - 1].distanceTo(positions[i]);
        expect(stepDist).toBeLessThan(totalDist);
      }

      // Distance to target should monotonically decrease
      for (let i = 1; i < positions.length; i++) {
        const prevDist = positions[i - 1].distanceTo(targetPos);
        const currDist = positions[i].distanceTo(targetPos);
        expect(currDist).toBeLessThanOrEqual(prevDist + 0.01); // small epsilon for floating point
      }
    });

    test('dispose removes dblclick listener', () => {
      const spy = vi.spyOn(canvas, 'removeEventListener');
      selection.dispose();
      expect(spy).toHaveBeenCalledWith('dblclick', expect.any(Function));
    });
  });
});
