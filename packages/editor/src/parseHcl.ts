import type { TerraformState, Resource, Connection, ResourceType } from '../../visualization/src/types';

const TYPE_MAP: Record<string, ResourceType> = {
  aws_vpc: 'vpc',
  aws_subnet: 'subnet',
  aws_security_group: 'security_group',
  aws_instance: 'instance',
  aws_s3_bucket: 's3_bucket',
  aws_iam_role: 'iam_role',
  aws_lambda_function: 'lambda_function',
};

const PARENT_ATTRS: Record<string, boolean> = {
  vpc_id: true,
  subnet_id: true,
};

// Matches: resource "type" "name" { ... }
const RESOURCE_BLOCK_RE = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;

// Matches: key = "value" (string attribute)
const STRING_ATTR_RE = /^\s*(\w+)\s*=\s*"([^"]*)"/;

// Matches: key = reference.path.id (terraform reference)
const REF_ATTR_RE = /^\s*(\w+)\s*=\s*([\w]+\.[\w]+)\.id/;

// Matches: key = [ref.path.id, ...] (list with references)
const LIST_REF_RE = /^\s*(\w+)\s*=\s*\[([^\]]*)\]/;

// Matches individual references in a list
const LIST_ITEM_REF_RE = /([\w]+\.[\w]+)\.id/g;

interface ParsedResource {
  tfType: string;
  name: string;
  address: string;
  attributes: Record<string, unknown>;
  references: Array<{ attr: string; target: string }>;
}

function extractResourceBlocks(hcl: string): ParsedResource[] {
  const resources: ParsedResource[] = [];
  const matches = [...hcl.matchAll(RESOURCE_BLOCK_RE)];

  for (const match of matches) {
    const tfType = match[1];
    const name = match[2];
    const address = `${tfType}.${name}`;
    const startIdx = match.index! + match[0].length;
    const body = extractBlockBody(hcl, startIdx);

    const attributes: Record<string, unknown> = {};
    const references: Array<{ attr: string; target: string }> = [];

    for (const line of body.split('\n')) {
      const strMatch = line.match(STRING_ATTR_RE);
      if (strMatch) {
        attributes[strMatch[1]] = strMatch[2];
        continue;
      }

      const refMatch = line.match(REF_ATTR_RE);
      if (refMatch) {
        references.push({ attr: refMatch[1], target: refMatch[2] });
        continue;
      }

      const listMatch = line.match(LIST_REF_RE);
      if (listMatch) {
        const listContent = listMatch[2];
        let itemMatch;
        while ((itemMatch = LIST_ITEM_REF_RE.exec(listContent)) !== null) {
          references.push({ attr: listMatch[1], target: itemMatch[1] });
        }
      }
    }

    resources.push({ tfType, name, address, attributes, references });
  }

  return resources;
}

function extractBlockBody(hcl: string, startIdx: number): string {
  let depth = 1;
  let i = startIdx;
  while (i < hcl.length && depth > 0) {
    if (hcl[i] === '{') depth++;
    else if (hcl[i] === '}') depth--;
    i++;
  }
  return hcl.slice(startIdx, i - 1);
}

export function parseHclToState(hcl: string): TerraformState {
  const parsed = extractResourceBlocks(hcl);
  const addressSet = new Set(parsed.map(r => r.address));

  const resources: Resource[] = parsed.map(r => {
    let parentId: string | undefined;
    for (const ref of r.references) {
      if (PARENT_ATTRS[ref.attr] && addressSet.has(ref.target)) {
        parentId = ref.target;
        break;
      }
    }

    return {
      id: r.address,
      type: TYPE_MAP[r.tfType] || 'instance',
      name: r.name,
      attributes: r.attributes,
      state: 'applied' as const,
      parentId,
    };
  });

  const connections: Connection[] = [];
  for (const r of parsed) {
    for (const ref of r.references) {
      if (addressSet.has(ref.target)) {
        connections.push({
          from: r.address,
          to: ref.target,
          type: 'reference',
          label: ref.attr,
        });
      }
    }
  }

  return { resources, connections };
}
