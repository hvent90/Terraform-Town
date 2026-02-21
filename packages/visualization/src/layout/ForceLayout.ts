import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Resource, Connection } from '../types';

interface LayoutNode extends SimulationNodeDatum {
  id: string;
}

export class ForceLayout {
  calculate(
    resources: Resource[],
    connections: Connection[] = [],
  ): Map<string, { x: number; y: number; z: number }> {
    const positions = new Map<string, { x: number; y: number; z: number }>();

    if (resources.length === 0) return positions;

    if (resources.length === 1) {
      positions.set(resources[0].id, { x: 0, y: 0, z: 0 });
      return positions;
    }

    const nodes: LayoutNode[] = resources.map((r) => ({ id: r.id }));
    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

    // Build links from connections and parent-child relationships
    const links: SimulationLinkDatum<LayoutNode>[] = [];
    const seenLinks = new Set<string>();

    const addLink = (source: string, target: string) => {
      const key = [source, target].sort().join(':');
      if (seenLinks.has(key)) return;
      if (!nodeIndex.has(source) || !nodeIndex.has(target)) return;
      seenLinks.add(key);
      links.push({ source: nodeIndex.get(source)!, target: nodeIndex.get(target)! });
    };

    for (const conn of connections) {
      addLink(conn.from, conn.to);
    }

    for (const resource of resources) {
      if (resource.parentId && nodeIndex.has(resource.parentId)) {
        addLink(resource.id, resource.parentId);
      }
    }

    const simulation = forceSimulation<LayoutNode>(nodes)
      .force('charge', forceManyBody().strength(-200))
      .force('collide', forceCollide(8))
      .force('center', forceCenter(0, 0))
      .force(
        'link',
        forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(links).distance(20).strength(1),
      )
      .stop();

    // Run simulation to convergence
    const iterations = 300;
    for (let i = 0; i < iterations; i++) {
      simulation.tick();
    }

    for (const node of nodes) {
      positions.set(node.id, {
        x: node.x ?? 0,
        y: 0,
        z: node.y ?? 0, // d3-force works in 2D (x,y) → map to (x, 0, z) for 3D
      });
    }

    return positions;
  }
}
