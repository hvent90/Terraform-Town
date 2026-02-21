// jsdom test setup for editor package
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Import WebGL context stub from visualization package (needed for Three.js integration tests)
import '../../visualization/tests/setup';
