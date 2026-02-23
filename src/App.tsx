import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { tronTheme } from './theme/tron';
import { SceneContext, type SceneContextType } from './shared/context';
import { ResourceActor } from './actors/ResourceActor';
import { GroundActor } from './actors/GroundActor';
import { EffectsPanel } from './ui/features/EffectsPanel';
import { PostProcessPanel } from './ui/features/PostProcessPanel';
import { ResourceInspector } from './ui/features/ResourceInspector';
import { ResourceTooltip } from './ui/features/ResourceTooltip';
import { ec2Resource } from './resources/ec2';
import {
  ALL_EFFECTS, ALL_POST_PROCESS, ALL_WATER,
  EFFECT_LABELS, POST_PROCESS_LABELS, WATER_LABELS,
  DEFAULT_HOVER_TOGGLES, DEFAULT_SELECT_TOGGLES, DEFAULT_POST_PROCESS, DEFAULT_WATER,
  POST_PROCESS_RANGES, WATER_RANGES,
} from './theme/tron/effects';

function Scene({ isOrtho }: { isOrtho: boolean }) {
  const theme = useTheme();
  const Lights = theme.Lights;
  const PostProcessing = theme.PostProcessing;

  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[6, 6, 6]} zoom={80} near={-100} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 0.8, 4.5]} fov={32} near={0.1} far={100} />
      )}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={isOrtho ? [0, 0.3, 0] : [0, 0.5, 0]}
        minDistance={isOrtho ? undefined : 2}
        maxDistance={isOrtho ? undefined : 12}
      />
      <ResourceActor type="ec2" />
      <GroundActor />
      <Lights />
      <PostProcessing />
    </>
  );
}

const inspectorSections = ec2Resource.infoCard.sections.map(section => ({
  title: section.title,
  rows: section.fields.flatMap(field => {
    const val = (ec2Resource.data as Record<string, unknown>)[field];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.entries(val as Record<string, string>).map(([k, v]) => ({ key: k, value: v }));
    }
    return [{ key: field, value: Array.isArray(val) ? (val as string[]) : String(val) }];
  }),
}));

export default function App() {
  const [isOrtho, setIsOrtho] = useState(true);
  const [hoverToggles, setHoverToggles] = useState<Record<string, boolean>>({ ...DEFAULT_HOVER_TOGGLES });
  const [selected, setSelected] = useState(false);
  const [selectToggles, setSelectToggles] = useState<Record<string, boolean>>({ ...DEFAULT_SELECT_TOGGLES });
  const [postProcessValues, setPostProcessValues] = useState<Record<string, number>>({ ...DEFAULT_POST_PROCESS });
  const [waterValues, setWaterValues] = useState<Record<string, number>>({ ...DEFAULT_WATER });

  const togglesRef = useRef(hoverToggles);
  togglesRef.current = hoverToggles;
  const hoverTRef = useRef(0);

  const selectTogglesRef = useRef(selectToggles);
  selectTogglesRef.current = selectToggles;
  const selectedRef = useRef(false);
  selectedRef.current = selected;
  const selectedTRef = useRef(0);

  const postProcessRef = useRef(postProcessValues);
  postProcessRef.current = postProcessValues;

  const waterRef = useRef(waterValues);
  waterRef.current = waterValues;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const onSelect = useCallback(() => setSelected(prev => !prev), []);
  const onDeselect = useCallback(() => setSelected(false), []);

  const sceneCtx = useMemo<SceneContextType>(() => ({
    togglesRef,
    hoverTRef,
    selectTogglesRef,
    selectedRef,
    selectedTRef,
    onSelect,
    onDeselect,
    tooltipRef,
    postProcessRef,
    waterRef,
  }), []);

  const toggleCamera = useCallback(() => setIsOrtho(prev => !prev), []);
  const toggleHoverEffect = useCallback((key: string) => {
    setHoverToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const toggleSelectEffect = useCallback((key: string) => {
    setSelectToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const updatePostProcess = useCallback((key: string, val: number) => {
    setPostProcessValues(prev => ({ ...prev, [key]: val }));
  }, []);
  const updateWater = useCallback((key: string, val: number) => {
    setWaterValues(prev => ({ ...prev, [key]: val }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') toggleCamera();
      if (e.key === 'Escape') onDeselect();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCamera, onDeselect]);

  return (
    <ThemeProvider theme={tronTheme}>
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <Canvas
          dpr={[1, 2]}
          gl={async (props) => {
            const renderer = new WebGPURenderer({ canvas: props.canvas as HTMLCanvasElement, antialias: true });
            await renderer.init();
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 0.6;
            return renderer;
          }}
        >
          <color attach="background" args={['#010103']} />
          <ThemeProvider theme={tronTheme}>
            <SceneContext.Provider value={sceneCtx}>
              <Scene isOrtho={isOrtho} />
            </SceneContext.Provider>
          </ThemeProvider>
        </Canvas>

        {/* Hover tooltip - positioned by HoverDetector via ref */}
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 900,
          }}
        >
          <ResourceTooltip
            label={ec2Resource.data.instance_type}
            status={ec2Resource.data.state}
            statusColor="#44ff88"
          />
        </div>

        <div style={{
          position: 'fixed', top: 16, left: 16, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <EffectsPanel
            effects={ALL_EFFECTS}
            labels={EFFECT_LABELS}
            hoverToggles={hoverToggles}
            selectToggles={selectToggles}
            onToggleHover={toggleHoverEffect}
            onToggleSelect={toggleSelectEffect}
          />
          <PostProcessPanel
            params={ALL_POST_PROCESS}
            labels={POST_PROCESS_LABELS}
            ranges={POST_PROCESS_RANGES}
            defaults={DEFAULT_POST_PROCESS}
            values={postProcessValues}
            onChange={updatePostProcess}
          />
          <PostProcessPanel
            title="Water / Reflection"
            params={ALL_WATER}
            labels={WATER_LABELS}
            ranges={WATER_RANGES}
            defaults={DEFAULT_WATER}
            values={waterValues}
            onChange={updateWater}
          />
        </div>

        <ResourceInspector
          open={selected}
          onClose={onDeselect}
          resourceLabel="Resource"
          resourceName={ec2Resource.data.resource}
          status={ec2Resource.data.state}
          statusColor="#44ff88"
          subtitle={ec2Resource.data.availability_zone}
          sections={inspectorSections}
          footer="terraform state &middot; last applied 2m ago"
        />
      </div>
    </ThemeProvider>
  );
}
