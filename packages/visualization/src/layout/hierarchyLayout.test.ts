import { describe, test, expect } from 'bun:test';
import { hierarchyLayout } from './hierarchyLayout';
import type { Resource } from '../types';

const r = (id: string, type: string, parentId?: string): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied', parentId,
});

describe('hierarchyLayout', () => {
  test('children positioned near their parent', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_subnet.a', 'subnet', 'aws_vpc.main'),
      r('aws_subnet.b', 'subnet', 'aws_vpc.main'),
    ];
    const pos = hierarchyLayout(resources, []);
    const vpc = pos.get('aws_vpc.main')!;
    const subA = pos.get('aws_subnet.a')!;
    const subB = pos.get('aws_subnet.b')!;

    // Children should be closer to parent than to arbitrary far positions
    const distA = Math.hypot(vpc[0] - subA[0], vpc[2] - subA[2]);
    const distB = Math.hypot(vpc[0] - subB[0], vpc[2] - subB[2]);
    expect(distA).toBeLessThan(8);
    expect(distB).toBeLessThan(8);
  });

  test('resources without parents are placed as top-level', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_s3_bucket.data', 's3_bucket'),
    ];
    const pos = hierarchyLayout(resources, []);
    expect(pos.size).toBe(2);
    expect(pos.has('aws_vpc.main')).toBe(true);
    expect(pos.has('aws_s3_bucket.data')).toBe(true);
  });

  test('two-level nesting: vpc > subnet > instance', () => {
    const resources = [
      r('aws_vpc.main', 'vpc'),
      r('aws_subnet.web', 'subnet', 'aws_vpc.main'),
      r('aws_instance.app', 'instance', 'aws_subnet.web'),
    ];
    const pos = hierarchyLayout(resources, []);
    expect(pos.size).toBe(3);
    // instance should be near subnet, subnet near vpc
    const vpc = pos.get('aws_vpc.main')!;
    const subnet = pos.get('aws_subnet.web')!;
    const instance = pos.get('aws_instance.app')!;
    const subnetToVpc = Math.hypot(vpc[0] - subnet[0], vpc[2] - subnet[2]);
    const instanceToSubnet = Math.hypot(subnet[0] - instance[0], subnet[2] - instance[2]);
    expect(subnetToVpc).toBeLessThan(8);
    expect(instanceToSubnet).toBeLessThan(8);
  });
});
