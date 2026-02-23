import { useThemedComponents } from '../../theme/ThemeProvider';

type EffectsPanelProps = {
  effects: string[];
  labels: Record<string, string>;
  hoverToggles: Record<string, boolean>;
  selectToggles: Record<string, boolean>;
  onToggleHover: (key: string) => void;
  onToggleSelect: (key: string) => void;
};

export function EffectsPanel({ effects, labels, hoverToggles, selectToggles, onToggleHover, onToggleSelect }: EffectsPanelProps) {
  const { Panel, EffectRow } = useThemedComponents();
  return (
    <Panel title="Effects" collapsible>
      {[...effects].sort((a, b) => labels[a].localeCompare(labels[b])).map(key => (
        <EffectRow
          key={key}
          label={labels[key]}
          hover={hoverToggles[key]}
          selected={selectToggles[key]}
          onToggleHover={() => onToggleHover(key)}
          onToggleSelected={() => onToggleSelect(key)}
        />
      ))}
    </Panel>
  );
}
