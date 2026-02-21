import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Theme, TerraformState, Resource, Animation } from './types';
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
    this.animator = new Animator();
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
    
    // Setup lighting
    this.setupLighting();
    
    // Setup ground
    this.setupGround();
    
    // Start render loop
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    
    // Setup interactions
    this.selection.on('select', (id: string) => this.onSelect(id));
    this.selection.on('hover', (id: string | null) => this.onHover(id));
  }
  
  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(
      this.theme.ambientLight.color,
      this.theme.ambientLight.intensity
    );
    this.scene.add(ambient);
  }
  
  private setupGround(): void {
    // TODO: Add checkerboard ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({ color: this.theme.ground.color })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    this.scene.add(ground);
  }
  
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.animator.update(16); // ~60fps
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
    }
    
    // Update position
    if (position) {
      mesh.position.set(position.x, position.y, position.z);
    }
  }
  
  private upsertConnection(conn: Connection): void {
    // TODO: Implement connection lines
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
