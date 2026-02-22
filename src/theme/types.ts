import type { ActorState } from '../shared/types';

export type Theme = {
  resources: Record<string, {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  }>;
  ground: {
    Mesh: React.ComponentType;
    effects: Partial<Record<ActorState, React.ComponentType[]>>;
  };
  Lights: React.ComponentType;
  PostProcessing: React.ComponentType;
  ui: {
    components: {
      ToggleSwitch: React.ComponentType<any>;
      Panel: React.ComponentType<any>;
      Badge: React.ComponentType<any>;
      KeyHint: React.ComponentType<any>;
      Tooltip: React.ComponentType<any>;
      SlidePanel: React.ComponentType<any>;
      DataTable: React.ComponentType<any>;
      SectionHeader: React.ComponentType<any>;
    };
  };
};
