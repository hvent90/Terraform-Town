import * as THREE from 'three';
import type { TerraformState, Resource, Connection } from '../types';

export class StateSync {
  parseState(tfstate: any): TerraformState {
    const resources = this.normalizeResources(tfstate.resources || []);
    const connections = this.normalizeConnections(resources);
    return { resources, connections };
  }
  
  private normalizeResources(resources: any[]): Resource[] {
    return resources.map(r => ({
      id: r.address || r.name,
      type: this.normalizeType(r.type),
      name: r.name,
      attributes: r.instances?.[0]?.attributes || r.attributes || {},
      state: 'applied' as const,
      parentId: this.findParent(r),
    }));
  }
  
  private normalizeType(tfType: string): Resource['type'] {
    const typeMap: Record<string, Resource['type']> = {
      'aws_vpc': 'vpc',
      'aws_subnet': 'subnet',
      'aws_security_group': 'security_group',
      'aws_instance': 'instance',
      'aws_s3_bucket': 's3_bucket',
      'aws_iam_role': 'iam_role',
      'aws_lambda_function': 'lambda_function',
    };
    return typeMap[tfType] || 'instance';
  }
  
  private findParent(resource: any): string | undefined {
    // TODO: Extract parent from attributes (vpc_id, subnet_id, etc.)
    return undefined;
  }
  
  private normalizeConnections(resources: Resource[]): Connection[] {
    const connections: Connection[] = [];
    // TODO: Extract references from attributes
    return connections;
  }
}
