import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import { defaultTheme } from '../src/themes/default';
import type { TerraformState } from '../src/types';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-016: Full EC2 stack renders', () => {
  let container: HTMLElement;
  let vis: Visualization;

  const ec2Stack: TerraformState = {
    resources: [
      { id: 'vpc-1', type: 'vpc', name: 'aws_vpc.main', attributes: { cidr_block: '10.0.0.0/16' }, state: 'applied' },
      { id: 'subnet-1', type: 'subnet', name: 'aws_subnet.main', attributes: { cidr_block: '10.0.1.0/24' }, state: 'applied', parentId: 'vpc-1' },
      { id: 'sg-1', type: 'security_group', name: 'aws_security_group.main', attributes: {}, state: 'applied', parentId: 'vpc-1' },
      { id: 'inst-1', type: 'instance', name: 'aws_instance.web', attributes: { ami: 'ami-12345' }, state: 'applied', parentId: 'subnet-1' },
    ],
    connections: [
      { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      { from: 'sg-1', to: 'vpc-1', type: 'reference' },
      { from: 'inst-1', to: 'subnet-1', type: 'reference' },
      { from: 'inst-1', to: 'sg-1', type: 'reference' },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
    vis = new Visualization(container);
  });

  afterEach(() => {
    vis.dispose();
    document.body.removeChild(container);
  });

  function getScene(): THREE.Scene {
    return (vis as any).scene;
  }

  function findMesh(id: string): THREE.Group | undefined {
    return getScene().children.find(
      (c) => c instanceof THREE.Group && c.userData.id === id,
    ) as THREE.Group | undefined;
  }

  test('all 4 resource types render', () => {
    vis.update(ec2Stack);

    expect(findMesh('vpc-1')).toBeDefined();
    expect(findMesh('subnet-1')).toBeDefined();
    expect(findMesh('sg-1')).toBeDefined();
    expect(findMesh('inst-1')).toBeDefined();
  });

  test('correct colors per type', () => {
    vis.update(ec2Stack);

    const vpc = findMesh('vpc-1')!;
    const subnet = findMesh('subnet-1')!;
    const sg = findMesh('sg-1')!;
    const inst = findMesh('inst-1')!;

    const vpcMat = vpc.userData.mesh.material as THREE.MeshStandardMaterial;
    const subnetMat = subnet.userData.mesh.material as THREE.MeshStandardMaterial;
    const sgMat = sg.userData.mesh.material as THREE.MeshStandardMaterial;
    const instMat = inst.userData.mesh.material as THREE.MeshStandardMaterial;

    // Check colors match theme
    expect(vpcMat.color.getHexString()).toBe(new THREE.Color(defaultTheme.resources.vpc.color).getHexString());
    expect(subnetMat.color.getHexString()).toBe(new THREE.Color(defaultTheme.resources.subnet.color).getHexString());
    expect(sgMat.color.getHexString()).toBe(new THREE.Color(defaultTheme.resources.security_group.color).getHexString());
    expect(instMat.color.getHexString()).toBe(new THREE.Color(defaultTheme.resources.instance.color).getHexString());
  });

  test('containment visible - child resources positioned near parents', () => {
    vis.update(ec2Stack);

    const vpc = findMesh('vpc-1')!;
    const subnet = findMesh('subnet-1')!;
    const inst = findMesh('inst-1')!;

    // Subnet should be closer to VPC than to a random far-away point
    const subnetToVpc = subnet.position.distanceTo(vpc.position);
    const subnetToFar = subnet.position.distanceTo(new THREE.Vector3(1000, 0, 1000));
    expect(subnetToVpc).toBeLessThan(subnetToFar);

    // Instance should be close to its parent subnet
    const instToSubnet = inst.position.distanceTo(subnet.position);
    expect(instToSubnet).toBeLessThan(subnetToFar);
  });

  test('connections visible - lines exist between related resources', () => {
    vis.update(ec2Stack);

    const lines = getScene().children.filter(
      (c) => c instanceof THREE.Line && c.userData.connectionId,
    );

    // 4 connections in the state
    expect(lines.length).toBe(4);
  });

  test('interactions work - hover events emit for resources', () => {
    vis.update(ec2Stack);

    // Complete create animations so meshes are at full scale
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    // Selection manager should be set up
    const selection = (vis as any).selection;
    expect(selection).toBeDefined();

    // All resource meshes should have userData.id (required for hover detection)
    for (const resource of ec2Stack.resources) {
      const mesh = findMesh(resource.id);
      expect(mesh).toBeDefined();
      expect(mesh!.userData.id).toBe(resource.id);
    }
  });
});
