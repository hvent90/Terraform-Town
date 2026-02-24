import { useThemedComponents } from '../../theme/ThemeProvider';
import { ALL_LAYOUTS, LAYOUT_LABELS, type LayoutMode } from '../../layout';
import { ui } from '../../theme/tron/colors';

type LayoutPanelProps = {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
};

export function LayoutPanel({ value, onChange }: LayoutPanelProps) {
  const { Panel } = useThemedComponents();
  return (
    <Panel title="Layout" collapsible>
      {ALL_LAYOUTS.map(mode => (
        <div
          key={mode}
          onClick={() => onChange(mode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: value === mode ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            border: `1px solid ${value === mode ? ui.accentBorder : ui.inactiveBorder}`,
            background: value === mode ? ui.accent : 'transparent',
            boxShadow: value === mode ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>{LAYOUT_LABELS[mode]}</span>
        </div>
      ))}
    </Panel>
  );
}
