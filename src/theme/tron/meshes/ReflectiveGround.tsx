import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { useMemo } from 'react';
import waterVert from '../shaders/water.vert.glsl';
import waterFrag from '../shaders/water.frag.glsl';

const waterShader = {
  name: 'WaterReflector',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: waterVert,
  fragmentShader: waterFrag,
};

export function ReflectiveGround() {
  const { size } = useThree();
  const dpr = Math.min(window.devicePixelRatio, 2);

  const reflector = useMemo(() => {
    const geo = new THREE.PlaneGeometry(80, 80);
    const ref = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: size.width * dpr,
      textureHeight: size.height * dpr,
      color: 0x888880,
      shader: waterShader,
    });
    ref.rotation.x = -Math.PI / 2;

    const origBeforeRender = ref.onBeforeRender as (renderer: any, scene: any, camera: any) => void;

    // Wrap origBeforeRender to hide objects flagged with excludeFromReflection
    const reflectionSafeRender = function (this: any, rend: any, scn: any, cam: any) {
      const hidden: THREE.Object3D[] = [];
      scn.traverse((obj: THREE.Object3D) => {
        if (obj.userData.excludeFromReflection && obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
      });
      origBeforeRender.call(this, rend, scn, cam);
      hidden.forEach((obj: THREE.Object3D) => { obj.visible = true; });
    };

    // @ts-ignore
    ref.onBeforeRender = function (rend: any, scn: any, cam: any) {
      if (!cam.isOrthographicCamera) {
        reflectionSafeRender.call(this, rend, scn, cam);
        return;
      }
      const savedProjection = cam.projectionMatrix.clone();
      const origRender = rend.render.bind(rend);
      rend.render = function (s: any, c: any) {
        c.projectionMatrix.copy(savedProjection);
        origRender(s, c);
      };
      reflectionSafeRender.call(this, rend, scn, cam);
      rend.render = origRender;
    };

    return ref;
  }, []);

  useFrame(({ clock }) => {
    (reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime();
  });

  return <primitive object={reflector} />;
}
