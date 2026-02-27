import type { TerraformState, Resource, Connection, ResourceType } from '../types';

// Longest prefix first — first match wins.
const TYPE_PREFIXES: [string, ResourceType][] = [
  ['aws_security_group', 'security_group'],
  ['aws_lambda_', 'lambda_function'],
  ['aws_subnet', 'subnet'],
  ['aws_instance', 'instance'],
  ['aws_s3_', 's3_bucket'],
  ['aws_iam_', 'iam_role'],
  ['aws_vpc', 'vpc'],
];

/**
 * Extract the AWS service name from a terraform resource type.
 * e.g. "aws_route53_record" → "route53"
 *      "aws_acm_certificate" → "acm"
 *      "aws_cloudwatch_log_group" → "cloudwatch"
 */
function extractServiceName(tfType: string): string {
  const stripped = tfType.replace(/^aws_/, '');
  const firstSeg = stripped.split('_')[0];
  return firstSeg || 'unknown';
}

const PARENT_ATTRS: Record<string, string> = {
  vpc_id: 'aws_vpc',
  subnet_id: 'aws_subnet',
};

const REFERENCE_ATTRS = ['vpc_id', 'subnet_id', 'vpc_security_group_ids'];

export class StateSync {
  parseState(tfstate: any): TerraformState {
    const rawResources = tfstate.resources || [];
    const idToAddress = this.buildIdLookup(rawResources);
    const resources = this.normalizeResources(rawResources, idToAddress);
    const connections = this.normalizeConnections(resources, idToAddress);
    return { resources, connections };
  }

  private buildIdLookup(rawResources: any[]): Map<string, string> {
    const lookup = new Map<string, string>();
    for (const r of rawResources) {
      const baseAddress = r.address || r.name;
      const instances = r.instances || [{ attributes: r.attributes || {} }];
      for (const instance of instances) {
        const attrs = instance.attributes || {};
        const indexKey = instance.index_key;
        const address = indexKey != null ? `${baseAddress}[${JSON.stringify(indexKey)}]` : baseAddress;
        if (attrs.id) lookup.set(attrs.id, address);
      }
    }
    return lookup;
  }

  private normalizeResources(rawResources: any[], idToAddress: Map<string, string>): Resource[] {
    const resources: Resource[] = [];
    const seen = new Map<string, number>();
    for (const r of rawResources) {
      const baseAddress = r.address || r.name;
      const instances = r.instances || [{ attributes: r.attributes || {} }];
      for (const instance of instances) {
        const indexKey = instance.index_key;
        let id = indexKey != null ? `${baseAddress}[${JSON.stringify(indexKey)}]` : baseAddress;

        // Disambiguate duplicate IDs (can happen with nested modules)
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count > 0) id = `${id}#${count}`;

        resources.push({
          id,
          type: this.normalizeType(r.type),
          name: r.name,
          attributes: instance.attributes || {},
          state: 'applied' as const,
          parentId: this.findParent(r, idToAddress),
        });
      }
    }
    return resources;
  }

  private normalizeType(tfType: string): Resource['type'] {
    for (const [prefix, type] of TYPE_PREFIXES) {
      if (tfType.startsWith(prefix)) return type;
    }
    return extractServiceName(tfType);
  }

  private findParent(resource: any, idToAddress: Map<string, string>): string | undefined {
    const attrs = resource.instances?.[0]?.attributes || resource.attributes || {};
    for (const [attr] of Object.entries(PARENT_ATTRS)) {
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
        const ids = Array.isArray(value) ? value : [value];
        for (const id of ids) {
          const targetAddress = idToAddress.get(id);
          if (targetAddress) {
            connections.push({ from: resource.id, to: targetAddress, type: 'reference', label: attr });
          }
        }
      }
    }
    return connections;
  }
}
