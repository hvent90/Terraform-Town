import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import { uniform, float, vec2, vec3, max, screenUV, reflector, positionWorld, texture } from 'three/tsl';
import {
  waterFalloff, waterTurbulence,
  uFalloffSpread, uFalloffBrightness, uTurbulenceSpeed, uTurbulenceStrength,
} from '../shaders/water.tsl';
import { useSceneContext } from '../../../shared/context';

// Scratch vectors (mirrors ReflectorNode.js module-level vars)
const _reflectorWorldPosition = new THREE.Vector3();
const _cameraWorldPosition = new THREE.Vector3();
const _rotationMatrix = new THREE.Matrix4();
const _normal = new THREE.Vector3();
const _view = new THREE.Vector3();
const _lookAtPosition = new THREE.Vector3();
const _target = new THREE.Vector3();
const _size = new THREE.Vector2();

let _inReflector = false;

/**
 * Monkey-patch ReflectorBaseNode.updateBefore to skip the oblique clip plane,
 * which is broken on WebGPU. Everything else is identical to the original.
 */
function patchReflectorClipping(reflectorNode: any, depthTex: THREE.DepthTexture) {
  const baseNode = reflectorNode._reflectorBaseNode;

  baseNode.updateBefore = function (frame: any) {
    if (this.bounces === false && _inReflector) return;
    _inReflector = true;

    const { scene, camera, renderer, material } = frame;
    const { target } = this;

    const virtualCamera = this.getVirtualCamera(camera);
    const renderTarget = this.getRenderTarget(virtualCamera);

    // Attach depth texture so we can read reflected object distance
    if (!renderTarget.depthTexture) {
      renderTarget.depthTexture = depthTex;
    }

    renderer.getDrawingBufferSize(_size);
    this._updateResolution(renderTarget, renderer);

    // --- Mirror camera (lines 229–269 from ReflectorNode.js) ---
    _reflectorWorldPosition.setFromMatrixPosition(target.matrixWorld);
    _cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    _rotationMatrix.extractRotation(target.matrixWorld);
    _normal.set(0, 0, 1).applyMatrix4(_rotationMatrix);

    _view.subVectors(_reflectorWorldPosition, _cameraWorldPosition);
    if (_view.dot(_normal) > 0) { _inReflector = false; return; }

    _view.reflect(_normal).negate().add(_reflectorWorldPosition);

    _rotationMatrix.extractRotation(camera.matrixWorld);

    _lookAtPosition.set(0, 0, -1).applyMatrix4(_rotationMatrix).add(_cameraWorldPosition);

    _target.subVectors(_reflectorWorldPosition, _lookAtPosition)
      .reflect(_normal).negate().add(_reflectorWorldPosition);

    virtualCamera.coordinateSystem = camera.coordinateSystem;
    virtualCamera.position.copy(_view);
    virtualCamera.up.set(0, 1, 0).applyMatrix4(_rotationMatrix).reflect(_normal);
    virtualCamera.lookAt(_target);

    virtualCamera.near = camera.near;
    virtualCamera.far = camera.far;
    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    // SKIP oblique clip plane (broken on WebGPU)

    // --- Render reflection (lines 298–321 from ReflectorNode.js) ---
    this.textureNode.value = renderTarget.texture;

    material.visible = false;
    const currentRenderTarget = renderer.getRenderTarget();
    const currentMRT = renderer.getMRT();
    renderer.setMRT(null);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, virtualCamera);
    renderer.setMRT(currentMRT);
    renderer.setRenderTarget(currentRenderTarget);
    material.visible = true;

    _inReflector = false;
  };
}

// Uniforms updated per frame from waterRef
const uReflectionIntensity = uniform(0.6);
const uBlurRadius = uniform(0.008);
const uCameraHeight = uniform(1.0);

