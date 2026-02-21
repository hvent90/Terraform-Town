import * as THREE from 'three';
import type { Resource, Theme } from '../types';

export class ResourceFactory {
  constructor(private theme: Theme) {}
  
  create(resource: Resource): THREE.Object3D {
    const config = this.theme.resources[resource.type] ?? {
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.3,
      opacity: 1,
    };
    
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    
    switch (resource.type) {
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
        // TODO: Custom shield geometry
        geometry = new THREE.BoxGeometry(1.5, 2, 0.3);
        break;
      case 'lambda_function':
        geometry = new THREE.SphereGeometry(1, 16, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
    }
    
    // Apply state-based opacity
    const stateConfig = this.theme.states[resource.state];
    const targetOpacity = stateConfig && 'opacity' in stateConfig
      ? Math.min(config.opacity, stateConfig.opacity)
      : config.opacity;

    material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      transparent: targetOpacity < 1,
      opacity: targetOpacity,
      ...(config.wireframe !== undefined && { wireframe: config.wireframe }),
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { id: resource.id, type: resource.type, resource, targetOpacity };
    
    return mesh;
  }
}
