import type { Resource, Connection } from '../types';
import { gridLayout } from './gridLayout';
import { typeClusterLayout } from './typeClusterLayout';
import { hierarchyLayout } from './hierarchyLayout';
import { graphLayout } from './graphLayout';

export type LayoutMode = 'grid' | 'type' | 'hierarchy' | 'graph';

type Vec3 = [number, number, number];
type LayoutFn = (resources: Resource[], connections: Connection[]) => Map<string, Vec3>;

const LAYOUT_FNS: Record<LayoutMode, LayoutFn> = {
  grid: gridLayout,
  type: typeClusterLayout,
  hierarchy: hierarchyLayout,
  graph: graphLayout,
};

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  grid: 'Flat Grid',
  type: 'Type Clusters',
  hierarchy: 'Hierarchy',
  graph: 'Graph',
};

export const ALL_LAYOUTS: LayoutMode[] = ['grid', 'type', 'hierarchy', 'graph'];

export function computeLayout(
  mode: LayoutMode,
  resources: Resource[],
  connections: Connection[],
): Map<string, Vec3> {
  return LAYOUT_FNS[mode](resources, connections);
}
