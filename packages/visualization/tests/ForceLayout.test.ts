import { describe, test, expect } from 'vitest';
import { ForceLayout } from '../src/layout/ForceLayout';
import type { Resource, Connection } from '../src/types';

function makeResource(id: string, type: Resource['type'], parentId?: string): Resource {
  return { id, type, name: id, attributes: {}, state: 'applied', parentId };
}

describe('ForceLayout', () => {
  const layout = new ForceLayout();

  test('returns positions for all resources', () => {
    const resources: Resource[] = [
      makeResource('vpc-1', 'vpc'),
      makeResource('subnet-1', 'subnet'),
      makeResource('instance-1', 'instance'),
    ];
    const positions = layout.calculate(resources);
    expect(positions.size).toBe(3);
    expect(positions.get('vpc-1')).toBeDefined();
    expect(positions.get('subnet-1')).toBeDefined();
    expect(positions.get('instance-1')).toBeDefined();
  });

  test('each position has x, y, z coordinates', () => {
    const resources: Resource[] = [makeResource('vpc-1', 'vpc')];
    const positions = layout.calculate(resources);
    const pos = positions.get('vpc-1')!;
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
    expect(typeof pos.z).toBe('number');
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.z)).toBe(true);
  });

  test('no two resources at same position', () => {
    const resources: Resource[] = [
      makeResource('r1', 'vpc'),
      makeResource('r2', 'subnet'),
      makeResource('r3', 'instance'),
      makeResource('r4', 's3_bucket'),
      makeResource('r5', 'lambda_function'),
    ];
    const positions = layout.calculate(resources);
    const posArray = Array.from(positions.values());

    for (let i = 0; i < posArray.length; i++) {
      for (let j = i + 1; j < posArray.length; j++) {
        const dist = Math.sqrt(
          (posArray[i].x - posArray[j].x) ** 2 +
          (posArray[i].z - posArray[j].z) ** 2,
        );
        expect(dist).toBeGreaterThan(1);
      }
    }
  });

  test('parent-child proximity maintained', () => {
    const resources: Resource[] = [
      makeResource('vpc-1', 'vpc'),
      makeResource('subnet-1', 'subnet', 'vpc-1'),
      makeResource('instance-1', 'instance', 'subnet-1'),
      makeResource('unrelated', 's3_bucket'),
    ];
    const connections: Connection[] = [
      { from: 'subnet-1', to: 'vpc-1', type: 'reference' },
      { from: 'instance-1', to: 'subnet-1', type: 'reference' },
    ];
    const positions = layout.calculate(resources, connections);

    const vpcPos = positions.get('vpc-1')!;
    const subnetPos = positions.get('subnet-1')!;
    const instancePos = positions.get('instance-1')!;
    const s3Pos = positions.get('unrelated')!;

    const distSubnetToVpc = Math.sqrt(
      (subnetPos.x - vpcPos.x) ** 2 + (subnetPos.z - vpcPos.z) ** 2,
    );
    const distS3ToVpc = Math.sqrt(
      (s3Pos.x - vpcPos.x) ** 2 + (s3Pos.z - vpcPos.z) ** 2,
    );

    // Child should be closer to parent than unrelated resource
    expect(distSubnetToVpc).toBeLessThan(distS3ToVpc);
  });

  test('handles empty resource list', () => {
    const positions = layout.calculate([]);
    expect(positions.size).toBe(0);
  });

  test('handles single resource', () => {
    const resources: Resource[] = [makeResource('vpc-1', 'vpc')];
    const positions = layout.calculate(resources);
    expect(positions.size).toBe(1);
  });

  test('works without connections parameter', () => {
    const resources: Resource[] = [
      makeResource('r1', 'vpc'),
      makeResource('r2', 'subnet'),
    ];
    const positions = layout.calculate(resources);
    expect(positions.size).toBe(2);
  });

  test('positions many resources without overlap', () => {
    const resources: Resource[] = Array.from({ length: 20 }, (_, i) =>
      makeResource(`r-${i}`, 'instance'),
    );
    const positions = layout.calculate(resources);
    expect(positions.size).toBe(20);

    const posArray = Array.from(positions.values());
    for (let i = 0; i < posArray.length; i++) {
      for (let j = i + 1; j < posArray.length; j++) {
        const dist = Math.sqrt(
          (posArray[i].x - posArray[j].x) ** 2 +
          (posArray[i].z - posArray[j].z) ** 2,
        );
        expect(dist).toBeGreaterThan(1);
      }
    }
  });
});
