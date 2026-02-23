import { useThree, useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { PostProcessing as ThreePostProcessing } from 'three/webgpu';
import { pass, float, uniform, screenUV, Fn } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import { useSceneContext } from '../../shared/context';

export function PostProcessing() {
  const { gl: renderer, scene, camera } = useThree();
  const { postProcessRef } = useSceneContext();

  const { postProcessing, bloomPass, filmGrainU, vignetteDarknessU } = useMemo(() => {
    const pp = new ThreePostProcessing(renderer as any);

    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode('output');

    // Bloom
    const bp = bloom(scenePassColor);
    bp.threshold.value = 0.4;
    bp.strength.value = 0.8;
    bp.radius.value = 0.4;

    const withBloom = scenePassColor.add(bp);

    // Film grain with dynamic uniform
    const fgU = uniform(0.03);
    const withFilm = film(withBloom, fgU);

    // Custom vignette with dynamic uniform
    const vdU = uniform(1.1);
    const vignette = Fn(() => {
      const uv = screenUV;
      const dist = uv.sub(0.5).length();
      return float(1.0).sub(dist.sub(0.1).mul(vdU).clamp(0.0, 1.0));
    });

    pp.outputNode = withFilm.mul(vignette());
    return { postProcessing: pp, bloomPass: bp, filmGrainU: fgU, vignetteDarknessU: vdU };
  }, [renderer, scene, camera]);

  useFrame(() => {
    const pp = postProcessRef.current;
    bloomPass.threshold.value = pp.bloomThreshold;
    bloomPass.strength.value = pp.bloomStrength;
    bloomPass.radius.value = pp.bloomRadius;
    filmGrainU.value = pp.filmGrain;
    vignetteDarknessU.value = pp.vignetteDarkness;
    (renderer as any).toneMappingExposure = pp.exposure;

    postProcessing.render();
  }, 1);

  return null;
}
