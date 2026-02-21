import * as THREE from 'three';

const lightTextureCache = new Map<string, THREE.Texture>();

function getLightTexture(colorHex: string): THREE.Texture {
  if (lightTextureCache.has(colorHex)) {
    return lightTextureCache.get(colorHex)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (context) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    
    // Parse the hex string to a THREE.Color to normalize it
    const color = new THREE.Color(colorHex);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    // Center is intense, solid color
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
    // Midpoint starts fading fast
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.5)`);
    // Edge is completely transparent
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  lightTextureCache.set(colorHex, texture);
  
  return texture;
}

export function createFakeLight(color: string, size: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(size, size);
  const texture = getLightTexture(color);
  
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // Prevents Z-fighting and occluding other objects
    opacity: 0.8,      // Tune the max brightness
    color: new THREE.Color(0xffffff), // Don't tint the colored texture further
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Rotate to lie flat on the ground
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
