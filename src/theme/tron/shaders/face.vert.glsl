uniform float uSeparation;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  worldPos.xyz += worldNormal * uSeparation;
  vWorldPos = worldPos.xyz;
  vWorldNormal = worldNormal;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
