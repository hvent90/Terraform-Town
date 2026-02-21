import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import { ResourceFactory } from '../src/resources/ResourceFactory';
import { defaultTheme } from '../src/themes/default';
import type { Resource } from '../src/types';

function makeResource(overrides: Partial<Resource> & Pick<Resource, 'id' | 'type'>): Resource {
  return { name: 'test', attributes: {}, state: 'applied', ...overrides };
}

describe('ResourceFactory', () => {
  const factory = new ResourceFactory(defaultTheme);

  test('VPC creates BoxGeometry(10,10,10)', () => {
    const mesh = factory.create(makeResource({ id: 'vpc-1', type: 'vpc' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(10);
    expect(params.height).toBe(10);
    expect(params.depth).toBe(10);
    expect(mesh.userData.id).toBe('vpc-1');
  });

  test('Instance creates BoxGeometry(2,2,2)', () => {
    const mesh = factory.create(makeResource({ id: 'i-1', type: 'instance' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(2);
    expect(params.height).toBe(2);
    expect(params.depth).toBe(2);
    expect(mesh.userData.type).toBe('instance');
  });

  test('Subnet creates BoxGeometry(4,4,4)', () => {
    const mesh = factory.create(makeResource({ id: 'sub-1', type: 'subnet' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(4);
    expect(params.height).toBe(4);
    expect(params.depth).toBe(4);
  });

  test('S3 Bucket creates CylinderGeometry', () => {
    const mesh = factory.create(makeResource({ id: 'bucket-1', type: 's3_bucket' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  });

  test('Lambda creates SphereGeometry', () => {
    const mesh = factory.create(makeResource({ id: 'func-1', type: 'lambda_function' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  test('Security Group creates SphereGeometry with wireframe', () => {
    const mesh = factory.create(makeResource({ id: 'sg-1', type: 'security_group' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.wireframe).toBe(true);
  });

  test('IAM Role creates BoxGeometry (shield placeholder)', () => {
    const mesh = factory.create(makeResource({ id: 'role-1', type: 'iam_role' })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  test('unknown type falls back to BoxGeometry(2,2,2)', () => {
    const mesh = factory.create(makeResource({ id: 'x-1', type: 'unknown' as any })) as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).toBe(2);
    expect(params.height).toBe(2);
    expect(params.depth).toBe(2);
  });

  test('stores resource data in userData', () => {
    const resource = makeResource({ id: 'vpc-1', type: 'vpc', name: 'main' });
    const mesh = factory.create(resource);
    expect(mesh.userData.id).toBe('vpc-1');
    expect(mesh.userData.type).toBe('vpc');
    expect(mesh.userData.resource).toBe(resource);
  });

  test('applies theme colors', () => {
    const resource: Resource = {
      id: 'vpc-1',
      type: 'vpc',
      name: 'main',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource) as THREE.Mesh;
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
    const mesh = factory.create(resource) as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.emissive).toBeDefined();
    expect(material.emissive.getHexString()).toBe('00ff00');
    expect(material.emissiveIntensity).toBe(0.5);
  });

  test('applies wireframe for security group', () => {
    const resource: Resource = {
      id: 'sg-1',
      type: 'security_group',
      name: 'web-sg',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource) as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.wireframe).toBe(true);
    expect(material.emissive.getHexString()).toBe('ff8c00');
  });
});
