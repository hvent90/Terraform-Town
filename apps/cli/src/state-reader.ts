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

  // Raw .tfstate files have type and name as separate fields but no address.
  // StateSync.parseState uses r.address || r.name for resource id, so we
  // pre-compute the address as "${type}.${name}" to match terraform conventions.
  const normalized = {
    ...json,
    resources: json.resources.map((r: any) => ({
      ...r,
      address: r.address || `${r.type}.${r.name}`,
    })),
  };

  const sync = new StateSync();
  return sync.parseState(normalized);
}