export function ReflectiveGround() {
  const { scene } = useThree();
  const { waterRef } = useSceneContext();

  const { groundMesh, uTime, reflection } = useMemo(() => {
    const uTime = uniform(0);

    const geometry = new THREE.PlaneGeometry(500, 500);
    const mat = new MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.depthWrite = false;

    // Create depth texture for reading reflected object distance from surface
    const reflDepthTex = new THREE.DepthTexture(1, 1);
    const depthTexNode = texture(reflDepthTex);

    const reflection = reflector({ resolution: 0.5 });
    reflection.target.rotateX(-Math.PI / 2);

    // Patch out broken oblique clipping + wire up depth texture
    patchReflectorClipping(reflection, reflDepthTex);

    // Water turbulence UV offset
    const worldXZ = vec2(positionWorld.x, positionWorld.z);
    const turb = waterTurbulence(worldXZ, uTime);
    const baseUV = screenUV.flipX().add(turb);

    // Keep reflection in the node graph (triggers its updateBefore for rendering)
    reflection.uvNode = baseUV;

    // Depth-based blur radius: objects near ground = sharp, far above = blurry
    // Linearize perspective depth: linDepth = near*far / (far - d*(far-near))
    const depthVal = depthTexNode.uv(baseUV);
    const linDepth = float(10.0).div(float(100.0).sub(depthVal.mul(99.9)));
    const distFromGround = linDepth.sub(uCameraHeight).max(float(0));
    // 30% base blur + 70% depth-scaled (so ground still has some softness)
    const blurT = float(0.3).add(distFromGround.clamp(0, 1).mul(0.7));
    const blur = uBlurRadius.mul(blurT);

    // 13-tap Poisson disk blur — irregular offsets prevent ghost copies
    const reflTex = (reflection as any)._reflectorBaseNode.textureNode;
    const tap = (dx: number, dy: number) =>
      reflTex.uv(baseUV.add(vec2(blur.mul(dx), blur.mul(dy))));

    const blurred = reflection // center tap (keeps updateBefore in render graph)
      .add(tap(-0.326, -0.406)).add(tap(-0.840, -0.074)).add(tap(-0.696, 0.457))
      .add(tap(-0.203, 0.621)).add(tap( 0.962, -0.195)).add(tap( 0.473, -0.480))
      .add(tap( 0.519,  0.767)).add(tap( 0.185, -0.893)).add(tap( 0.507,  0.064))
      .add(tap( 0.896,  0.412)).add(tap(-0.322, -0.933)).add(tap(-0.792, -0.598))
      .div(13.0);

    const falloff = waterFalloff();
    const base = vec3(0.03, 0.02, 0.01).mul(falloff);
    const reflColor = blurred.mul(uReflectionIntensity);

    // Reflection NOT attenuated by falloff — visible wherever surface is visible
    mat.colorNode = max(base, reflColor);

    // Opacity: ambient glow falloff OR reflection content (whichever is brighter)
    const reflLuma = reflColor.r.mul(0.33).add(reflColor.g.mul(0.34)).add(reflColor.b.mul(0.33));
    mat.opacityNode = max(falloff, reflLuma.clamp(0, 1));

    const groundMesh = new THREE.Mesh(geometry, mat);
    groundMesh.rotateX(-Math.PI / 2);

    return { groundMesh, uTime, reflection };
  }, []);

  useMemo(() => {
    scene.add(reflection.target);
  }, [scene, reflection]);

  useEffect(() => {
    return () => { scene.remove(reflection.target); };
  }, [scene, reflection]);

  useFrame(({ clock, camera }) => {
    uTime.value = clock.getElapsedTime();
    uCameraHeight.value = Math.abs(camera.position.y);

    // Sync water uniforms from context
    const w = waterRef.current;
    uReflectionIntensity.value = w.reflectionIntensity;
    uBlurRadius.value = w.reflectionBlur;
    uFalloffSpread.value = w.falloffSpread;
    uFalloffBrightness.value = w.falloffBrightness;
    uTurbulenceSpeed.value = w.turbulenceSpeed;
    uTurbulenceStrength.value = w.turbulenceStrength;
  });

  return <primitive object={groundMesh} />;
}
