import { describe, test, expect } from 'bun:test';
import { parseLine } from './output-parser';

describe('output-parser', () => {
  describe('resource lifecycle events', () => {
    test('creating', () => {
      const events = parseLine('aws_vpc.main: Creating...');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'creating',
      });
    });

    test('creation complete', () => {
      const events = parseLine('aws_vpc.main: Creation complete after 2s [id=vpc-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'created',
      });
    });

    test('destroying', () => {
      const events = parseLine('aws_instance.web: Destroying... [id=i-abc123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'destroying',
      });
    });

    test('destruction complete', () => {
      const events = parseLine('aws_instance.web: Destruction complete after 1s');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'destroyed',
      });
    });

    test('modifying', () => {
      const events = parseLine('aws_security_group.sg: Modifying... [id=sg-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_security_group.sg',
        action: 'modifying',
      });
    });

    test('modifications complete', () => {
      const events = parseLine('aws_security_group.sg: Modifications complete after 3s [id=sg-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_security_group.sg',
        action: 'modified',
      });
    });

    test('refreshing state', () => {
      const events = parseLine('aws_vpc.main: Refreshing state... [id=vpc-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_vpc.main',
        action: 'refreshing',
      });
    });

    test('import prepared', () => {
      const events = parseLine('aws_s3_bucket.data: Import prepared!');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_s3_bucket.data',
        action: 'imported',
      });
    });

    test('reading', () => {
      const events = parseLine('data.aws_ami.latest: Reading...');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'data.aws_ami.latest',
        action: 'reading',
      });
    });

    test('read complete', () => {
      const events = parseLine('data.aws_ami.latest: Read complete after 1s [id=ami-123]');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'data.aws_ami.latest',
        action: 'read',
      });
    });
  });

  describe('plan summary', () => {
    test('parses plan summary line', () => {
      const events = parseLine('Plan: 3 to add, 1 to change, 2 to destroy.');
      expect(events).toContainEqual({
        type: 'plan_summary',
        adds: 3,
        changes: 1,
        destroys: 2,
      });
    });

    test('parses apply summary', () => {
      const events = parseLine('Apply complete! Resources: 3 added, 1 changed, 2 destroyed.');
      expect(events).toContainEqual({
        type: 'plan_summary',
        adds: 3,
        changes: 1,
        destroys: 2,
      });
    });
  });

  describe('every line emits a line event', () => {
    test('plain text', () => {
      const events = parseLine('Terraform will perform the following actions:');
      expect(events).toContainEqual({
        type: 'line',
        text: 'Terraform will perform the following actions:',
      });
    });

    test('resource line also emits line event', () => {
      const events = parseLine('aws_vpc.main: Creating...');
      expect(events).toContainEqual({ type: 'line', text: 'aws_vpc.main: Creating...' });
      expect(events).toContainEqual({ type: 'resource', address: 'aws_vpc.main', action: 'creating' });
      expect(events).toHaveLength(2);
    });
  });

  describe('error lines', () => {
    test('error with resource address', () => {
      const events = parseLine('Error: creating EC2 Instance (aws_instance.web): something failed');
      expect(events).toContainEqual({
        type: 'resource',
        address: 'aws_instance.web',
        action: 'error',
      });
    });
  });
});
