import { useTheme } from '../theme/ThemeProvider';

export function ResourceActor({ type }: { type: string }) {
  const theme = useTheme();
  const config = theme.resources[type];
  if (!config) return null;

  const { Mesh, effects } = config;

  return (
    <group>
      <Mesh />
      {Object.entries(effects).map(([state, fxList]) =>
        fxList!.map((Fx, i) => <Fx key={`${state}-${i}`} />)
      )}
    </group>
  );
}
