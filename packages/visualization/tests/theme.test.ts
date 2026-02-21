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

describe('VIS-003: TRON theme matches spec', () => {
  test('resource colors match spec table', () => {
    const spec: Record<string, string> = {
      vpc: '#00FFFF',          // Cyan
      subnet: '#4169E1',       // Blue
      security_group: '#FF8C00', // Orange
      instance: '#00FF00',     // Green
      s3_bucket: '#9B59B6',    // Purple
      iam_role: '#FFD700',     // Gold
      lambda_function: '#FF00FF', // Magenta
    };
    for (const [type, color] of Object.entries(spec)) {
      const config = defaultTheme.resources[type as keyof typeof defaultTheme.resources];
      expect(config.color, `${type} color`).toBe(color);
    }
  });

  test('all resources have emissive properties', () => {
    for (const [type, config] of Object.entries(defaultTheme.resources)) {
      expect(config.emissive, `${type} emissive`).toBeDefined();
      expect(config.emissiveIntensity, `${type} emissiveIntensity`).toBeGreaterThan(0);
    }
  });

  test('security group is wireframe', () => {
    expect(defaultTheme.resources.security_group.wireframe).toBe(true);
  });

  test('state configs match visual states spec', () => {
    expect(defaultTheme.states.planned.opacity).toBe(0.5);
    expect(defaultTheme.states.planned.pulse).toBe(true);
    expect(defaultTheme.states.applied.opacity).toBe(1.0);
    expect(defaultTheme.states.modified.glow).toBe('#FFFF00');
    expect(defaultTheme.states.destroyed.color).toBe('#FF0000');
  });
});
