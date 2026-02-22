import { useTheme } from '../theme/ThemeProvider';

export function GroundActor() {
  const theme = useTheme();
  const { Mesh, effects } = theme.ground;

  return (
    <group>
      <Mesh />
      {Object.entries(effects).map(([state, fxList]) =>
        fxList!.map((Fx, i) => <Fx key={`${state}-${i}`} />)
      )}
    </group>
  );
}
