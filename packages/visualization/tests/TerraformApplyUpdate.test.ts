import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Visualization } from '../src/Visualization';
import { StateSync } from '../src/state/StateSync';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('VIS-017: Update from terraform apply', () => {
  let container: HTMLElement;
  let vis: Visualization;
  let stateSync: StateSync;

  // Simulated terraform.tfstate after `terraform apply` creates a VPC + subnet
  const tfstate = {
    version: 4,
    terraform_version: '1.5.7',
    resources: [
      {
        type: 'aws_vpc',
        name: 'main',
        address: 'aws_vpc.main',
        instances: [
          {
            attributes: {
              id: 'vpc-abc123',
              cidr_block: '10.0.0.0/16',
              arn: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-abc123',
            },
          },
        ],
      },
      {
        type: 'aws_subnet',
        name: 'web',
        address: 'aws_subnet.web',
        instances: [
          {
            attributes: {
              id: 'subnet-def456',
              vpc_id: 'vpc-abc123',
              cidr_block: '10.0.1.0/24',
            },
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
    vis = new Visualization(container);
    stateSync = new StateSync();
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

  test('terraform apply triggers update — resources appear in scene', () => {
    const state = stateSync.parseState(tfstate);
    vis.update(state);

    expect(findMesh('aws_vpc.main')).toBeDefined();
    expect(findMesh('aws_subnet.web')).toBeDefined();
  });

  test('resources animate in (start at scale 0)', () => {
    const state = stateSync.parseState(tfstate);
    vis.update(state);

    const vpc = findMesh('aws_vpc.main')!;
    // Immediately after update, create animation should be active
    // Scale should be 0 (or very small) since no animation frames have run
    expect(vpc.scale.x).toBeCloseTo(0, 1);
  });

  test('state correctly parsed — correct resource types', () => {
    const state = stateSync.parseState(tfstate);

    expect(state.resources.length).toBe(2);
    expect(state.resources[0].type).toBe('vpc');
    expect(state.resources[1].type).toBe('subnet');
  });

  test('state correctly parsed — connections extracted', () => {
    const state = stateSync.parseState(tfstate);

    expect(state.connections.length).toBe(1);
    expect(state.connections[0].from).toBe('aws_subnet.web');
    expect(state.connections[0].to).toBe('aws_vpc.main');
  });

  test('state correctly parsed — parent relationship established', () => {
    const state = stateSync.parseState(tfstate);

    const subnet = state.resources.find(r => r.id === 'aws_subnet.web');
    expect(subnet?.parentId).toBe('aws_vpc.main');
  });

  test('subsequent apply adds new resources with animations', () => {
    // First apply: just VPC
    const firstState = stateSync.parseState({
      version: 4,
      resources: [tfstate.resources[0]],
    });
    vis.update(firstState);

    // Complete first animation
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    expect(findMesh('aws_vpc.main')).toBeDefined();
    expect(findMesh('aws_subnet.web')).toBeUndefined();

    // Second apply: VPC + subnet
    const secondState = stateSync.parseState(tfstate);
    vis.update(secondState);

    // Subnet should now exist and start animating
    const subnet = findMesh('aws_subnet.web');
    expect(subnet).toBeDefined();
    expect(subnet!.scale.x).toBeCloseTo(0, 1); // starts at scale 0
  });
});
