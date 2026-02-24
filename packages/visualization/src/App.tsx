import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { tronTheme } from './theme/tron';
import { SceneContext, ResourceIdContext, type SceneContextType } from './shared/context';
import { ResourceActor } from './actors/ResourceActor';
import { GroundActor } from './actors/GroundActor';
import { ConnectionActor } from './actors/ConnectionActor';
import { EffectsPanel } from './ui/features/EffectsPanel';
import { ConnectionsPanel } from './ui/features/ConnectionsPanel';
import { PostProcessPanel } from './ui/features/PostProcessPanel';
import { ResourceInspector } from './ui/features/ResourceInspector';
import { ResourceTooltip } from './ui/features/ResourceTooltip';
import { TerraformInput } from './ui/features/TerraformInput';
import { LayoutPanel } from './ui/features/LayoutPanel';
import { parseHcl } from './state/parseHcl';
import { computeLayout, type LayoutMode } from './layout';
import { ec2Resource } from './resources/ec2';
import type { TerraformState, Resource, Connection } from './types';
import {
  ALL_EFFECTS, ALL_POST_PROCESS, ALL_WATER,
  EFFECT_LABELS, POST_PROCESS_LABELS, WATER_LABELS,
  DEFAULT_HOVER_TOGGLES, DEFAULT_SELECT_TOGGLES, DEFAULT_POST_PROCESS, DEFAULT_WATER,
  POST_PROCESS_RANGES, WATER_RANGES,
  DEFAULT_CONNECTION_TOGGLES,
  ALL_CONNECTION_EFFECTS, CONNECTION_LABELS,
} from './theme/tron/effects';

const DEFAULT_STATE: TerraformState = {
  resources: [{
    id: 'aws_instance.main',
    type: 'instance',
    name: 'main',
    attributes: ec2Resource.data,
    state: 'applied',
  }],
  connections: [],
};

const STATE_COLORS: Record<string, string> = {
  planned: '#ffaa44',
  applied: '#44ff88',
  modified: '#44aaff',
  destroyed: '#ff4444',
  error: '#ff4444',
};

function themeKey(type: string): string {
  const map: Record<string, string> = {
    instance: 'ec2',
    vpc: 'vpc',
    subnet: 'subnet',
    security_group: 'security_group',
    s3_bucket: 's3_bucket',
    iam_role: 'iam_role',
  };
  return map[type] ?? 'ec2';
}

function buildInspectorSections(resource: Resource) {
  const attrs = resource.attributes;
  const mainRows: { key: string; value: string | string[] }[] = [];
  const objectSections: { title: string; rows: { key: string; value: string | string[] }[] }[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      objectSections.push({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        rows: Object.entries(value as Record<string, string>).map(([k, v]) => ({
          key: k,
          value: String(v),
        })),
      });
    } else {
      mainRows.push({
        key,
        value: Array.isArray(value) ? value.map(String) : String(value ?? ''),
      });
    }
  }

  return [{ title: 'Details', rows: mainRows }, ...objectSections];
}

function Scene({ isOrtho, resources, positions }: { isOrtho: boolean; resources: Resource[]; positions: Map<string, [number, number, number]> }) {
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
      {resources.map((resource) => {
        const pos = positions.get(resource.id) ?? [0, 0, 0];
        return (
          <ResourceIdContext.Provider key={resource.id} value={resource.id}>
            <group position={pos}>
              <ResourceActor type={themeKey(resource.type)} />
            </group>
          </ResourceIdContext.Provider>
        );
      })}
      <GroundActor />
      <ConnectionActor />
      <Lights />
      <PostProcessing />
    </>
  );
}

export interface AppProps {
  terraformState?: TerraformState;
}

