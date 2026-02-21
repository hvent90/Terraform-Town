import * as THREE from 'three';
import { Visualization } from './Visualization';
import { defaultTheme } from './themes/default';

// Export main class and types
export { Visualization };
export { defaultTheme };
export type { Theme, Resource, Connection, TerraformState } from './types';

// Export primitives for custom use
export * from './resources/primitives';

// Export theme interface for custom themes
export type { Theme as ThemeInterface } from './themes/Theme';
