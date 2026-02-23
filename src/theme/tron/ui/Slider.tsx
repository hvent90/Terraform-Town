import type { SliderProps } from '../../../ui/components';
import { ui } from '../colors';

export function Slider({ label, value, min, max, step, defaultValue, onChange }: SliderProps) {
  const isDefault = value === defaultValue;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <span style={{ opacity: 0.7, whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            width: 80,
            accentColor: ui.accent,
            cursor: 'pointer',
          }}
        />
        <span style={{
          fontSize: 11,
          color: ui.textDim,
          fontFamily: ui.font,
          minWidth: 32,
          textAlign: 'right',
        }}>
          {value.toFixed(2)}
        </span>
        <button
          onClick={() => onChange(defaultValue)}
          title="Reset to default"
          style={{
            background: 'none',
            border: `1px solid ${isDefault ? ui.inactiveBorder : ui.accentBorder}`,
            borderRadius: ui.radiusSm,
            color: isDefault ? ui.textGhost : ui.accent,
            cursor: isDefault ? 'default' : 'pointer',
            fontSize: 11,
            padding: '1px 4px',
            lineHeight: 1,
            fontFamily: ui.font,
            opacity: isDefault ? 0.4 : 1,
            transition: 'opacity 0.2s, color 0.2s, border-color 0.2s',
          }}
        >
          ↺
        </button>
      </div>
    </div>
  );
}
