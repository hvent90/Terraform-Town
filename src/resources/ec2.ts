export const ec2Resource = {
  type: 'ec2',
  label: 'EC2',
  data: {
    resource: 'aws_instance.main',
    instance_id: 'i-0a3b8f29d4e6c1072',
    instance_type: 't3.medium',
    ami: 'ami-0c55b159cbfafe1f0',
    availability_zone: 'us-east-1a',
    state: 'running',
    public_ip: '54.210.167.89',
    private_ip: '10.0.1.42',
    vpc_id: 'vpc-0a1b2c3d4e5f6g7h8',
    security_groups: ['sg-web-prod'],
    key_name: 'prod-ssh-key',
    tags: {
      Name: 'web-server-prod',
      Environment: 'production',
      Team: 'platform',
    },
  },
  infoCard: {
    sections: [
      { title: 'Instance', fields: ['instance_id', 'instance_type', 'ami', 'key_name'] },
      { title: 'Network', fields: ['public_ip', 'private_ip', 'vpc_id', 'security_groups'] },
      { title: 'Tags', fields: ['tags'] },
    ],
  },
};
