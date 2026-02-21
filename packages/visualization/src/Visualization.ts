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
  private camera: THREE.OrthographicCamera;
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
  private groundMesh!: THREE.Mesh;
  
  constructor(container: HTMLElement, theme: Theme = defaultTheme) {
    this.container = container;
    this.theme = theme;
    
    // Initialize Three.js
    this.scene = new THREE.Scene();
    
    // Orthographic camera for fixed perspective (top-down view)
    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 100; // Visible height in world units
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,  // left
      frustumSize * aspect / 2,   // right
      frustumSize / 2,            // top
      frustumSize / -2,           // bottom
      0.1,                        // near
      1000                        // far
    );
    
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
  
      // Setup fog for depth
      if (this.theme.fog) {
        this.scene.fog = new THREE.Fog(this.theme.fog.color, this.theme.fog.near, this.theme.fog.far);
      }
  
      // Setup camera - fixed orthographic isometric view (Diablo 2 style)    // Angled view: high up and to the side, looking at center
    this.camera.position.set(50, 80, 50);  // Angled from top-right
    this.camera.lookAt(0, 0, 0);
    
    // Setup controls - pan and zoom only (no rotation for fixed perspective)
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableRotate = false;  // Disable rotation for fixed top-down view
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,     // Left click drag = pan
      MIDDLE: THREE.MOUSE.DOLLY, // Middle click = zoom
      RIGHT: THREE.MOUSE.PAN,    // Right click drag = pan
    };
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 3;
    
    // Touch controls
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,      // One finger = pan
      TWO: THREE.TOUCH.DOLLY_PAN, // Two fingers = pinch zoom + pan
    };
    
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
    // No ambient light - everything is lit only by primitive emissive lights
    // Primitives themselves emit light (point lights added in ResourceFactory)
  }
  
  private setupGround(): void {
    const checker = this.theme.ground.checkerboard;
    let material: THREE.MeshStandardMaterial;

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
      // The canvas is (tileSize * 2) units wide in world space.
      const worldTextureSize = tileSize * tiles;
      texture.repeat.set(1000 / worldTextureSize, 1000 / worldTextureSize);

      // Dark glass/metallic TRON grid feel
      material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.15,   // High gloss (reflects point lights)
        metalness: 0.8,    // Dark metallic TRON grid feel
      });
    } else {
      material = new THREE.MeshStandardMaterial({ 
        color: this.theme.ground.color,
        roughness: 0.15,
        metalness: 0.8,
      });
    }

    // Initialize with a large default size, we will resize it dynamically based on resources
    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -1;
    this.groundMesh.userData = { isGround: true };
    this.scene.add(this.groundMesh);
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
    const aspect = width / height;
    const frustumSize = 100;
    
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
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
    
        // Ensure ground plane covers all resources
        this.updateGroundBounds(positions);
      }
    
      private updateGroundBounds(positions?: Map<string, { x: number; y: number; z: number }>): void {
        if (this.resources.size === 0) return;
    
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
    
        for (const [id, group] of this.resources.entries()) {
          const pos = positions?.get(id) || group.position;
          if (pos.x < minX) minX = pos.x;
          if (pos.x > maxX) maxX = pos.x;
          if (pos.z < minZ) minZ = pos.z;
          if (pos.z > maxZ) maxZ = pos.z;
        }
    // Add a generous margin so fake lights don't bleed off the edge
    // Use a proportional margin for large graphs (e.g. 25% of the size) or a minimum of 200
    const marginX = Math.max(200, (maxX - minX) * 0.25);
    const marginZ = Math.max(200, (maxZ - minZ) * 0.25);
    
    const width = (maxX - minX) + (marginX * 2);
    const depth = (maxZ - minZ) + (marginZ * 2);

    // Center the ground plane exactly on the resources' bounding box
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const targetWidth = Math.max(width, 1000);
    const targetDepth = Math.max(depth, 1000);

    // Only recreate geometry if size changed significantly
    const currentGeo = this.groundMesh.geometry as THREE.PlaneGeometry;
    const params = currentGeo.parameters;
    
    if (Math.abs(params.width - targetWidth) > 10 || Math.abs(params.height - targetDepth) > 10) {
      this.groundMesh.geometry.dispose();
      this.groundMesh.geometry = new THREE.PlaneGeometry(targetWidth, targetDepth);
    }

    // Update position
    this.groundMesh.position.set(centerX, -1, centerZ);

    // Ensure the checkerboard grid stays locked to world coordinates (0,0)
    // even as the plane resizes and moves around.
    const material = this.groundMesh.material as THREE.MeshStandardMaterial;
    if (material.map) {
      const checkerSize = this.theme.ground.checkerboard?.size || 10;
      const textureWorldSize = checkerSize * 2; // Since we draw 2x2 tiles per texture
      
      material.map.repeat.set(targetWidth / textureWorldSize, targetDepth / textureWorldSize);
      
      // Calculate world coordinates of the bottom-left corner of the plane
      // The plane extends from -targetWidth/2 to +targetWidth/2 in local space
      const startWorldX = centerX - targetWidth / 2;
      const startWorldZ = centerZ - targetDepth / 2;
      
      // Offset the texture so that world (0,0) aligns with texture (0,0)
      material.map.offset.set(-startWorldX / textureWorldSize, -startWorldZ / textureWorldSize);
      material.map.needsUpdate = true;
    }
  }

  private upsertResource(resource: Resource, position?: { x: number; y: number; z: number }): void {
    let group = this.resources.get(resource.id);
    
    if (!group) {
      // Create new
      group = this.resourceFactory.create(resource);
      this.scene.add(group);
      this.resources.set(resource.id, group);
      
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
    
    // Update position (group position, not mesh)
    if (position) {
      group.position.set(position.x, position.y, position.z);
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