export default function App({ terraformState }: AppProps) {
  const [generatedState, setGeneratedState] = useState<TerraformState | null>(null);
  const state = generatedState ?? terraformState ?? DEFAULT_STATE;
  const resources = state.resources;
  const connections = state.connections;

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(null);
  const selected = selectedResourceId !== null;
  const activeResource = selectedResourceId
    ? resources.find(r => r.id === selectedResourceId) ?? null
    : null;
  const tooltipResource = hoveredResourceId
    ? resources.find(r => r.id === hoveredResourceId) ?? null
    : null;

  const [isOrtho, setIsOrtho] = useState(true);
  const [hoverToggles, setHoverToggles] = useState<Record<string, boolean>>({ ...DEFAULT_HOVER_TOGGLES });
  const [selectToggles, setSelectToggles] = useState<Record<string, boolean>>({ ...DEFAULT_SELECT_TOGGLES });
  const [postProcessValues, setPostProcessValues] = useState<Record<string, number>>({ ...DEFAULT_POST_PROCESS });
  const [waterValues, setWaterValues] = useState<Record<string, number>>({ ...DEFAULT_WATER });
  const [connectionToggles, setConnectionToggles] = useState<Record<string, boolean>>({ ...DEFAULT_CONNECTION_TOGGLES });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

  const handleGenerate = useCallback((hcl: string) => {
    const parsed = parseHcl(hcl);
    if (parsed.resources.length > 0) {
      setGeneratedState(parsed);
      setSelectedResourceId(null);
    }
  }, []);

  const togglesRef = useRef(hoverToggles);
  togglesRef.current = hoverToggles;
  const hoverTMapRef = useRef<Record<string, number>>({});

  const selectTogglesRef = useRef(selectToggles);
  selectTogglesRef.current = selectToggles;
  const selectedTMapRef = useRef<Record<string, number>>({});

  const postProcessRef = useRef(postProcessValues);
  postProcessRef.current = postProcessValues;

  const waterRef = useRef(waterValues);
  waterRef.current = waterValues;

  const positions = useMemo(() => {
    const hasOverrides = resources.some(r => r.position);
    if (hasOverrides) {
      const map = new Map<string, [number, number, number]>();
      for (const r of resources) {
        const pos = r.position
          ? [r.position.x, r.position.y, r.position.z] as [number, number, number]
          : [0, 0, 0] as [number, number, number];
        map.set(r.id, pos);
      }
      return map;
    }
    return computeLayout(layoutMode, resources, connections);
  }, [resources, connections, layoutMode]);

  const connectionsRef = useRef<Connection[]>(connections);
  connectionsRef.current = connections;
  const resourcePositionsRef = useRef<Map<string, [number, number, number]>>(positions);
  resourcePositionsRef.current = positions;
  const connectionTogglesRef = useRef<Record<string, boolean>>({});
  connectionTogglesRef.current = connectionToggles;
  const hoveredResourceIdRef = useRef<string | null>(null);
  hoveredResourceIdRef.current = hoveredResourceId;
  const selectedResourceIdRef = useRef<string | null>(null);
  selectedResourceIdRef.current = selectedResourceId;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const onSelect = useCallback((resourceId: string) => {
    setSelectedResourceId(prev => prev === resourceId ? null : resourceId);
  }, []);
  const onDeselect = useCallback(() => setSelectedResourceId(null), []);

  const setHoveredResourceIdCb = useCallback((id: string | null) => setHoveredResourceId(id), []);

  const sceneCtx = useMemo<SceneContextType>(() => ({
    togglesRef,
    hoverTMapRef,
    selectTogglesRef,
    selectedTMapRef,
    onSelect,
    onDeselect,
    setHoveredResourceId: setHoveredResourceIdCb,
    tooltipRef,
    postProcessRef,
    waterRef,
    connectionsRef,
    resourcePositionsRef,
    connectionTogglesRef,
    hoveredResourceIdRef,
    selectedResourceIdRef,
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

  const inspectorSections = activeResource ? buildInspectorSections(activeResource) : [];
  const statusColor = activeResource ? (STATE_COLORS[activeResource.state] ?? '#44ff88') : '#44ff88';
  const tooltipStatusColor = tooltipResource ? (STATE_COLORS[tooltipResource.state] ?? '#44ff88') : '#44ff88';

  return (
    <ThemeProvider theme={tronTheme}>
      <div style={{ width: '100%', height: '100%', background: '#000' }}>
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
              <Scene isOrtho={isOrtho} resources={resources} positions={positions} />
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
            label={tooltipResource?.name ?? ''}
            status={tooltipResource?.state ?? ''}
            statusColor={tooltipStatusColor}
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
          {connections.length > 0 && (
            <ConnectionsPanel
              effects={ALL_CONNECTION_EFFECTS}
              labels={CONNECTION_LABELS}
              toggles={connectionToggles}
              onToggle={(key) => setConnectionToggles(prev => ({ ...prev, [key]: !prev[key] }))}
            />
          )}
        </div>

        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <LayoutPanel value={layoutMode} onChange={setLayoutMode} />
        </div>

        <ResourceInspector
          open={selected}
          onClose={onDeselect}
          resourceLabel={activeResource ? themeKey(activeResource.type).toUpperCase() : ''}
          resourceName={activeResource?.id ?? ''}
          status={activeResource?.state ?? ''}
          statusColor={statusColor}
          subtitle={activeResource?.name ?? ''}
          sections={inspectorSections}
          footer="terraform state"
        />

        <TerraformInput onGenerate={handleGenerate} />
      </div>
    </ThemeProvider>
  );
}
