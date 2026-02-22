import * as THREE from 'three/webgpu';
import type { Resource, Theme } from '../types';

export class ResourceFactory {
  private geometryCache = new Map<string, THREE.BufferGeometry>();

  constructor(private theme: Theme) {}

  private getGeometry(type: string): THREE.BufferGeometry {
    let geometry = this.geometryCache.get(type);
    if (geometry) return geometry;

    switch (type) {
      case 'vpc': geometry = new THREE.BoxGeometry(10, 10, 10); break;
      case 'subnet': geometry = new THREE.BoxGeometry(4, 4, 4); break;
      case 'security_group': geometry = new THREE.SphereGeometry(3, 16, 16); break;
      case 'instance': geometry = new THREE.BoxGeometry(2, 2, 2); break;
      case 's3_bucket': geometry = new THREE.CylinderGeometry(1, 1.5, 2, 16); break;
      case 'iam_role': geometry = new THREE.BoxGeometry(1.5, 2, 0.3); break;
      case 'lambda_function': geometry = new THREE.SphereGeometry(1, 16, 16); break;
      default: geometry = new THREE.BoxGeometry(2, 2, 2);
    }

    this.geometryCache.set(type, geometry);
    return geometry;
  }

  create(resource: Resource): THREE.Object3D {
    const config = this.theme.resources[resource.type] ?? {
      color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.3, opacity: 1,
    };

    const geometry = this.getGeometry(resource.type);

    const stateConfig = this.theme.states[resource.state];
    const targetOpacity = stateConfig && 'opacity' in stateConfig
      ? Math.min(config.opacity, stateConfig.opacity)
      : config.opacity;

    const useFrostedGlass = config.transmission !== undefined && !config.wireframe;

    const material = useFrostedGlass
      ? Object.assign(new THREE.MeshPhysicalNodeMaterial(), {
          color: new THREE.Color(config.color),
          emissive: new THREE.Color(config.emissive),
          emissiveIntensity: config.emissiveIntensity,
          transparent: true,
          opacity: targetOpacity,
          toneMapped: false,
          metalness: config.metalness ?? 0,
          roughness: config.roughness ?? 0.5,
          transmission: config.transmission!,
          thickness: config.thickness ?? 0.5,
        })
      : Object.assign(new THREE.MeshStandardNodeMaterial(), {
          color: new THREE.Color(config.color),
          emissive: new THREE.Color(config.emissive),
          emissiveIntensity: config.emissiveIntensity,
          transparent: targetOpacity < 1,
          opacity: targetOpacity,
          toneMapped: false,
          ...(config.wireframe !== undefined && { wireframe: config.wireframe }),
        });

    const mesh = new THREE.Mesh(geometry, material);

    geometry.computeBoundingBox();
    const halfHeight = geometry.boundingBox
      ? (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2
      : 1;
    mesh.position.y = halfHeight - 1;

    const group = new THREE.Group();
    group.add(mesh);

    if (config.pointLight) {
      const pointLight = new THREE.PointLight(
        config.emissive,
        config.pointLight.intensity,
        config.pointLight.distance,
        config.pointLight.decay,
      );
      pointLight.position.y = halfHeight - 1;
      pointLight.castShadow = false;
      group.add(pointLight);
    }

    group.userData = { id: resource.id, type: resource.type, resource, targetOpacity, mesh };
    return group;
  }
}
