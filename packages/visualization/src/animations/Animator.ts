import * as THREE from 'three';
import type { Animation, EasingFunction } from '../types';

interface RunningAnimation {
  animation: Animation;
  elapsed: number;
}

function applyEasing(t: number, easing: EasingFunction): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'easeIn':
    case 'easeInQuad':
      return t * t;
    case 'easeOut':
    case 'easeOutQuad':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case 'easeInOutCubic':
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    default:
      return t;
  }
}

export class Animator {
  private queue: Animation[] = [];
  private running: Map<string, RunningAnimation> = new Map();
  private meshLookup: (id: string) => THREE.Object3D | undefined;

  constructor(meshLookup: (id: string) => THREE.Object3D | undefined = () => undefined) {
    this.meshLookup = meshLookup;
  }

  play(animation: Animation): void {
    this.queue.push(animation);
    this.processQueue();
  }

  stop(id: string): void {
    this.running.delete(id);
  }

  stopAll(): void {
    this.queue = [];
    this.running.clear();
  }

  isRunning(id: string): boolean {
    return this.running.has(id);
  }

  update(delta: number): void {
    const completed: string[] = [];

    // Collect targets with active one-shot animations (create, destroy)
    const oneshotTargets = new Set<string>();
    for (const entry of this.running.values()) {
      if (entry.animation.type === 'create' || entry.animation.type === 'destroy') {
        const t = typeof entry.animation.target === 'string'
          ? entry.animation.target : entry.animation.target[0];
        oneshotTargets.add(t);
      }
    }

    for (const [id, entry] of this.running) {
      entry.elapsed += delta;

      const targetId = typeof entry.animation.target === 'string'
        ? entry.animation.target
        : entry.animation.target[0];

      // Skip pulse while one-shot animations are active for the same target
      if (entry.animation.type === 'pulse' && oneshotTargets.has(targetId)) {
        continue;
      }

      const progress = Math.min(entry.elapsed / entry.animation.duration, 1);
      const easedProgress = applyEasing(progress, entry.animation.easing);
      const mesh = this.meshLookup(targetId);

      if (mesh) {
        this.applyAnimation(mesh, entry.animation.type, easedProgress, entry.elapsed);
      }

      if (entry.animation.type === 'pulse') {
        continue;
      }

      if (progress >= 1) {
        if (entry.animation.type === 'destroy' && mesh) {
          mesh.parent?.remove(mesh);
        }
        completed.push(id);
      }
    }

    for (const id of completed) {
      this.running.delete(id);
    }
  }

  private applyAnimation(
    mesh: THREE.Object3D,
    type: Animation['type'],
    progress: number,
    elapsed: number,
  ): void {
    if (type === 'create') {
      const targetOpacity = mesh.userData.targetOpacity ?? 1;
      mesh.scale.setScalar(progress);
      if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.Material) {
        mesh.material.opacity = progress * targetOpacity;
        mesh.material.transparent = true;
      }
    } else if (type === 'destroy') {
      mesh.scale.setScalar(1 - progress);
      if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.Material) {
        mesh.material.opacity = 1 - progress;
        mesh.material.transparent = true;
      }
    } else if (type === 'pulse') {
      if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.Material) {
        const targetOpacity = mesh.userData.targetOpacity ?? 1;
        const pulse = Math.sin(elapsed * Math.PI * 2 / 1000) * 0.15;
        mesh.material.opacity = Math.max(0.1, targetOpacity + pulse);
        mesh.material.transparent = true;
      }
    }
  }

  private initAnimation(animation: Animation): void {
    const targetId = typeof animation.target === 'string'
      ? animation.target
      : animation.target[0];
    const mesh = this.meshLookup(targetId);
    if (!mesh) return;

    if (animation.type === 'create') {
      mesh.scale.setScalar(0);
      if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.Material) {
        mesh.material.opacity = 0;
        mesh.material.transparent = true;
      }
    }
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const anim = this.queue.shift()!;
      if (anim.interruptible || !this.running.has(anim.id)) {
        this.initAnimation(anim);
        this.running.set(anim.id, { animation: anim, elapsed: 0 });
      }
    }
  }
}
