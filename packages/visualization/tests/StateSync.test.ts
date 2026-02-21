import { describe, test, expect } from 'vitest';
import { StateSync } from '../src/state/StateSync';

describe('StateSync', () => {
  const sync = new StateSync();

  test('parses empty state', () => {
    const result = sync.parseState({});
    expect(result.resources).toEqual([]);
    expect(result.connections).toEqual([]);
  });

  test('parses single VPC resource', () => {
    const tfstate = {
      resources: [{
        type: 'aws_vpc',
        name: 'main',
        address: 'aws_vpc.main',
        instances: [{
          attributes: {
            cidr_block: '10.0.0.0/16',
            id: 'vpc-abc123',
          }
        }]
      }]
    };
    const result = sync.parseState(tfstate);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].type).toBe('vpc');
    expect(result.resources[0].name).toBe('main');
  });

  test('normalizes AWS type names', () => {
    const tfstate = {
      resources: [
        { type: 'aws_vpc', name: 'vpc1', address: 'vpc1', instances: [{ attributes: {} }] },
        { type: 'aws_subnet', name: 'subnet1', address: 'subnet1', instances: [{ attributes: {} }] },
        { type: 'aws_instance', name: 'web', address: 'web', instances: [{ attributes: {} }] },
        { type: 'aws_s3_bucket', name: 'bucket', address: 'bucket', instances: [{ attributes: {} }] },
      ]
    };
    const result = sync.parseState(tfstate);
    expect(result.resources.map(r => r.type)).toEqual(['vpc', 'subnet', 'instance', 's3_bucket']);
  });
});
