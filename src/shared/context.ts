import { createContext, useContext } from 'react';

export type SceneContextType = {
  togglesRef: React.MutableRefObject<Record<string, boolean>>;
  hoverTRef: React.MutableRefObject<number>;
  selectTogglesRef: React.MutableRefObject<Record<string, boolean>>;
  selectedRef: React.MutableRefObject<boolean>;
  selectedTRef: React.MutableRefObject<number>;
  onSelect: () => void;
  onDeselect: () => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  postProcessRef: React.MutableRefObject<Record<string, number>>;
};

export const SceneContext = createContext<SceneContextType>(null!);

export function useSceneContext() {
  return useContext(SceneContext);
}
