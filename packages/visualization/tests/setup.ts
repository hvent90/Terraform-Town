/**
 * Vitest setup: provide a minimal WebGL2 context stub for jsdom.
 * jsdom doesn't implement WebGL, but Three.js WebGLRenderer requires it.
 * Uses a Proxy to auto-stub any method Three.js calls on the GL context.
 */

// Map param values to return values for getParameter
const GL_PARAM_RETURNS: Record<number, any> = {
  0x1F02: 'WebGL 2.0 (Mock)',     // VERSION
  0x8B8C: 'WebGL GLSL ES 3.00',   // SHADING_LANGUAGE_VERSION
  0x1F01: 'Mock Renderer',         // RENDERER
  0x1F00: 'Mock',                   // VENDOR
  0x0D33: 16384,                    // MAX_TEXTURE_SIZE
  0x8869: 16,                       // MAX_VERTEX_ATTRIBS
  0x8872: 16,                       // MAX_TEXTURE_IMAGE_UNITS
  0x8B4D: 32,                       // MAX_COMBINED_TEXTURE_IMAGE_UNITS
  0x8B4C: 16,                       // MAX_VERTEX_TEXTURE_IMAGE_UNITS
  0x84E8: 16384,                    // MAX_RENDERBUFFER_SIZE
  0x851C: 16384,                    // MAX_CUBE_MAP_TEXTURE_SIZE
  0x0D3A: new Int32Array([16384, 16384]), // MAX_VIEWPORT_DIMS
  0x8DFC: 16,                       // MAX_VARYING_VECTORS
  0x8DFB: 256,                      // MAX_VERTEX_UNIFORM_VECTORS
  0x8DFD: 256,                      // MAX_FRAGMENT_UNIFORM_VECTORS
  0x8D57: 4,                        // MAX_SAMPLES
  0x8073: 2048,                     // MAX_3D_TEXTURE_SIZE
  0x88FF: 256,                      // MAX_ARRAY_TEXTURE_LAYERS
  0x8824: 8,                        // MAX_DRAW_BUFFERS
  0x8CDF: 8,                        // MAX_COLOR_ATTACHMENTS
  0x8A2F: 72,                       // MAX_UNIFORM_BUFFER_BINDINGS
  0x8A30: 65536,                    // MAX_UNIFORM_BLOCK_SIZE
  0x8A34: 256,                      // UNIFORM_BUFFER_OFFSET_ALIGNMENT
  0x0CF5: 4,                        // UNPACK_ALIGNMENT
  0x0D05: 4,                        // PACK_ALIGNMENT
};

// Methods that return specific non-null values
const METHOD_RETURNS: Record<string, (...args: any[]) => any> = {
  createBuffer: () => ({}),
  createFramebuffer: () => ({}),
  createProgram: () => ({}),
  createRenderbuffer: () => ({}),
  createShader: () => ({}),
  createTexture: () => ({}),
  createVertexArray: () => ({}),
  createQuery: () => ({}),
  createSampler: () => ({}),
  createTransformFeedback: () => ({}),
  fenceSync: () => ({}),
  getAttribLocation: () => 0,
  getUniformLocation: () => ({}),
  getUniformBlockIndex: () => 0,
  getFragDataLocation: () => 0,
  getShaderParameter: () => true,
  getProgramParameter: (_prog: any, pname: number) => {
    if (pname === 0x8B89) return 0; // ACTIVE_ATTRIBUTES
    if (pname === 0x8B86) return 0; // ACTIVE_UNIFORMS
    return true;
  },
  getProgramInfoLog: () => '',
  getShaderInfoLog: () => '',
  getError: () => 0,
  checkFramebufferStatus: () => 0x8CD5, // FRAMEBUFFER_COMPLETE
  getContextAttributes: () => ({
    alpha: true,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  }),
  getExtension: (name: string) => {
    const supported = [
      'EXT_color_buffer_float',
      'EXT_color_buffer_half_float',
      'OES_texture_float_linear',
      'EXT_float_blend',
    ];
    return supported.includes(name) ? {} : null;
  },
  getSupportedExtensions: () => [
    'EXT_color_buffer_float',
    'EXT_color_buffer_half_float',
    'OES_texture_float_linear',
    'EXT_float_blend',
  ],
  getParameter: (param: number) => {
    if (param in GL_PARAM_RETURNS) return GL_PARAM_RETURNS[param];
    return 0;
  },
  getShaderPrecisionFormat: () => ({
    rangeMin: 127,
    rangeMax: 127,
    precision: 23,
  }),
  getActiveAttrib: () => ({ name: 'a', type: 0x1406, size: 1 }),
  getActiveUniform: () => ({ name: 'u', type: 0x1406, size: 1 }),
  isContextLost: () => false,
};

