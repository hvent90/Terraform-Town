import type { ActorState } from '../shared/types';
import type {
  ToggleSwitchProps,
  PanelProps,
  BadgeProps,
  KeyHintProps,
  TooltipProps,
  SlidePanelProps,
  DataTableProps,
  SectionHeaderProps,
  SliderProps,
  EffectRowProps,
} from '../ui/components';

export type Theme = {
  resources: Record<string, {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  }>;
  ground: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  connections?: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  Lights: React.ComponentType;
  PostProcessing: React.ComponentType;
  ui: {
    components: {
      ToggleSwitch: React.ComponentType<ToggleSwitchProps>;
      Panel: React.ComponentType<PanelProps>;
      Badge: React.ComponentType<BadgeProps>;
      KeyHint: React.ComponentType<KeyHintProps>;
      Tooltip: React.ComponentType<TooltipProps>;
      SlidePanel: React.ComponentType<SlidePanelProps>;
      DataTable: React.ComponentType<DataTableProps>;
      SectionHeader: React.ComponentType<SectionHeaderProps>;
      Slider: React.ComponentType<SliderProps>;
      EffectRow: React.ComponentType<EffectRowProps>;
    };
  };
};
