import * as THREE from 'three';
import type { Resource, Theme } from '../types';
import { createFakeLight } from './FakeLight';

export class ResourceFactory {
  private geometryCache = new Map<string, THREE.BufferGeometry>();

  constructor(private theme: Theme) {}

  private getGeometry(type: string): THREE.BufferGeometry {
    let geometry = this.geometryCache.get(type);
    if (geometry) return geometry;

    switch (type) {
      case 'vpc':
        geometry = new THREE.BoxGeometry(10, 10, 10);
        break;
      case 'subnet':
        geometry = new THREE.BoxGeometry(4, 4, 4);
        break;
      case 'security_group':
        geometry = new THREE.SphereGeometry(3, 16, 16);
        break;
      case 'instance':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 's3_bucket':
        geometry = new THREE.CylinderGeometry(1, 1.5, 2, 16);
        break;
      case 'iam_role':
        geometry = new THREE.BoxGeometry(1.5, 2, 0.3);
        break;
      case 'lambda_function':
        geometry = new THREE.SphereGeometry(1, 16, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
    }

    this.geometryCache.set(type, geometry);
    return geometry;
  }

  create(resource: Resource): THREE.Object3D {
    const config = this.theme.resources[resource.type] ?? {
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.3,
      opacity: 1,
    };

    const geometry = this.getGeometry(resource.type);
    let material: THREE.Material;
    
    // Apply state-based opacity
    const stateConfig = this.theme.states[resource.state];
    const targetOpacity = stateConfig && 'opacity' in stateConfig
      ? Math.min(config.opacity, stateConfig.opacity)
      : config.opacity;

    // Using unlit / highly emissive material to pop without Bloom
    material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity * 2.0, // Boost since bloom is gone
      transparent: targetOpacity < 1,
      opacity: targetOpacity,
      ...(config.wireframe !== undefined && { wireframe: config.wireframe }),
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Create a group to hold mesh + fake light plane
    const group = new THREE.Group();
    group.add(mesh);
    
    // Determine fake light size
    let lightRange: number;
    switch (resource.type) {
      case 'vpc': lightRange = 24; break;
      case 'subnet': lightRange = 10; break;
      case 'security_group': lightRange = 12; break;
      case 'instance': lightRange = 6; break;
      case 's3_bucket': lightRange = 6; break;
      case 'iam_role': lightRange = 6; break;
      case 'lambda_function': lightRange = 6; break;
      default: lightRange = 6;
    }
    
    // Create the Fake Light plane and place it just slightly above ground (-1)
    // Assuming resources are near Y=0, we place it near ground to ensure it paints the floor
    const light = createFakeLight(config.emissive, lightRange);
    
    // We position the light so it paints the ground directly beneath the object.
    // Assuming the ground plane is at Y = -1
    // We place it at Y = -0.99 to avoid z-fighting with the ground plane
    light.position.set(0, -0.99, 0);
    
    // Ensure the light doesn't inherit parent scale/rotation since it should just be flat on the ground
    // We will update its absolute world position in the animate loop if needed, but relative to group is fine if group rotation stays 0
    group.add(light);
    
    // Store metadata on the group for raycasting
    group.userData = { 
      id: resource.id, 
      type: resource.type, 
      resource, 
      targetOpacity,
      mesh, // Reference to mesh for animations
      light, // Reference to light for animations
    };
    
    return group;
  }
}
