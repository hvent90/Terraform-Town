import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Theme, TerraformState, Resource, Connection } from './types';
import { defaultTheme } from './themes/default';
import { ResourceFactory } from './resources/ResourceFactory';
import { Animator } from './animations/Animator';
import { ForceLayout } from './layout/ForceLayout';
import { SelectionManager } from './interactions/Selection';

export class Visualization {
  private container: HTMLElement;
  private theme: Theme;

  private scene: THREE.Scene;
  private orthoCamera: THREE.OrthographicCamera;
  private perspCamera: THREE.PerspectiveCamera;
  private activeCamera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private renderer: THREE.WebGPURenderer;
  private controls!: OrbitControls;
  private postProcessing!: THREE.PostProcessing;

  private resourceFactory: ResourceFactory;
  private animator: Animator;
  private layout: ForceLayout;
  private selection: SelectionManager;

  private resources: Map<string, THREE.Object3D> = new Map();
  private connections: Map<string, THREE.Line> = new Map();
  private animationId: number | null = null;
  private groundMesh!: THREE.Mesh;

  private constructor(container: HTMLElement, theme: Theme, renderer: THREE.WebGPURenderer) {
    this.container = container;
    this.theme = theme;
    this.renderer = renderer;

    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 100;

    this.orthoCamera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2, 0.1, 2000,
    );
    this.perspCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    this.activeCamera = this.orthoCamera;

    this.resourceFactory = new ResourceFactory(this.theme);
    this.animator = new Animator((id) => this.resources.get(id));
    this.layout = new ForceLayout();
    this.selection = new SelectionManager(this.activeCamera, this.scene);

