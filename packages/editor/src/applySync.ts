import type { TerraformState } from '../../visualization/src/types';
import type { Visualization } from '../../visualization/src/Visualization';
import { parseHclToState } from './parseHcl';

export function applyToVisualization(hcl: string, vis: Visualization): TerraformState {
  const state = parseHclToState(hcl);
  vis.update(state);
  return state;
}
