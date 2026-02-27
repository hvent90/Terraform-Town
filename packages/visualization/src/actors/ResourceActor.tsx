import { useTheme } from '../theme/ThemeProvider';
import { ResourceTypeContext } from '../shared/context';

export function ResourceActor({ type }: { type: string }) {
  const theme = useTheme();
  const config = theme.resources[type] ?? theme.resources['unknown'];
  if (!config) return null;

  const { effects } = config;

  return (
    <ResourceTypeContext.Provider value={type}>
      <group>
        {Object.entries(effects).map(([state, fxList]) =>
          fxList!.map((Fx, i) => <Fx key={`${state}-${i}`} />)
        )}
      </group>
    </ResourceTypeContext.Provider>
  );
}
