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

  test('extracts subnet→vpc connection from vpc_id attribute', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_vpc', name: 'main', address: 'aws_vpc.main',
          instances: [{ attributes: { id: 'vpc-abc123', cidr_block: '10.0.0.0/16' } }]
        },
        {
          type: 'aws_subnet', name: 'web', address: 'aws_subnet.web',
          instances: [{ attributes: { id: 'subnet-def456', vpc_id: 'vpc-abc123' } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0]).toEqual({
      from: 'aws_subnet.web',
      to: 'aws_vpc.main',
      type: 'reference',
      label: 'vpc_id',
    });
  });

  test('extracts instance→subnet connection from subnet_id attribute', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_subnet', name: 'web', address: 'aws_subnet.web',
          instances: [{ attributes: { id: 'subnet-def456' } }]
        },
        {
          type: 'aws_instance', name: 'app', address: 'aws_instance.app',
          instances: [{ attributes: { id: 'i-789', subnet_id: 'subnet-def456' } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0]).toEqual({
      from: 'aws_instance.app',
      to: 'aws_subnet.web',
      type: 'reference',
      label: 'subnet_id',
    });
  });

  test('extracts security group connections from vpc_security_group_ids', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_security_group', name: 'sg1', address: 'aws_security_group.sg1',
          instances: [{ attributes: { id: 'sg-aaa' } }]
        },
        {
          type: 'aws_instance', name: 'app', address: 'aws_instance.app',
          instances: [{ attributes: { id: 'i-789', vpc_security_group_ids: ['sg-aaa'] } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0]).toEqual({
      from: 'aws_instance.app',
      to: 'aws_security_group.sg1',
      type: 'reference',
      label: 'vpc_security_group_ids',
    });
  });

  test('sets parentId for subnet inside vpc', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_vpc', name: 'main', address: 'aws_vpc.main',
          instances: [{ attributes: { id: 'vpc-abc123' } }]
        },
        {
          type: 'aws_subnet', name: 'web', address: 'aws_subnet.web',
          instances: [{ attributes: { id: 'subnet-def456', vpc_id: 'vpc-abc123' } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    const subnet = result.resources.find(r => r.type === 'subnet');
    expect(subnet?.parentId).toBe('aws_vpc.main');
  });

  test('sets parentId for instance inside subnet', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_subnet', name: 'web', address: 'aws_subnet.web',
          instances: [{ attributes: { id: 'subnet-def456' } }]
        },
        {
          type: 'aws_instance', name: 'app', address: 'aws_instance.app',
          instances: [{ attributes: { id: 'i-789', subnet_id: 'subnet-def456' } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    const instance = result.resources.find(r => r.type === 'instance');
    expect(instance?.parentId).toBe('aws_subnet.web');
  });

  test('handles full EC2 stack with multiple connections', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_vpc', name: 'main', address: 'aws_vpc.main',
          instances: [{ attributes: { id: 'vpc-001', cidr_block: '10.0.0.0/16' } }]
        },
        {
          type: 'aws_subnet', name: 'web', address: 'aws_subnet.web',
          instances: [{ attributes: { id: 'subnet-001', vpc_id: 'vpc-001' } }]
        },
        {
          type: 'aws_security_group', name: 'sg', address: 'aws_security_group.sg',
          instances: [{ attributes: { id: 'sg-001', vpc_id: 'vpc-001' } }]
        },
        {
          type: 'aws_instance', name: 'app', address: 'aws_instance.app',
          instances: [{ attributes: { id: 'i-001', subnet_id: 'subnet-001', vpc_security_group_ids: ['sg-001'] } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    // 4 resources
    expect(result.resources).toHaveLength(4);
    // Connections: subnet→vpc, sg→vpc, instance→subnet, instance→sg = 4
    expect(result.connections).toHaveLength(4);
    // Verify parent chain
    const subnet = result.resources.find(r => r.type === 'subnet');
    const sg = result.resources.find(r => r.type === 'security_group');
    const instance = result.resources.find(r => r.type === 'instance');
    expect(subnet?.parentId).toBe('aws_vpc.main');
    expect(sg?.parentId).toBe('aws_vpc.main');
    expect(instance?.parentId).toBe('aws_subnet.web');
  });

  test('handles unknown attribute references gracefully', () => {
    const tfstate = {
      resources: [
        {
          type: 'aws_instance', name: 'app', address: 'aws_instance.app',
          instances: [{ attributes: { id: 'i-789', subnet_id: 'subnet-nonexistent' } }]
        },
      ]
    };
    const result = sync.parseState(tfstate);
    // No connection because the referenced resource doesn't exist in state
    expect(result.connections).toHaveLength(0);
    expect(result.resources[0].parentId).toBeUndefined();
  });
});
