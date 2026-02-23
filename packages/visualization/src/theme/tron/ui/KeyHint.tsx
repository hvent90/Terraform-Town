import type { KeyHintProps } from '../../../ui/components';
import { ui } from '../colors';

export function KeyHint({ keyName, label, active, onClick }: KeyHintProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.color = ui.textBright; }}
      onMouseLeave={e => { e.currentTarget.style.color = active ? ui.text : ui.textDim; }}
      style={{
        background: 'none', border: 'none',
        color: active ? ui.text : ui.textDim,
        fontFamily: ui.font, fontSize: 13, cursor: 'pointer',
        transition: 'color 0.2s ease', display: 'inline-flex', alignItems: 'center',
      }}
    >
      <span style={{
        border: `1px solid ${ui.textFaint}`,
        borderRadius: 3, padding: '1px 5px',
        fontWeight: 'bold', marginRight: 6,
      }}>{keyName}</span>
      {label}
    </button>
  );
}
