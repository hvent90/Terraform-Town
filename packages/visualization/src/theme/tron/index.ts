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
import { ConnectionTraces } from './effects/ConnectionTraces';
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
import { Slider } from './ui/Slider';
import { EffectRow } from './ui/EffectRow';

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
    vpc: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
    subnet: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
    security_group: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
    s3_bucket: {
      Mesh: CubeMesh,
      effects: {
        idle: [TraceLines],
        hover: [HoverDetector],
        selected: [OrbitRing, DataStreamParticles, GroundConnectionBeam],
      },
    },
    iam_role: {
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
  connections: {
    Mesh: ConnectionTraces,
    effects: {},
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
      Slider,
      EffectRow,
    },
  },
};
