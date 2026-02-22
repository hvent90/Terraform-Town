varying float vHeight;
uniform float uCubeY;
uniform float uCubeSize;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vHeight = (worldPos.y - (uCubeY - uCubeSize * 0.5)) / uCubeSize;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
