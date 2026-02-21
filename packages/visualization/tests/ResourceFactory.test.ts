import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import { ResourceFactory } from '../src/resources/ResourceFactory';
import { defaultTheme } from '../src/themes/default';
import type { Resource } from '../src/types';

describe('ResourceFactory', () => {
  const factory = new ResourceFactory(defaultTheme);

  test('creates VPC as cube', () => {
    const resource: Resource = {
      id: 'vpc-1',
      type: 'vpc',
      name: 'main',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource);
    expect(mesh).toBeDefined();
    expect(mesh.userData.id).toBe('vpc-1');
  });

  test('creates Instance as cube', () => {
    const resource: Resource = {
      id: 'i-1',
      type: 'instance',
      name: 'web',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource);
    expect(mesh).toBeDefined();
    expect(mesh.userData.type).toBe('instance');
  });

  test('creates S3 Bucket as cylinder', () => {
    const resource: Resource = {
      id: 'bucket-1',
      type: 's3_bucket',
      name: 'data',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource);
    expect(mesh).toBeDefined();
  });

  test('creates Lambda as sphere', () => {
    const resource: Resource = {
      id: 'func-1',
      type: 'lambda_function',
      name: 'handler',
      attributes: {},
      state: 'applied',
    };
    const mesh = factory.create(resource);
    expect(mesh).toBeDefined();
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
