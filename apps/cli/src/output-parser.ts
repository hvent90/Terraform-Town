import type { StreamEvent, ResourceAction } from './events';

const LIFECYCLE_PATTERNS: Array<{ pattern: RegExp; action: ResourceAction }> = [
  { pattern: /^(.+?):\s+Creating\.\.\./, action: 'creating' },
  { pattern: /^(.+?):\s+Creation complete/, action: 'created' },
  { pattern: /^(.+?):\s+Destroying\.\.\./, action: 'destroying' },
  { pattern: /^(.+?):\s+Destruction complete/, action: 'destroyed' },
  { pattern: /^(.+?):\s+Modifying\.\.\./, action: 'modifying' },
  { pattern: /^(.+?):\s+Modifications complete/, action: 'modified' },
  { pattern: /^(.+?):\s+Refreshing state\.\.\./, action: 'refreshing' },
  { pattern: /^(.+?):\s+Refresh complete/, action: 'refreshed' },
  { pattern: /^(.+?):\s+Import prepared!/, action: 'imported' },
  { pattern: /^(.+?):\s+Importing\.\.\./, action: 'importing' },
  { pattern: /^(.+?):\s+Reading\.\.\./, action: 'reading' },
  { pattern: /^(.+?):\s+Read complete/, action: 'read' },
];

const PLAN_SUMMARY = /^Plan:\s+(\d+)\s+to add,\s+(\d+)\s+to change,\s+(\d+)\s+to destroy/;
const APPLY_SUMMARY =
  /^Apply complete!\s+Resources:\s+(\d+)\s+added,\s+(\d+)\s+changed,\s+(\d+)\s+destroyed/;
const ERROR_WITH_ADDRESS = /\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*)\)/;

export function parseLine(line: string): StreamEvent[] {
  const events: StreamEvent[] = [{ type: 'line', text: line }];

  for (const { pattern, action } of LIFECYCLE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      events.push({ type: 'resource', address: match[1], action });
      return events;
    }
  }

  const planMatch = line.match(PLAN_SUMMARY);
  if (planMatch) {
    events.push({
      type: 'plan_summary',
      adds: parseInt(planMatch[1]),
      changes: parseInt(planMatch[2]),
      destroys: parseInt(planMatch[3]),
    });
    return events;
  }

  const applyMatch = line.match(APPLY_SUMMARY);
  if (applyMatch) {
    events.push({
      type: 'plan_summary',
      adds: parseInt(applyMatch[1]),
      changes: parseInt(applyMatch[2]),
      destroys: parseInt(applyMatch[3]),
    });
    return events;
  }

  if (line.startsWith('Error:')) {
    const addrMatch = line.match(ERROR_WITH_ADDRESS);
    if (addrMatch) {
      events.push({ type: 'resource', address: addrMatch[1], action: 'error' });
    }
  }

  return events;
}
