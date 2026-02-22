import { Visualization } from './Visualization';
import { defaultTheme } from './themes/default';
import type { TerraformState } from './types';

const sampleState: TerraformState = {
  resources: [
    { id: 'aws_vpc.main', type: 'vpc', name: 'main', attributes: { cidr_block: '10.0.0.0/16' }, state: 'applied' },
    { id: 'aws_subnet.public', type: 'subnet', name: 'public', attributes: { cidr_block: '10.0.1.0/24', vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_subnet.private', type: 'subnet', name: 'private', attributes: { cidr_block: '10.0.2.0/24', vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_security_group.web', type: 'security_group', name: 'web', attributes: { vpc_id: 'aws_vpc.main' }, state: 'applied', parentId: 'aws_vpc.main' },
    { id: 'aws_instance.web-1', type: 'instance', name: 'web-1', attributes: { instance_type: 't3.micro', subnet_id: 'aws_subnet.public', vpc_security_group_ids: ['aws_security_group.web'] }, state: 'applied', parentId: 'aws_subnet.public' },
    { id: 'aws_instance.web-2', type: 'instance', name: 'web-2', attributes: { instance_type: 't3.micro', subnet_id: 'aws_subnet.public', vpc_security_group_ids: ['aws_security_group.web'] }, state: 'planned', parentId: 'aws_subnet.public' },
    { id: 'aws_s3_bucket.data', type: 's3_bucket', name: 'data', attributes: { bucket: 'my-data-bucket' }, state: 'applied' },
    { id: 'aws_lambda_function.handler', type: 'lambda_function', name: 'handler', attributes: { runtime: 'nodejs18.x', handler: 'index.handler' }, state: 'applied' },
  ],
  connections: [
    { from: 'aws_subnet.public', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_subnet.private', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_security_group.web', to: 'aws_vpc.main', type: 'reference' },
    { from: 'aws_instance.web-1', to: 'aws_subnet.public', type: 'reference' },
    { from: 'aws_instance.web-1', to: 'aws_security_group.web', type: 'reference' },
    { from: 'aws_instance.web-2', to: 'aws_subnet.public', type: 'reference' },
    { from: 'aws_instance.web-2', to: 'aws_security_group.web', type: 'reference' },
  ],
};

async function main() {
  const container = document.getElementById('app');
  if (!container) return;

  const viz = await Visualization.create(container, defaultTheme);
  viz.update(sampleState);

  viz.on('select', (id: string) => console.log('Selected:', id));
  viz.on('hover', (id: string | null) => id && console.log('Hover:', id));
}

main();
