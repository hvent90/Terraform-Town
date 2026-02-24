import { describe, test, expect } from 'bun:test';
import { typeClusterLayout } from './typeClusterLayout';
import type { Resource } from '../types';

const r = (id: string, type: string): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied',
});

describe('typeClusterLayout', () => {
  test('groups resources by type into separate spatial clusters', () => {
    const resources = [
      r('aws_vpc.a', 'vpc'),
      r('aws_instance.a', 'instance'),
      r('aws_vpc.b', 'vpc'),
      r('aws_instance.b', 'instance'),
    ];
    const pos = typeClusterLayout(resources, []);
    // VPCs should be near each other, instances near each other
    const vpcA = pos.get('aws_vpc.a')!;
    const vpcB = pos.get('aws_vpc.b')!;
    const instA = pos.get('aws_instance.a')!;
    const instB = pos.get('aws_instance.b')!;

    // Within-group distance should be less than between-group distance
    const vpcDist = Math.hypot(vpcA[0] - vpcB[0], vpcA[2] - vpcB[2]);
    const crossDist = Math.hypot(vpcA[0] - instA[0], vpcA[2] - instA[2]);
    expect(vpcDist).toBeLessThan(crossDist);
  });

  test('single type behaves like flat grid', () => {
    const resources = [r('a.x', 'instance'), r('a.y', 'instance')];
    const pos = typeClusterLayout(resources, []);
    expect(pos.size).toBe(2);
  });

  test('all resources get positions', () => {
    const resources = [
      r('a.a', 'vpc'), r('a.b', 'subnet'), r('a.c', 'instance'),
      r('a.d', 'vpc'), r('a.e', 's3_bucket'),
    ];
    const pos = typeClusterLayout(resources, []);
    expect(pos.size).toBe(5);
    for (const r of resources) {
      expect(pos.has(r.id)).toBe(true);
    }
  });
});
