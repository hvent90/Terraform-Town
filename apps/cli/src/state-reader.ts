import { existsSync, readFileSync } from 'fs';
import { StateSync } from '@terraform-town/visualization/src/state/StateSync';
import type { TerraformState } from '@terraform-town/visualization/src/types';

const EMPTY_STATE: TerraformState = { resources: [], connections: [] };

export function readStateFile(path: string): TerraformState {
  if (!existsSync(path)) {
    return EMPTY_STATE;
  }

  const raw = readFileSync(path, 'utf-8');
  const json = JSON.parse(raw);

  if (!json.resources || json.resources.length === 0) {
    return EMPTY_STATE;
  }

  // Raw .tfstate files store module, type, and name as separate fields.
  // Build the full address (e.g. "module.foo.aws_iam_role.lambda") so each
  // resource gets a unique id in the visualization.
  const normalized = {
    ...json,
    resources: json.resources.map((r: any) => {
      const base = `${r.type}.${r.name}`;
      return {
        ...r,
        address: r.address || (r.module ? `${r.module}.${base}` : base),
      };
    }),
  };

  const sync = new StateSync();
  return sync.parseState(normalized);
}
