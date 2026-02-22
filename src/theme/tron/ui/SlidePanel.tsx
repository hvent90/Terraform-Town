import type { SlidePanelProps } from '../../../ui/components';
import { ui } from '../colors';

export function SlidePanel({ open, onClose, side = 'right', width = 340, children }: SlidePanelProps) {
  const isRight = side === 'right';

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0, zIndex: 1000,
      [isRight ? 'right' : 'left']: 0,
      width,
      background: ui.surfaceDense,
      [isRight ? 'borderLeft' : 'borderRight']: `1px solid rgba(255, 150, 50, 0.2)`,
      backdropFilter: `blur(${ui.blurHeavy})`,
      fontFamily: ui.font,
      fontSize: 12,
      color: ui.text,
      transform: open
        ? 'translateX(0)'
        : `translateX(${isRight ? '100%' : '-100%'})`,
      transition: 'transform 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Close button */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${ui.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}>
        <div
          onClick={onClose}
          style={{
            cursor: 'pointer',
            color: ui.textFaint,
            fontSize: 18,
            lineHeight: 1,
            padding: '4px 8px',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = ui.textBright; }}
          onMouseLeave={e => { e.currentTarget.style.color = ui.textFaint; }}
        >
          &#x2715;
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