// WebGL2 constants used by Three.js (property access on gl context)
const GL_CONSTANTS: Record<string, number> = {
  VERSION: 0x1F02, SHADING_LANGUAGE_VERSION: 0x8B8C,
  RENDERER: 0x1F01, VENDOR: 0x1F00,
  MAX_TEXTURE_SIZE: 0x0D33, MAX_VERTEX_ATTRIBS: 0x8869,
  MAX_TEXTURE_IMAGE_UNITS: 0x8872, MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C, MAX_RENDERBUFFER_SIZE: 0x84E8,
  MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C, MAX_VIEWPORT_DIMS: 0x0D3A,
  MAX_VARYING_VECTORS: 0x8DFC, MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
  MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD, MAX_SAMPLES: 0x8D57,
  MAX_3D_TEXTURE_SIZE: 0x8073, MAX_ARRAY_TEXTURE_LAYERS: 0x88FF,
  MAX_DRAW_BUFFERS: 0x8824, MAX_COLOR_ATTACHMENTS: 0x8CDF,
  MAX_UNIFORM_BUFFER_BINDINGS: 0x8A2F, MAX_UNIFORM_BLOCK_SIZE: 0x8A30,
  UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8A34,
  DEPTH_TEST: 0x0B71, STENCIL_TEST: 0x0B90, BLEND: 0x0BE2,
  CULL_FACE: 0x0B44, SCISSOR_TEST: 0x0C11, POLYGON_OFFSET_FILL: 0x8037,
  SAMPLE_COVERAGE: 0x80A0, SAMPLE_ALPHA_TO_COVERAGE: 0x809E, DITHER: 0x0BD0,
  TEXTURE_2D: 0x0DE1, TEXTURE_CUBE_MAP: 0x8513, TEXTURE_3D: 0x806F,
  TEXTURE_2D_ARRAY: 0x8C1A,
  FRAMEBUFFER: 0x8D40, RENDERBUFFER: 0x8D41,
  DRAW_FRAMEBUFFER: 0x8CA9, READ_FRAMEBUFFER: 0x8CA8,
  ARRAY_BUFFER: 0x8892, ELEMENT_ARRAY_BUFFER: 0x8893,
  UNIFORM_BUFFER: 0x8A11, TRANSFORM_FEEDBACK_BUFFER: 0x8C8E,
  PIXEL_PACK_BUFFER: 0x88EB, PIXEL_UNPACK_BUFFER: 0x88EC,
  COPY_READ_BUFFER: 0x8F36, COPY_WRITE_BUFFER: 0x8F37,
  TEXTURE0: 0x84C0, BACK: 0x0405, FRONT: 0x0404,
  FRONT_AND_BACK: 0x0408, CW: 0x0900, CCW: 0x0901,
  COLOR_BUFFER_BIT: 0x4000, DEPTH_BUFFER_BIT: 0x0100, STENCIL_BUFFER_BIT: 0x0400,
  FLOAT: 0x1406, UNSIGNED_BYTE: 0x1401, UNSIGNED_SHORT: 0x1403,
  UNSIGNED_INT: 0x1405, BYTE: 0x1400, SHORT: 0x1402, INT: 0x1404,
  HALF_FLOAT: 0x140B,
  RGBA: 0x1908, RGB: 0x1907, ALPHA: 0x1906, LUMINANCE: 0x1909,
  LUMINANCE_ALPHA: 0x190A, DEPTH_COMPONENT: 0x1902, DEPTH_STENCIL: 0x84F9,
  RED: 0x1903, RG: 0x8227,
  RGBA8: 0x8058, RGB8: 0x8051, RGBA4: 0x8056, RGB565: 0x8D62, RGB5_A1: 0x8057,
  R8: 0x8229, RG8: 0x822B, R16F: 0x822D, R32F: 0x822E,
  RG16F: 0x822F, RG32F: 0x8230, RGBA16F: 0x881A, RGBA32F: 0x8814,
  RGB16F: 0x881B, RGB32F: 0x8815,
  R11F_G11F_B10F: 0x8C3A, RGB9_E5: 0x8C3D,
  SRGB8: 0x8C41, SRGB8_ALPHA8: 0x8C43,
  DEPTH_COMPONENT16: 0x81A5, DEPTH_COMPONENT24: 0x81A6,
  DEPTH_COMPONENT32F: 0x8CAC, DEPTH24_STENCIL8: 0x88F0, DEPTH32F_STENCIL8: 0x8CAD,
  NEAREST: 0x2600, LINEAR: 0x2601,
  NEAREST_MIPMAP_NEAREST: 0x2700, LINEAR_MIPMAP_NEAREST: 0x2701,
  NEAREST_MIPMAP_LINEAR: 0x2702, LINEAR_MIPMAP_LINEAR: 0x2703,
  TEXTURE_MAG_FILTER: 0x2800, TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, TEXTURE_WRAP_R: 0x8072,
  CLAMP_TO_EDGE: 0x812F, MIRRORED_REPEAT: 0x8370, REPEAT: 0x2901,
  TEXTURE_COMPARE_MODE: 0x884C, TEXTURE_COMPARE_FUNC: 0x884D,
  COMPARE_REF_TO_TEXTURE: 0x884E,
  VERTEX_SHADER: 0x8B31, FRAGMENT_SHADER: 0x8B30,
  COMPILE_STATUS: 0x8B81, LINK_STATUS: 0x8B82, VALIDATE_STATUS: 0x8B83,
  ACTIVE_UNIFORMS: 0x8B86, ACTIVE_ATTRIBUTES: 0x8B89,
  TRIANGLES: 0x0004, TRIANGLE_STRIP: 0x0005, TRIANGLE_FAN: 0x0006,
  LINES: 0x0001, LINE_STRIP: 0x0003, LINE_LOOP: 0x0002, POINTS: 0x0000,
  STATIC_DRAW: 0x88E4, DYNAMIC_DRAW: 0x88E8, STREAM_DRAW: 0x88E0,
  FUNC_ADD: 0x8006, FUNC_SUBTRACT: 0x800A, FUNC_REVERSE_SUBTRACT: 0x800B,
  MIN: 0x8007, MAX: 0x8008, ZERO: 0, ONE: 1,
  SRC_COLOR: 0x0300, ONE_MINUS_SRC_COLOR: 0x0301,
  SRC_ALPHA: 0x0302, ONE_MINUS_SRC_ALPHA: 0x0303,
  DST_ALPHA: 0x0304, ONE_MINUS_DST_ALPHA: 0x0305,
  DST_COLOR: 0x0306, ONE_MINUS_DST_COLOR: 0x0307,
  LESS: 0x0201, LEQUAL: 0x0203, EQUAL: 0x0202, GREATER: 0x0204,
  GEQUAL: 0x0206, NOTEQUAL: 0x0205, ALWAYS: 0x0207, NEVER: 0x0200,
  KEEP: 0x1E00, REPLACE: 0x1E01, INCR: 0x1E02, DECR: 0x1E03,
  INCR_WRAP: 0x8507, DECR_WRAP: 0x8508, INVERT: 0x150A,
  UNPACK_ALIGNMENT: 0x0CF5, PACK_ALIGNMENT: 0x0D05,
  UNPACK_FLIP_Y_WEBGL: 0x9240, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
  UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
  NO_ERROR: 0, INVALID_ENUM: 0x0500, INVALID_VALUE: 0x0501,
  INVALID_OPERATION: 0x0502, OUT_OF_MEMORY: 0x0505,
  FRAMEBUFFER_COMPLETE: 0x8CD5,
  COLOR_ATTACHMENT0: 0x8CE0, DEPTH_ATTACHMENT: 0x8D00,
  STENCIL_ATTACHMENT: 0x8D20, DEPTH_STENCIL_ATTACHMENT: 0x821A,
  TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
  RED_INTEGER: 0x8D94, RG_INTEGER: 0x8228, RGB_INTEGER: 0x8D98, RGBA_INTEGER: 0x8D99,
  R8I: 0x8231, R8UI: 0x8232, R16I: 0x8233, R16UI: 0x8234,
  R32I: 0x8235, R32UI: 0x8236, RG8I: 0x8237, RG8UI: 0x8238,
  RG16I: 0x8239, RG16UI: 0x823A, RG32I: 0x823B, RG32UI: 0x823C,
  RGBA8I: 0x8D8E, RGBA8UI: 0x8D7C, RGBA16I: 0x8D88, RGBA16UI: 0x8D76,
  RGBA32I: 0x8D82, RGBA32UI: 0x8D70,
};

function createWebGLContext() {
  // Base object: data properties + all WebGL constants
  const target: Record<string, any> = {
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    drawingBufferColorSpace: 'srgb',
    canvas: { width: 800, height: 600 },
    ...GL_CONSTANTS,
  };

  // Use Proxy so any unknown property access returns a no-op function
  // (handles WebGL2 methods like texImage3D, texStorage2D, etc.)
  return new Proxy(target, {
    get(_target, prop) {
      const key = String(prop);

      // Known data properties and constants
      if (key in _target) return _target[key];

      // Known method overrides
      if (key in METHOD_RETURNS) return METHOD_RETURNS[key];

      // Any other property: return a no-op function
      return () => null;
    },
  });
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  ...args: any[]
) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return createWebGLContext() as any;
  }
  return originalGetContext.call(this, contextId, ...args);
} as any;

// Stub requestAnimationFrame if not present
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  };
  globalThis.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}
