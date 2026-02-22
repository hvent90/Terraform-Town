import { useThemedComponents } from '../../theme/ThemeProvider';

type EffectsPanelProps = {
  title: string;
  effects: string[];
  labels: Record<string, string>;
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export function EffectsPanel({ title, effects, labels, toggles, onToggle }: EffectsPanelProps) {
  const { Panel, ToggleSwitch } = useThemedComponents();
  return (
    <Panel title={title} collapsible>
      {effects.map(key => (
        <ToggleSwitch
          key={key}
          label={labels[key]}
          value={toggles[key]}
          onChange={() => onToggle(key)}
        />
      ))}
    </Panel>
  );
}
