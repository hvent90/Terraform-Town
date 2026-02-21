import { describe, test, expect } from 'vitest';
import { defaultTheme } from '../src/themes/default';

describe('Default Theme', () => {
  test('has correct name', () => {
    expect(defaultTheme.name).toBe('tron');
  });

  test('has dark background', () => {
    expect(defaultTheme.background).toBe('#0a0a0a');
  });

  test('has all resource colors defined', () => {
    const resourceTypes = ['vpc', 'subnet', 'security_group', 'instance', 's3_bucket', 'iam_role', 'lambda_function'];
    for (const type of resourceTypes) {
      expect(defaultTheme.resources[type as keyof typeof defaultTheme.resources]).toBeDefined();
    }
  });

  test('has animation durations', () => {
    expect(defaultTheme.animations.createDuration).toBe(300);
    expect(defaultTheme.animations.destroyDuration).toBe(300);
  });

  test('VPC has low opacity (container)', () => {
    expect(defaultTheme.resources.vpc.opacity).toBeLessThan(0.5);
  });
});
