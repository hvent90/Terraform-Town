import { describe, test, expect } from 'bun:test';
import { parseHcl } from './parseHcl';

describe('parseHcl parentId detection', () => {
  test('subnet gets parentId from vpc_id reference', () => {
    const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}
`;
    const state = parseHcl(hcl);
    const subnet = state.resources.find(r => r.id === 'aws_subnet.web')!;
    expect(subnet.parentId).toBe('aws_vpc.main');
  });

  test('instance gets parentId from subnet_id reference', () => {
    const hcl = `
resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "app" {
  subnet_id = aws_subnet.web.id
  ami       = "ami-12345678"
}
`;
    const state = parseHcl(hcl);
    const instance = state.resources.find(r => r.id === 'aws_instance.app')!;
    expect(instance.parentId).toBe('aws_subnet.web');
  });

  test('subnet_id takes priority over vpc_id for parentId', () => {
    const hcl = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "app" {
  subnet_id = aws_subnet.web.id
  vpc_id    = aws_vpc.main.id
  ami       = "ami-12345678"
}
`;
    const state = parseHcl(hcl);
    const instance = state.resources.find(r => r.id === 'aws_instance.app')!;
    expect(instance.parentId).toBe('aws_subnet.web');
  });

  test('resource without container references has no parentId', () => {
    const hcl = `
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
}
`;
    const state = parseHcl(hcl);
    const bucket = state.resources.find(r => r.id === 'aws_s3_bucket.data')!;
    expect(bucket.parentId).toBeUndefined();
  });
});
