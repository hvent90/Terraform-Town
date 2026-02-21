import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Visualization } from '../../visualization/src/Visualization';
import { applyToVisualization } from '../src/applySync';

const hasDOM = typeof document !== 'undefined';

describe.skipIf(!hasDOM)('ED-011: Editor content syncs to visualization', () => {
  let container: HTMLElement;
  let vis: Visualization;

  const sampleHcl = `resource "aws_s3_bucket" "example" {
  bucket = "my-terraform-bucket"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}`;

  const hclWithRefs = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}`;

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

  function getResources(): Map<string, any> {
    return (vis as any).resources;
  }

  function getConnections(): Map<string, any> {
    return (vis as any).connections;
  }

  function getAnimator(): any {
    return (vis as any).animator;
  }

  test('Apply sends editor content and visualization updates with new state', () => {
    applyToVisualization(sampleHcl, vis);

    const resources = getResources();
    expect(resources.has('aws_s3_bucket.example')).toBe(true);
    expect(resources.has('aws_vpc.main')).toBe(true);
  });

  test('resources animate in after apply (start at scale 0)', () => {
    applyToVisualization(sampleHcl, vis);

    const bucket = getResources().get('aws_s3_bucket.example');
    expect(bucket).toBeDefined();
    expect(bucket.scale.x).toBeCloseTo(0, 1);
  });

  test('animation completes after frames advance', () => {
    applyToVisualization(sampleHcl, vis);

    const animator = getAnimator();
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const bucket = getResources().get('aws_s3_bucket.example');
    expect(bucket.scale.x).toBeCloseTo(1, 0);
  });

  test('connections visible after apply with references', () => {
    applyToVisualization(hclWithRefs, vis);

    const connections = getConnections();
    const connKey = 'aws_subnet.web->aws_vpc.main';
    expect(connections.has(connKey)).toBe(true);
  });

  test('re-apply updates visualization with new content', () => {
    applyToVisualization(`resource "aws_s3_bucket" "first" {
  bucket = "first"
}`, vis);

    expect(getResources().has('aws_s3_bucket.first')).toBe(true);
    expect(getResources().has('aws_vpc.main')).toBe(false);

    applyToVisualization(sampleHcl, vis);

    expect(getResources().has('aws_s3_bucket.example')).toBe(true);
    expect(getResources().has('aws_vpc.main')).toBe(true);
  });

  test('returns the parsed state', () => {
    const state = applyToVisualization(sampleHcl, vis);

    expect(state.resources).toHaveLength(2);
    expect(state.connections).toHaveLength(0);
  });

  test('empty editor content produces empty state', () => {
    const state = applyToVisualization('', vis);
    expect(state.resources).toHaveLength(0);
  });
});
