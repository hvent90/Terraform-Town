import type { Resource } from '../types';

export class ForceLayout {
  calculate(resources: Resource[]): Map<string, { x: number; y: number; z: number }> {
    const positions = new Map<string, { x: number; y: number; z: number }>();
    
    // Simple grid layout for now
    // TODO: Implement force-directed layout
    let x = 0;
    let z = 0;
    const spacing = 15;
    const cols = 5;
    
    for (const resource of resources) {
      positions.set(resource.id, { x, y: 0, z });
      x += spacing;
      if (x > cols * spacing) {
        x = 0;
        z += spacing;
      }
    }
    
    return positions;
  }
}
