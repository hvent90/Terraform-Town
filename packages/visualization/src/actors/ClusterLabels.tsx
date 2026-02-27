import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useMemo } from 'react';
import type { Resource } from '../types';
import { RESOURCE_COLORS, DEFAULT_RESOURCE_COLORS } from '../theme/tron/colors';
import { CUBE_SIZE } from '../shared/geometry';

const FONT_NAME = 'GeistPixel-Grid';
// ResourceLabel already loads this font into document.fonts — just wait for it
const fontPromise = document.fonts.ready;

const PAD = 1.0; // world-space padding around outermost resources
const BOX_Y_MIN = -0.1;
const BOX_Y_MAX = CUBE_SIZE + 0.3;

const DISPLAY_NAMES: Record<string, string> = {
  instance: 'EC2',
  vpc: 'VPC',
  subnet: 'SUBNET',
  security_group: 'SG',
  s3_bucket: 'S3',
  iam_role: 'IAM',
  lambda_function: 'LAMBDA',
};

const THEME_KEYS: Record<string, string> = {
  instance: 'ec2',
  vpc: 'vpc',
  subnet: 'subnet',
  security_group: 'security_group',
  s3_bucket: 's3_bucket',
  iam_role: 'iam_role',
  lambda_function: 'lambda',
};

function colorCSS(c: THREE.Color, a = 1): string {
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

type ClusterData = {
  type: string;
  count: number;
  corners: THREE.Vector3[]; // 8 corners of the 3D AABB
  center: [number, number, number];
  size: [number, number, number];
  color: string;
  colorDim: string;
};

function computeClusters(
  resources: Resource[],
  positions: Map<string, [number, number, number]>,
): ClusterData[] {
  const groups = new Map<string, { minX: number; maxX: number; minZ: number; maxZ: number; count: number }>();

  for (const r of resources) {
    const pos = positions.get(r.id);
    if (!pos) continue;
    const [x, , z] = pos;
    const g = groups.get(r.type);
    if (g) {
      g.minX = Math.min(g.minX, x);
      g.maxX = Math.max(g.maxX, x);
      g.minZ = Math.min(g.minZ, z);
      g.maxZ = Math.max(g.maxZ, z);
      g.count++;
    } else {
      groups.set(r.type, { minX: x, maxX: x, minZ: z, maxZ: z, count: 1 });
    }
  }

  const clusters: ClusterData[] = [];
  for (const [type, g] of groups) {
    const x0 = g.minX - PAD;
    const x1 = g.maxX + PAD;
    const z0 = g.minZ - PAD;
    const z1 = g.maxZ + PAD;

    // 8 corners of the AABB
    const corners = [
      new THREE.Vector3(x0, BOX_Y_MIN, z0),
      new THREE.Vector3(x1, BOX_Y_MIN, z0),
      new THREE.Vector3(x0, BOX_Y_MIN, z1),
      new THREE.Vector3(x1, BOX_Y_MIN, z1),
      new THREE.Vector3(x0, BOX_Y_MAX, z0),
      new THREE.Vector3(x1, BOX_Y_MAX, z0),
      new THREE.Vector3(x0, BOX_Y_MAX, z1),
      new THREE.Vector3(x1, BOX_Y_MAX, z1),
    ];

    const cx = (g.minX + g.maxX) / 2;
    const cz = (g.minZ + g.maxZ) / 2;
    const tk = THEME_KEYS[type] ?? type;
    const c = (RESOURCE_COLORS[tk] ?? DEFAULT_RESOURCE_COLORS).trace;
    clusters.push({
      type,
      count: g.count,
      corners,
      center: [cx, 0, cz],
      size: [x1 - x0, BOX_Y_MAX - BOX_Y_MIN, z1 - z0],
      color: colorCSS(c, 0.7),
      colorDim: colorCSS(c, 0.35),
    });
  }
  return clusters;
}

type Props = {
  resources: Resource[];
  positions: Map<string, [number, number, number]>;
  onClusterClick?: (center: [number, number, number], size: [number, number, number]) => void;
};

export function ClusterLabels({ resources, positions, onClusterClick }: Props) {
  const { camera, gl } = useThree();
  const clusters = useMemo(() => computeClusters(resources, positions), [resources, positions]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<{ box: HTMLDivElement; label: HTMLDivElement }[]>([]);
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  // Create container
  useEffect(() => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden;';
    document.body.appendChild(container);
    containerRef.current = container;
    return () => { document.body.removeChild(container); };
  }, []);

  // Sync DOM elements with clusters
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const elements: { box: HTMLDivElement; label: HTMLDivElement }[] = [];

    for (const cluster of clusters) {
      const displayName = DISPLAY_NAMES[cluster.type] ?? cluster.type.toUpperCase();

      const box = document.createElement('div');
      box.style.cssText = `
        position:absolute;
        border:1px solid ${cluster.colorDim};
        pointer-events:none;
      `;

      const label = document.createElement('div');
      label.style.cssText = `
        position:absolute;
        top:-1px;
        left:-1px;
        transform:translateY(-100%);
        display:flex;
        align-items:center;
        gap:0;
        pointer-events:none;
      `;

      // Colored tab with text — clickable to focus camera on cluster
      const tab = document.createElement('div');
      tab.style.cssText = `
        background:${cluster.color};
        color:#000;
        font-family:'${FONT_NAME}',monospace;
        font-size:30px;
        padding:4px 10px;
        white-space:nowrap;
        line-height:1.4;
        letter-spacing:0.5px;
        pointer-events:auto;
        cursor:pointer;
      `;
      tab.textContent = `${displayName} ${cluster.count}`;
      const clusterCenter = cluster.center;
      const clusterSize = cluster.size;
      tab.addEventListener('click', () => {
        onClusterClickRef.current?.(clusterCenter, clusterSize);
      });

      label.appendChild(tab);
      box.appendChild(label);
      container.appendChild(box);
      elements.push({ box, label });
    }

    elementsRef.current = elements;

    // Force repaint once font loads
    fontPromise.then(() => {
      for (const el of elements) {
        const tab = el.label.firstElementChild as HTMLDivElement | null;
        if (tab) tab.style.fontFamily = `'${FONT_NAME}',monospace`;
      }
    });
  }, [clusters]);

  const _v = useRef(new THREE.Vector3());

  useFrame(() => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const el = elementsRef.current[i];
      if (!el) continue;

      let minSX = Infinity, maxSX = -Infinity;
      let minSY = Infinity, maxSY = -Infinity;
      let anyBehind = false;

      for (const corner of cluster.corners) {
        _v.current.copy(corner).project(camera);
        if (_v.current.z > 1) { anyBehind = true; break; }
        const sx = ((_v.current.x + 1) / 2) * rect.width + rect.left;
        const sy = ((-_v.current.y + 1) / 2) * rect.height + rect.top;
        minSX = Math.min(minSX, sx);
        maxSX = Math.max(maxSX, sx);
        minSY = Math.min(minSY, sy);
        maxSY = Math.max(maxSY, sy);
      }

      const w = maxSX - minSX;
      const h = maxSY - minSY;

      if (anyBehind || w < 1 || h < 1) {
        el.box.style.display = 'none';
        continue;
      }

      el.box.style.display = '';
      el.box.style.left = `${minSX}px`;
      el.box.style.top = `${minSY}px`;
      el.box.style.width = `${w}px`;
      el.box.style.height = `${h}px`;
    }
  });

  // Only render when there are multiple types
  if (clusters.length <= 1) return null;
  return null;
}
