import type { EffectRowProps } from '../../../ui/components';
import { ui } from '../colors';

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 22, height: 18, borderRadius: 9,
        border: `1px solid ${active ? ui.accentBorder : ui.inactiveBorder}`,
        background: active ? ui.accentBg : ui.inactiveBg,
        color: active ? ui.accent : ui.textGhost,
        fontSize: 9, fontFamily: ui.font, fontWeight: 600,
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 6px ${ui.accentGlow}` : 'none',
      }}
    >
      {label}
    </button>
  );
}

export function EffectRow({ label, hover, selected, onToggleHover, onToggleSelected }: EffectRowProps) {
  const anyActive = hover || selected;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <span style={{
        opacity: anyActive ? 1 : 0.5,
        transition: 'opacity 0.2s',
        flex: 1, minWidth: 0,
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <Pill label="H" active={hover} onClick={onToggleHover} />
        <Pill label="S" active={selected} onClick={onToggleSelected} />
      </div>
    </div>
  );
}
