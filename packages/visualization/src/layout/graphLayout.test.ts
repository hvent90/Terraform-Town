import { describe, test, expect } from 'bun:test';
import { graphLayout } from './graphLayout';
import type { Resource, Connection } from '../types';

const r = (id: string): Resource => ({
  id, type: 'instance', name: id.split('.')[1], attributes: {}, state: 'applied',
});

const conn = (from: string, to: string): Connection => ({
  from, to, type: 'reference',
});

describe('graphLayout', () => {
  test('connected nodes end up closer than unconnected nodes', () => {
    const resources = [r('a.x'), r('a.y'), r('a.z')];
    const connections = [conn('a.x', 'a.y')]; // x-y connected, z isolated
    const pos = graphLayout(resources, connections);

    const xy = Math.hypot(
      pos.get('a.x')![0] - pos.get('a.y')![0],
      pos.get('a.x')![2] - pos.get('a.y')![2],
    );
    const xz = Math.hypot(
      pos.get('a.x')![0] - pos.get('a.z')![0],
      pos.get('a.x')![2] - pos.get('a.z')![2],
    );
    expect(xy).toBeLessThan(xz);
  });

  test('all resources get positions', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c')];
    const pos = graphLayout(resources, []);
    expect(pos.size).toBe(3);
  });

  test('single resource at origin', () => {
    const pos = graphLayout([r('a.x')], []);
    expect(pos.get('a.x')).toEqual([0, 0, 0]);
  });

  test('no NaN or Infinity in positions', () => {
    const resources = [r('a.a'), r('a.b'), r('a.c'), r('a.d')];
    const connections = [conn('a.a', 'a.b'), conn('a.b', 'a.c'), conn('a.c', 'a.d')];
    const pos = graphLayout(resources, connections);
    for (const [x, y, z] of pos.values()) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
    }
  });
});
