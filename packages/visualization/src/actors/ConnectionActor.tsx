import { useTheme } from '../theme/ThemeProvider';

export function ConnectionActor() {
  const theme = useTheme();
  const config = theme.connections;
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
