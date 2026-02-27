import { createContext, useContext } from 'react';
import type { Connection } from '../types';

export type SceneContextType = {
  togglesRef: React.MutableRefObject<Record<string, boolean>>;
  hoverTMapRef: React.MutableRefObject<Record<string, number>>;
  selectTogglesRef: React.MutableRefObject<Record<string, boolean>>;
  selectedTMapRef: React.MutableRefObject<Record<string, number>>;
  onSelect: (resourceId: string) => void;
  onDeselect: () => void;
  setHoveredResourceId: (id: string | null) => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  postProcessRef: React.MutableRefObject<Record<string, number>>;
  waterRef: React.MutableRefObject<Record<string, number>>;
  connectionsRef: React.MutableRefObject<Connection[]>;
  resourcePositionsRef: React.MutableRefObject<Map<string, [number, number, number]>>;
  connectionTogglesRef: React.MutableRefObject<Record<string, boolean>>;
  hoveredResourceIdRef: React.MutableRefObject<string | null>;
  selectedResourceIdRef: React.MutableRefObject<string | null>;
  labelStyleRef: React.MutableRefObject<string>;
};

export const SceneContext = createContext<SceneContextType>(null!);

export const ResourceIdContext = createContext<string>('');
export const ResourceTypeContext = createContext<string>('unknown');

export function useSceneContext() {
  return useContext(SceneContext);
}

export function getEffectT(ctx: SceneContextType, key: string, resourceId?: string): number {
  if (resourceId) {
    const hoverOn = ctx.togglesRef.current[key] ? (ctx.hoverTMapRef.current[resourceId] ?? 0) : 0;
    const selectOn = ctx.selectTogglesRef.current[key] ? (ctx.selectedTMapRef.current[resourceId] ?? 0) : 0;
    return Math.max(hoverOn, selectOn);
  }
  // Global: max across all resources
  let max = 0;
  if (ctx.togglesRef.current[key]) {
    for (const v of Object.values(ctx.hoverTMapRef.current)) {
      if (v > max) max = v;
    }
  }
  if (ctx.selectTogglesRef.current[key]) {
    for (const v of Object.values(ctx.selectedTMapRef.current)) {
      if (v > max) max = v;
    }
  }
  return max;
}
