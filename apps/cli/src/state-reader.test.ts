import { describe, test, expect } from 'bun:test';
import { readStateFile } from './state-reader';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('state-reader', () => {
  test('reads and parses a terraform state file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tftown-'));
    const statePath = join(dir, 'terraform.tfstate');
    writeFileSync(statePath, JSON.stringify({
      version: 4,
      resources: [{
        mode: 'managed',
        type: 'aws_vpc',
        name: 'main',
        provider: 'provider["registry.terraform.io/hashicorp/aws"]',
        instances: [{
          attributes: {
            id: 'vpc-123',
            cidr_block: '10.0.0.0/16',
          },
        }],
      }],
    }));

    const state = readStateFile(statePath);
    expect(state.resources).toHaveLength(1);
    expect(state.resources[0].id).toBe('aws_vpc.main');
    expect(state.resources[0].type).toBe('vpc');
    expect(state.resources[0].state).toBe('applied');

    rmSync(dir, { recursive: true });
  });

  test('returns empty state for missing file', () => {
    const state = readStateFile('/nonexistent/terraform.tfstate');
    expect(state.resources).toHaveLength(0);
    expect(state.connections).toHaveLength(0);
  });

  test('returns empty state for empty state file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tftown-'));
    const statePath = join(dir, 'terraform.tfstate');
    writeFileSync(statePath, JSON.stringify({ version: 4, resources: [] }));

    const state = readStateFile(statePath);
    expect(state.resources).toHaveLength(0);

    rmSync(dir, { recursive: true });
  });
});
