import { describe, test, expect } from 'vitest';
import { ForceLayout } from '../src/layout/ForceLayout';
import type { Resource } from '../src/types';

describe('ForceLayout', () => {
  const layout = new ForceLayout();

  test('positions single resource', () => {
    const resources: Resource[] = [{
      id: 'vpc-1',
      type: 'vpc',
      name: 'main',
      attributes: {},
      state: 'applied',
    }];
    const positions = layout.calculate(resources);
    expect(positions.size).toBe(1);
    expect(positions.get('vpc-1')).toBeDefined();
  });

  test('positions multiple resources without overlap', () => {
    const resources: Resource[] = [
      { id: 'r1', type: 'vpc', name: 'a', attributes: {}, state: 'applied' },
      { id: 'r2', type: 'vpc', name: 'b', attributes: {}, state: 'applied' },
      { id: 'r3', type: 'vpc', name: 'c', attributes: {}, state: 'applied' },
    ];
    const positions = layout.calculate(resources);
    const posArray = Array.from(positions.values());
    
    // Check no overlapping positions
    for (let i = 0; i < posArray.length; i++) {
      for (let j = i + 1; j < posArray.length; j++) {
        const dist = Math.sqrt(
          Math.pow(posArray[i].x - posArray[j].x, 2) +
          Math.pow(posArray[i].z - posArray[j].z, 2)
        );
        expect(dist).toBeGreaterThan(0);
      }
    }
  });
});
