import { useThemedComponents } from '../../theme/ThemeProvider';

type ConnectionsPanelProps = {
  effects: string[];
  labels: Record<string, string>;
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export function ConnectionsPanel({ effects, labels, toggles, onToggle }: ConnectionsPanelProps) {
  const { Panel, ToggleSwitch } = useThemedComponents();
  return (
    <Panel title="Connections" collapsible defaultCollapsed>
      {effects.map(key => (
        <ToggleSwitch key={key} label={labels[key]} value={toggles[key]} onChange={() => onToggle(key)} />
      ))}
    </Panel>
  );
}
