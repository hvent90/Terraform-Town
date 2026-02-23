import { createContext, useContext } from 'react';

export type SceneContextType = {
  togglesRef: React.MutableRefObject<Record<string, boolean>>;
  hoverTRef: React.MutableRefObject<number>;
  selectTogglesRef: React.MutableRefObject<Record<string, boolean>>;
  selectedRef: React.MutableRefObject<boolean>;
  selectedTRef: React.MutableRefObject<number>;
  onSelect: (resourceId: string) => void;
  onDeselect: () => void;
  setHoveredResourceId: (id: string | null) => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  postProcessRef: React.MutableRefObject<Record<string, number>>;
  waterRef: React.MutableRefObject<Record<string, number>>;
};

export const SceneContext = createContext<SceneContextType>(null!);

export const ResourceIdContext = createContext<string>('');

export function useSceneContext() {
  return useContext(SceneContext);
}

export function getEffectT(ctx: SceneContextType, key: string): number {
  const hoverOn = ctx.togglesRef.current[key] ? ctx.hoverTRef.current : 0;
  const selectOn = ctx.selectTogglesRef.current[key] ? ctx.selectedTRef.current : 0;
  return Math.max(hoverOn, selectOn);
}