    this.init();
  }

  static async create(container: HTMLElement, theme: Theme = defaultTheme): Promise<Visualization> {
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    await renderer.init();
    return new Visualization(container, theme, renderer);
  }

  private init(): void {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(this.theme.background), 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.orthoCamera.position.set(50, 80, 50);
    this.orthoCamera.lookAt(0, 0, 0);
    this.perspCamera.position.set(50, 80, 50);
    this.perspCamera.lookAt(0, 0, 0);

    this.setupControls();
    this.setupLighting();
    this.setupGround();
    this.setupPostProcessing();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') this.toggleCamera();
    });

    this.selection.attach(this.renderer.domElement);
    this.container.appendChild(this.selection.getTooltipElement());
    this.container.appendChild(this.selection.getDetailPanel());
    this.selection.on('focus', (_id: string, pos: { x: number; y: number; z: number }) => {
      this.selection.focusCamera(new THREE.Vector3(pos.x, pos.y, pos.z), this.activeCamera, 600);
    });
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.activeCamera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    if (this.activeCamera === this.orthoCamera) {
      this.controls.enableRotate = false;
      this.controls.screenSpacePanning = false;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.minZoom = 0.5;
      this.controls.maxZoom = 3;
      this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    } else {
      this.controls.enableRotate = true;
      this.controls.screenSpacePanning = false;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
  }

  private toggleCamera(): void {
    if (this.activeCamera !== this.orthoCamera) {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(50, 80, 50);
      this.orthoCamera.lookAt(0, 0, 0);
      this.controls.dispose();
      this.setupControls();
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else {
      const target = this.controls.target.clone();
      this.activeCamera = this.perspCamera;
      this.perspCamera.position.copy(this.orthoCamera.position);
      this.perspCamera.lookAt(target);
      this.controls.dispose();
      this.setupControls();
      this.controls.target.copy(target);
      this.controls.update();
    }
    this.selection.setCamera(this.activeCamera);
    this.setupPostProcessing();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(this.theme.ambientLight.color, this.theme.ambientLight.intensity);
    this.scene.add(ambient);

    if (this.theme.hemisphereLight) {
      const hemi = new THREE.HemisphereLight(
        this.theme.hemisphereLight.skyColor,
        this.theme.hemisphereLight.groundColor,
        this.theme.hemisphereLight.intensity,
      );
      this.scene.add(hemi);
    }

    if (this.theme.directionalLight) {
      const dirLight = new THREE.DirectionalLight(this.theme.directionalLight.color, this.theme.directionalLight.intensity);
      const [x, y, z] = this.theme.directionalLight.position;
      dirLight.position.set(x, y, z);
      if (this.theme.directionalLight.castShadow) {
        dirLight.castShadow = true;
        const mapSize = this.theme.directionalLight.shadowMapSize ?? 512;
        dirLight.shadow.mapSize.width = mapSize;
        dirLight.shadow.mapSize.height = mapSize;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
      }
      this.scene.add(dirLight);
    }

    if (this.theme.rimLight) {
      const rimLight = new THREE.PointLight(this.theme.rimLight.color, this.theme.rimLight.intensity);
      const [rx, ry, rz] = this.theme.rimLight.position;
      rimLight.position.set(rx, ry, rz);
      this.scene.add(rimLight);
    }
  }

  private setupPostProcessing(): void {
    this.postProcessing = new THREE.PostProcessing(this.renderer);
    const scenePass = pass(this.scene, this.activeCamera);
    const scenePassColor = scenePass.getTextureNode('output');

    if (this.theme.bloom) {
      const bloomPass = bloom(scenePassColor, this.theme.bloom.strength, this.theme.bloom.radius, this.theme.bloom.threshold);
      this.postProcessing.outputNode = scenePassColor.add(bloomPass);
    } else {
      this.postProcessing.outputNode = scenePassColor;
    }
  }

  private setupGround(): void {
    const dots = this.theme.ground.dotGrid;

    const res = 128;
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, res, res);

    if (dots) {
      const cx = res / 2;
      const cy = res / 2;
      const dotRadius = res * 0.015;
      ctx.fillStyle = dots.dotColor;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const spacing = dots?.spacing ?? 2;
    texture.repeat.set(1000 / spacing, 1000 / spacing);

    const material = new THREE.MeshStandardNodeMaterial();
    material.map = texture;
    material.roughness = 0.9;
    material.metalness = 0.05;

    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -1;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.userData = { isGround: true };
    this.scene.add(this.groundMesh);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.animator.update(16);
    this.selection.updateFocusAnimation(16);
    this.postProcessing.render();
  };

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    const frustumSize = 100;

    this.orthoCamera.left = frustumSize * aspect / -2;
    this.orthoCamera.right = frustumSize * aspect / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = frustumSize / -2;
    this.orthoCamera.updateProjectionMatrix();

    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  update(state: TerraformState): void {
    const positions = this.layout.calculate(state.resources);
    for (const resource of state.resources) this.upsertResource(resource, positions.get(resource.id));
    for (const conn of state.connections) this.upsertConnection(conn);
  }

  private upsertResource(resource: Resource, position?: { x: number; y: number; z: number }): void {
    let group = this.resources.get(resource.id);

    if (!group) {
      group = this.resourceFactory.create(resource);
      this.scene.add(group);
      this.resources.set(resource.id, group);

      this.animator.play({
        id: `create-${resource.id}`, type: 'create', target: resource.id,
        duration: this.theme.animations.createDuration, easing: 'easeOut', interruptible: true,
      });

      const stateConfig = this.theme.states[resource.state];
      if (stateConfig && 'pulse' in stateConfig && stateConfig.pulse) {
        this.animator.play({
          id: `pulse-${resource.id}`, type: 'pulse', target: resource.id,
          duration: 1000, easing: 'linear', interruptible: true,
        });
      }
    }

    if (position) group.position.set(position.x, position.y, position.z);
  }

  private upsertConnection(conn: Connection): void {
    const fromMesh = this.resources.get(conn.from);
    const toMesh = this.resources.get(conn.to);
    if (!fromMesh || !toMesh) return;

    const key = `${conn.from}->${conn.to}`;
    let line = this.connections.get(key);

    if (!line) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicNodeMaterial();
      material.color = new THREE.Color(0x00ffff);
      material.transparent = true;
      material.opacity = 0.3;

      line = new THREE.Line(geometry, material);
      line.userData = { connectionId: key };
      this.scene.add(line);
      this.connections.set(key, line);
    }

    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, fromMesh.position.x, fromMesh.position.y, fromMesh.position.z);
    posAttr.setXYZ(1, toMesh.position.x, toMesh.position.y, toMesh.position.z);
    posAttr.needsUpdate = true;
  }

  on(event: string, callback: Function): void {
    this.selection.on(event, callback as any);
  }

  dispose(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.controls.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
