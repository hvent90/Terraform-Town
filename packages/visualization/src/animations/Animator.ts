import type { Animation, EasingFunction } from '../types';

export class Animator {
  private queue: Animation[] = [];
  private running: Map<string, Animation> = new Map();
  
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
  
  update(delta: number): void {
    // Process animations
    for (const [id, anim] of this.running) {
      // TODO: Apply animation progress
    }
  }
  
  private processQueue(): void {
    while (this.queue.length > 0) {
      const anim = this.queue.shift()!;
      if (anim.interruptible || !this.running.has(anim.id)) {
        this.running.set(anim.id, anim);
      }
    }
  }
}
