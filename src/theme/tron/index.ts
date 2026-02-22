import type { Theme } from '../types';
import { CubeMesh } from './meshes/CubeMesh';
import { ReflectiveGround } from './meshes/ReflectiveGround';
import { HoverDetector } from './effects/HoverDetector';
import { TraceLines } from './effects/TraceLines';
import { OrbitRing } from './effects/OrbitRing';
import { DataStreamParticles } from './effects/DataStreamParticles';
import { GroundConnectionBeam } from './effects/GroundConnectionBeam';
import { GroundParticles } from './effects/GroundParticles';
import { GroundLightPool } from './effects/GroundLightPool';
import { SceneLights } from './SceneLights';
import { PostProcessing } from './PostProcessing';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { Panel } from './ui/Panel';
import { Badge } from './ui/Badge';
import { KeyHint } from './ui/KeyHint';
import { Tooltip } from './ui/Tooltip';
import { SlidePanel } from './ui/SlidePanel';
import { DataTable } from './ui/DataTable';
import { SectionHeader } from './ui/SectionHeader';

export const tronTheme: Theme = {
  resources: {
    ec2: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
  },
  ground: {
    Mesh: ReflectiveGround,
    effects: {
      idle: [GroundParticles, GroundLightPool],
    },
  },
  Lights: SceneLights,
  PostProcessing: PostProcessing,
  ui: {
    components: {
      ToggleSwitch,
      Panel,
      Badge,
      KeyHint,
      Tooltip,
      SlidePanel,
      DataTable,
      SectionHeader,
    },
  },
};
