import { describe, test, expect } from 'bun:test';
import { parseHcl } from '../state/parseHcl';
import { manhattanRoute } from './manhattanRoute';

describe('parseHcl → manhattanRoute integration', () => {
  const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.main.id
  ami       = "ami-12345678"
}
`;

  test('parseHcl extracts connections from references', () => {
    const state = parseHcl(hcl);
    expect(state.connections.length).toBe(2);
    expect(state.connections).toContainEqual({
      from: 'aws_subnet.main',
      to: 'aws_vpc.main',
      type: 'reference',
    });
    expect(state.connections).toContainEqual({
      from: 'aws_instance.web',
      to: 'aws_subnet.main',
      type: 'reference',
    });
  });

  test('connections produce valid Manhattan routes', () => {
    const state = parseHcl(hcl);
    const positions = new Map<string, [number, number, number]>();
    positions.set('aws_vpc.main', [-1.25, 0, -1.25]);
    positions.set('aws_subnet.main', [1.25, 0, -1.25]);
    positions.set('aws_instance.web', [-1.25, 0, 1.25]);

    for (const [i, conn] of state.connections.entries()) {
      const from = positions.get(conn.from)!;
      const to = positions.get(conn.to)!;
      const route = manhattanRoute(from, to, i);
      expect(route.length).toBeGreaterThanOrEqual(2);
      expect(route[0]).toEqual(from);
      expect(route[route.length - 1]).toEqual(to);
    }
  });

  test('missing resource in positions map produces empty route', () => {
    const route = manhattanRoute([0, 0, 0], [0, 0, 0], 0);
    expect(route).toEqual([]);
  });
});
