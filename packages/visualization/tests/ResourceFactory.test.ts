import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import { ResourceFactory } from '../src/resources/ResourceFactory';
import { defaultTheme } from '../src/themes/default';
import type { Resource } from '../src/types';

function makeResource(overrides: Partial<Resource> & Pick<Resource, 'id' | 'type'>): Resource {
  return { name: 'test', attributes: {}, state: 'applied', ...overrides };
}

function getMesh(group: THREE.Object3D): THREE.Mesh {
  return group.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh;
}

function getFakeLight(group: THREE.Object3D): THREE.Mesh | undefined {
  return group.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.PlaneGeometry) as THREE.Mesh;
}

describe('ResourceFactory', () => {
  const factory = new ResourceFactory(defaultTheme);

  test('VPC creates BoxGeometry(10,10,10)', () => {
    const group = factory.create(makeResource({ id: 'vpc-1', type: 'vpc' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(10);
    expect(params.height).toBe(10);
    expect(params.depth).toBe(10);
    expect(group.userData.id).toBe('vpc-1');
  });

  test('Instance creates BoxGeometry(2,2,2)', () => {
    const group = factory.create(makeResource({ id: 'i-1', type: 'instance' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(2);
    expect(params.height).toBe(2);
    expect(params.depth).toBe(2);
    expect(group.userData.type).toBe('instance');
  });

  test('Subnet creates BoxGeometry(4,4,4)', () => {
    const group = factory.create(makeResource({ id: 'sub-1', type: 'subnet' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(4);
    expect(params.height).toBe(4);
    expect(params.depth).toBe(4);
  });

  test('S3 Bucket creates CylinderGeometry', () => {
    const group = factory.create(makeResource({ id: 'bucket-1', type: 's3_bucket' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  });

  test('Lambda creates SphereGeometry', () => {
    const group = factory.create(makeResource({ id: 'func-1', type: 'lambda_function' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  test('Security Group creates SphereGeometry with wireframe', () => {
    const group = factory.create(makeResource({ id: 'sg-1', type: 'security_group' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.wireframe).toBe(true);
  });

  test('IAM Role creates BoxGeometry (shield placeholder)', () => {
    const group = factory.create(makeResource({ id: 'role-1', type: 'iam_role' }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  test('unknown type falls back to BoxGeometry(2,2,2)', () => {
    const group = factory.create(makeResource({ id: 'x-1', type: 'unknown' as any }));
    const mesh = getMesh(group);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(2);
    expect(params.height).toBe(2);
    expect(params.depth).toBe(2);
  });

  test('stores resource data in userData', () => {
    const resource = makeResource({ id: 'vpc-1', type: 'vpc', name: 'main' });
    const group = factory.create(resource);
    expect(group.userData.id).toBe('vpc-1');
    expect(group.userData.type).toBe('vpc');
    expect(group.userData.resource).toBe(resource);
  });

  test('applies theme colors', () => {
    const resource: Resource = {
      id: 'vpc-1',
      type: 'vpc',
      name: 'main',
      attributes: {},
      state: 'applied',
    };
    const group = factory.create(resource);
    const mesh = getMesh(group);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.color.getHexString()).toBe('00ffff');
  });

  test('applies emissive materials from theme', () => {
    const resource: Resource = {
      id: 'i-1',
      type: 'instance',
      name: 'web',
      attributes: {},
      state: 'applied',
    };
    const group = factory.create(resource);
    const mesh = getMesh(group);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.emissive).toBeDefined();
    expect(material.emissive.getHexString()).toBe('39ff14'); // Note: theme was updated to neon green
    expect(material.emissiveIntensity).toBe(1.2); // theme was updated to 0.6, multiplied by 2.0 in factory
  });

  test('applies wireframe for security group', () => {
    const resource: Resource = {
      id: 'sg-1',
      type: 'security_group',
      name: 'web-sg',
      attributes: {},
      state: 'applied',
    };
    const group = factory.create(resource);
    const mesh = getMesh(group);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.wireframe).toBe(true);
    expect(material.emissive.getHexString()).toBe('ff8c00');
  });

  test('adds a fake light plane for floor illumination', () => {
    const resource = makeResource({ id: 'i-1', type: 'instance' });
    const group = factory.create(resource);
    const light = getFakeLight(group);
    
    expect(light).toBeDefined();
    expect(light!.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    const material = light!.material as THREE.MeshBasicMaterial;
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
  });
});
