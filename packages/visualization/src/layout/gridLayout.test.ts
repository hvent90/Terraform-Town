import { describe, test, expect } from 'bun:test';
import { gridLayout } from './gridLayout';
import type { Resource, Connection } from '../types';

const r = (id: string, type: string = 'instance'): Resource => ({
  id, type: type as any, name: id.split('.')[1], attributes: {}, state: 'applied',
});

describe('gridLayout', () => {
  test('single resource at origin', () => {
    const pos = gridLayout([r('a.x')], []);
    expect(pos.get('a.x')).toEqual([0, 0, 0]);
  });

  test('four resources in 2x2 grid', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c'), r('a.d')];
    const pos = gridLayout(resources, []);
    expect(pos.size).toBe(4);
    // cols = ceil(sqrt(4)) = 2, spacing = 2.5
    // offsetX = (1 * 2.5) / 2 = 1.25, offsetZ = 1.25
    expect(pos.get('a.a')).toEqual([-1.25, 0, -1.25]);
    expect(pos.get('a.b')).toEqual([1.25, 0, -1.25]);
    expect(pos.get('a.c')).toEqual([-1.25, 0, 1.25]);
    expect(pos.get('a.d')).toEqual([1.25, 0, 1.25]);
  });

  test('respects resource.position override', () => {
    const resources = [{ ...r('a.x'), position: { x: 5, y: 1, z: 3 } }];
    const pos = gridLayout(resources, []);
    expect(pos.get('a.x')).toEqual([5, 1, 3]);
  });
});
