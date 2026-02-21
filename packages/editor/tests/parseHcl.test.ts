import { describe, test, expect } from 'vitest';
import { parseHclToState } from '../src/parseHcl';

describe('parseHclToState', () => {
  test('extracts single resource block', () => {
    const hcl = `resource "aws_s3_bucket" "example" {
  bucket = "my-bucket"
}`;
    const state = parseHclToState(hcl);
    expect(state.resources).toHaveLength(1);
    expect(state.resources[0].id).toBe('aws_s3_bucket.example');
    expect(state.resources[0].type).toBe('s3_bucket');
    expect(state.resources[0].name).toBe('example');
    expect(state.resources[0].state).toBe('applied');
  });

  test('extracts multiple resource blocks', () => {
    const hcl = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_s3_bucket" "logs" {
  bucket = "my-logs"
}`;
    const state = parseHclToState(hcl);
    expect(state.resources).toHaveLength(2);
    expect(state.resources[0].type).toBe('vpc');
    expect(state.resources[1].type).toBe('s3_bucket');
  });

  test('extracts string attributes', () => {
    const hcl = `resource "aws_s3_bucket" "example" {
  bucket = "my-bucket"
}`;
    const state = parseHclToState(hcl);
    expect(state.resources[0].attributes.bucket).toBe('my-bucket');
  });

  test('detects reference connections', () => {
    const hcl = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}`;
    const state = parseHclToState(hcl);
    expect(state.connections).toHaveLength(1);
    expect(state.connections[0].from).toBe('aws_subnet.web');
    expect(state.connections[0].to).toBe('aws_vpc.main');
    expect(state.connections[0].type).toBe('reference');
  });

  test('sets parentId from vpc_id reference', () => {
    const hcl = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}`;
    const state = parseHclToState(hcl);
    const subnet = state.resources.find(r => r.id === 'aws_subnet.web');
    expect(subnet?.parentId).toBe('aws_vpc.main');
  });

  test('handles security group reference', () => {
    const hcl = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
  name   = "web-sg"
}

resource "aws_instance" "app" {
  ami                    = "ami-123"
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.web.id]
}`;
    const state = parseHclToState(hcl);
    const sgConn = state.connections.find(c =>
      c.from === 'aws_instance.app' && c.to === 'aws_security_group.web'
    );
    expect(sgConn).toBeDefined();
  });

  test('returns empty state for empty input', () => {
    const state = parseHclToState('');
    expect(state.resources).toHaveLength(0);
    expect(state.connections).toHaveLength(0);
  });

  test('returns empty state for non-resource HCL', () => {
    const hcl = `variable "region" {
  default = "us-east-1"
}`;
    const state = parseHclToState(hcl);
    expect(state.resources).toHaveLength(0);
  });

  test('maps unknown resource types to instance', () => {
    const hcl = `resource "aws_dynamodb_table" "users" {
  name = "users"
}`;
    const state = parseHclToState(hcl);
    expect(state.resources[0].type).toBe('instance');
  });
});
