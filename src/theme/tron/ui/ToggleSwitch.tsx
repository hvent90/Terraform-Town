import type { ToggleSwitchProps } from '../../../ui/components';
import { ui } from '../colors';

export function ToggleSwitch({ value, onChange, label }: ToggleSwitchProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <span style={{
        opacity: value ? 1 : 0.5,
        transition: 'opacity 0.2s',
      }}>
        {label}
      </span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 32, height: 16, borderRadius: 8,
          background: value ? ui.accentBg : ui.inactiveBg,
          border: `1px solid ${value ? ui.accentBorder : ui.inactiveBorder}`,
          position: 'relative', cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 10, height: 10, borderRadius: 5,
          background: value ? ui.accent : ui.inactiveKnob,
          position: 'absolute', top: 2,
          left: value ? 19 : 2,
          transition: 'left 0.2s ease, background 0.2s',
          boxShadow: value ? `0 0 6px ${ui.accentGlow}` : 'none',
        }} />
      </div>
    </div>
  );
}
