import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
      <Noise opacity={0.03} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
