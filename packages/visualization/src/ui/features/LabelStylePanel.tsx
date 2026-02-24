import { useThemedComponents } from '../../theme/ThemeProvider';
import { ui } from '../../theme/tron/colors';

type LabelStylePanelProps = {
  value: string;
  onChange: (style: string) => void;
  styles: string[];
  labels: Record<string, string>;
};

export function LabelStylePanel({ value, onChange, styles, labels }: LabelStylePanelProps) {
  const { Panel } = useThemedComponents();
  return (
    <Panel title="Labels" collapsible defaultCollapsed>
      {styles.map(style => (
        <div
          key={style}
          onClick={() => onChange(style)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: value === style ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            border: `1px solid ${value === style ? ui.accentBorder : ui.inactiveBorder}`,
            background: value === style ? ui.accent : 'transparent',
            boxShadow: value === style ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>{labels[style]}</span>
        </div>
      ))}
    </Panel>
  );
}
