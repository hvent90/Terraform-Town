import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Theme, TerraformState, Resource, Connection } from './types';
import { defaultTheme } from './themes/default';
import { ResourceFactory } from './resources/ResourceFactory';
import { Animator } from './animations/Animator';
import { ForceLayout } from './layout/ForceLayout';
import { StateSync } from './state/StateSync';
import { SelectionManager } from './interactions/Selection';

export class Visualization {
  private container: HTMLElement;
  private theme: Theme;
  
  // Three.js core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  // Managers
  private resourceFactory: ResourceFactory;
  private animator: Animator;
  private layout: ForceLayout;
  private stateSync: StateSync;
  private selection: SelectionManager;
  
  // State
  private resources: Map<string, THREE.Object3D> = new Map();
  private connections: Map<string, THREE.Line> = new Map();
  private animationId: number | null = null;
  
  constructor(container: HTMLElement, theme: Theme = defaultTheme) {
    this.container = container;
    this.theme = theme;
    
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Initialize managers
    this.resourceFactory = new ResourceFactory(this.theme);
    this.animator = new Animator((id) => this.resources.get(id));
    this.layout = new ForceLayout();
    this.stateSync = new StateSync();
    this.selection = new SelectionManager(this.camera, this.scene);
    
    this.init();
  }
  
  private init(): void {
    // Setup renderer
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(this.theme.background, 1);
    this.container.appendChild(this.renderer.domElement);
    
    // Setup camera
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);
    
    // Setup controls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI / 2;
    
    // Setup lighting
    this.setupLighting();
    
    // Setup ground
    this.setupGround();
    
    // Start render loop
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    
    // Setup interactions
    this.selection.attach(this.renderer.domElement);
    this.container.appendChild(this.selection.getTooltipElement());
    this.container.appendChild(this.selection.getDetailPanel());
    this.selection.on('select', (id: string) => this.onSelect(id));
    this.selection.on('hover', (id: string | null) => this.onHover(id));
    this.selection.on('focus', (_id: string, pos: { x: number; y: number; z: number }) => {
      this.selection.focusCamera(new THREE.Vector3(pos.x, pos.y, pos.z), this.camera, 600);
    });
  }
  
  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(
      this.theme.ambientLight.color,
      this.theme.ambientLight.intensity
    );
    this.scene.add(ambient);
  }
  
  private setupGround(): void {
    const checker = this.theme.ground.checkerboard;
    let material: THREE.MeshBasicMaterial;

    if (checker) {
      const canvas = document.createElement('canvas');
      const tileSize = checker.size;
      const tiles = 2;
      canvas.width = tileSize * tiles;
      canvas.height = tileSize * tiles;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        for (let row = 0; row < tiles; row++) {
          for (let col = 0; col < tiles; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? checker.color1 : checker.color2;
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
          }
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10);

      material = new THREE.MeshBasicMaterial({ map: texture });
    } else {
      material = new THREE.MeshBasicMaterial({ color: this.theme.ground.color });
    }

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.userData = { isGround: true };
    this.scene.add(ground);
  }
  
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.animator.update(16); // ~60fps
    this.selection.updateFocusAnimation(16);
    this.renderer.render(this.scene, this.camera);
  };
  
  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  private onSelect(id: string): void {
    // TODO: Show detail panel
    console.log('Selected:', id);
  }
  
  private onHover(id: string | null): void {
    // TODO: Show tooltip
    if (id) console.log('Hover:', id);
  }
  
  // Public API
  
  update(state: TerraformState): void {
    // Calculate layout
    const positions = this.layout.calculate(state.resources);
    
    // Create/update resources
    for (const resource of state.resources) {
      this.upsertResource(resource, positions.get(resource.id));
    }
    
    // Create/update connections
    for (const conn of state.connections) {
      this.upsertConnection(conn);
    }
  }
  
  private upsertResource(resource: Resource, position?: { x: number; y: number; z: number }): void {
    let mesh = this.resources.get(resource.id);
    
    if (!mesh) {
      // Create new
      mesh = this.resourceFactory.create(resource);
      this.scene.add(mesh);
      this.resources.set(resource.id, mesh);
      
      // Animate in
      this.animator.play({
        id: `create-${resource.id}`,
        type: 'create',
        target: resource.id,
        duration: this.theme.animations.createDuration,
        easing: 'easeOut',
        interruptible: true,
      });

      // Start pulse for planned resources
      const stateConfig = this.theme.states[resource.state];
      if (stateConfig && 'pulse' in stateConfig && stateConfig.pulse) {
        this.animator.play({
          id: `pulse-${resource.id}`,
          type: 'pulse',
          target: resource.id,
          duration: 1000, // pulse period
          easing: 'linear',
          interruptible: true,
        });
      }
    }
    
    // Update position
    if (position) {
      mesh.position.set(position.x, position.y, position.z);
    }
  }
  
  private upsertConnection(conn: Connection): void {
    const fromMesh = this.resources.get(conn.from);
    const toMesh = this.resources.get(conn.to);
    if (!fromMesh || !toMesh) return;

    const key = `${conn.from}->${conn.to}`;
    let line = this.connections.get(key);

    if (!line) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 points × 3 components
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
      });

      line = new THREE.Line(geometry, material);
      line.userData = { connectionId: key };
      this.scene.add(line);
      this.connections.set(key, line);
    }

    // Update positions to match current resource positions
    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, fromMesh.position.x, fromMesh.position.y, fromMesh.position.z);
    posAttr.setXYZ(1, toMesh.position.x, toMesh.position.y, toMesh.position.z);
    posAttr.needsUpdate = true;
  }
  
  focus(resourceId: string): void {
    const mesh = this.resources.get(resourceId);
    if (mesh) {
      this.animator.play({
        id: `focus-${resourceId}`,
        type: 'focus',
        target: resourceId,
        duration: 600,
        easing: 'easeInOut',
        interruptible: true,
      });
    }
  }
  
  setTheme(theme: Theme): void {
    this.theme = theme;
    // TODO: Update all resources
  }
  
  on(event: string, callback: Function): void {
    this.selection.on(event, callback as any);
  }
  
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.controls.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
