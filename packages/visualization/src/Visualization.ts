import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import App from './App';
import type { TerraformState } from './types';

export class Visualization {
  private root: Root;
  private state: TerraformState | undefined;

  constructor(container: HTMLElement) {
    this.root = createRoot(container);
    this.render();
  }

  update(state: TerraformState): void {
    this.state = state;
    this.render();
  }

  destroy(): void {
    this.root.unmount();
  }

  private render(): void {
    this.root.render(createElement(App, { terraformState: this.state }));
  }
}
