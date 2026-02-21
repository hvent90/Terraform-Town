import type { TerraformState, Resource, Connection } from '../types';

// Attributes that indicate a parent-child containment relationship
const PARENT_ATTRS: Record<string, string> = {
  vpc_id: 'aws_vpc',
  subnet_id: 'aws_subnet',
};

// Attributes that indicate a reference connection (id-valued scalar or array)
const REFERENCE_ATTRS = ['vpc_id', 'subnet_id', 'vpc_security_group_ids'];

export class StateSync {
  parseState(tfstate: any): TerraformState {
    const rawResources = tfstate.resources || [];
    // Build lookup: resource instance id → address
    const idToAddress = this.buildIdLookup(rawResources);
    const resources = this.normalizeResources(rawResources, idToAddress);
    const connections = this.normalizeConnections(resources, idToAddress);
    return { resources, connections };
  }

  private buildIdLookup(rawResources: any[]): Map<string, string> {
    const lookup = new Map<string, string>();
    for (const r of rawResources) {
      const attrs = r.instances?.[0]?.attributes || r.attributes || {};
      const address = r.address || r.name;
      if (attrs.id) {
        lookup.set(attrs.id, address);
      }
    }
    return lookup;
  }

  private normalizeResources(rawResources: any[], idToAddress: Map<string, string>): Resource[] {
    return rawResources.map(r => ({
      id: r.address || r.name,
      type: this.normalizeType(r.type),
      name: r.name,
      attributes: r.instances?.[0]?.attributes || r.attributes || {},
      state: 'applied' as const,
      parentId: this.findParent(r, idToAddress),
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

  private findParent(resource: any, idToAddress: Map<string, string>): string | undefined {
    const attrs = resource.instances?.[0]?.attributes || resource.attributes || {};
    // Check parent attributes in priority order (most specific first)
    for (const [attr, _tfType] of Object.entries(PARENT_ATTRS)) {
      const refId = attrs[attr];
      if (refId && typeof refId === 'string') {
        const address = idToAddress.get(refId);
        if (address) return address;
      }
    }
    return undefined;
  }

  private normalizeConnections(resources: Resource[], idToAddress: Map<string, string>): Connection[] {
    const connections: Connection[] = [];
    for (const resource of resources) {
      for (const attr of REFERENCE_ATTRS) {
        const value = resource.attributes[attr];
        if (!value) continue;

        // Handle array values (e.g., vpc_security_group_ids)
        const ids = Array.isArray(value) ? value : [value];
        for (const id of ids) {
          const targetAddress = idToAddress.get(id);
          if (targetAddress) {
            connections.push({
              from: resource.id,
              to: targetAddress,
              type: 'reference',
              label: attr,
            });
          }
        }
      }
    }
    return connections;
  }
}
