import type { TooltipProps } from '../../../ui/components';
import { ui } from '../colors';

export function Tooltip({ children }: TooltipProps) {
  return (
    <div style={{
      color: ui.text,
      fontFamily: ui.font,
      fontSize: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(10, 8, 5, 0.88)',
      border: `1px solid ${ui.border}`,
      borderRadius: ui.radiusSm,
      padding: '6px 12px',
      backdropFilter: `blur(${ui.blur})`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  );
}
