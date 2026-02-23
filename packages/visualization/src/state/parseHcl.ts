import type { TerraformState, Resource, Connection, ResourceType } from '../types';

const TYPE_MAP: Record<string, ResourceType> = {
  aws_vpc: 'vpc',
  aws_subnet: 'subnet',
  aws_security_group: 'security_group',
  aws_instance: 'instance',
  aws_s3_bucket: 's3_bucket',
  aws_iam_role: 'iam_role',
  aws_lambda_function: 'lambda_function',
};

type RawBlock = {
  tfType: string;
  name: string;
  body: string;
};

/** Find matching closing brace for an opening brace at `start` */
function findClosingBrace(src: string, start: number): number {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Extract all resource blocks from HCL text */
function extractBlocks(src: string): RawBlock[] {
  const blocks: RawBlock[] = [];
  const re = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
  let match;
  while ((match = re.exec(src)) !== null) {
    const openBrace = match.index + match[0].length - 1;
    const closeBrace = findClosingBrace(src, openBrace);
    if (closeBrace === -1) continue;
    blocks.push({
      tfType: match[1],
      name: match[2],
      body: src.slice(openBrace + 1, closeBrace).trim(),
    });
  }
  return blocks;
}

/** Parse a simple attribute value (string, number, bool, reference, list) */
function parseValue(raw: string): any {
  const trimmed = raw.trim();
  // String literal
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  // Number
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  // List like [foo, bar]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(v => parseValue(v.trim()));
  }
  // Terraform reference (e.g. aws_vpc.main.id)
  return trimmed;
}

/** Parse attributes from a block body (handles nested objects like tags = { ... }) */
function parseAttributes(body: string): Record<string, any> {
  const attrs: Record<string, any> = {};
  let i = 0;
  while (i < body.length) {
    // Skip whitespace and newlines
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;
    // Skip comment lines
    if (body[i] === '#' || (body[i] === '/' && body[i + 1] === '/')) {
      while (i < body.length && body[i] !== '\n') i++;
      continue;
    }
    // Read key
    const keyMatch = body.slice(i).match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/);
    if (!keyMatch) { i++; continue; }
    const key = keyMatch[1];
    i += keyMatch[0].length;
    // Skip whitespace
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;

    if (body[i] === '{') {
      // Nested object
      const close = findClosingBrace(body, i);
      if (close === -1) break;
      const nested = body.slice(i + 1, close).trim();
      attrs[key] = parseAttributes(nested);
      i = close + 1;
    } else {
      // Find end of value (newline or end of body)
      let end = i;
      let inString = false;
      let bracketDepth = 0;
      while (end < body.length) {
        if (body[end] === '"') inString = !inString;
        if (!inString) {
          if (body[end] === '[') bracketDepth++;
          if (body[end] === ']') bracketDepth--;
          if (body[end] === '\n' && bracketDepth <= 0) break;
        }
        end++;
      }
      const valStr = body.slice(i, end).trim();
      attrs[key] = parseValue(valStr);
      i = end;
    }
  }
  return attrs;
}

/** Detect terraform references in attribute values, returning resource addresses */
function findReferences(attrs: Record<string, any>, allAddresses: Set<string>): string[] {
  const refs: string[] = [];
  const refPattern = /^([a-z_]+\.[a-z_][a-z0-9_]*)(?:\.[a-z_]+)?$/;

  function walk(value: any) {
    if (typeof value === 'string') {
      const match = value.match(refPattern);
      if (match && allAddresses.has(match[1])) {
        refs.push(match[1]);
      }
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  }

  walk(attrs);
  return [...new Set(refs)];
}

/** Parse HCL terraform configuration text into TerraformState */
export function parseHcl(src: string): TerraformState {
  const blocks = extractBlocks(src);
  const allAddresses = new Set(blocks.map(b => `${b.tfType}.${b.name}`));

  const resources: Resource[] = blocks.map(block => {
    const address = `${block.tfType}.${block.name}`;
    const attrs = parseAttributes(block.body);
    return {
      id: address,
      type: TYPE_MAP[block.tfType] ?? 'instance',
      name: block.name,
      attributes: attrs,
      state: 'planned' as const,
    };
  });

  const connections: Connection[] = [];
  for (const resource of resources) {
    const refs = findReferences(resource.attributes, allAddresses);
    for (const ref of refs) {
      connections.push({
        from: resource.id,
        to: ref,
        type: 'reference',
      });
    }
  }

  return { resources, connections };
}
