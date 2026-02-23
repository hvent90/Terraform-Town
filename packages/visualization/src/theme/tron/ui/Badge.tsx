import type { BadgeProps } from '../../../ui/components';
import { ui } from '../colors';

export function Badge({ label, color, variant }: BadgeProps) {
  const dotColor = color ?? (variant === 'status' ? ui.statusOk : ui.accent);
  const glowColor = color
    ? undefined
    : variant === 'status' ? ui.statusOkGlow : ui.accentGlow;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: 3,
        background: dotColor,
        boxShadow: glowColor ? `0 0 6px ${glowColor}` : undefined,
        display: 'inline-block',
      }} />
      <span style={{ color: dotColor, fontSize: 11 }}>{label}</span>
    </span>
  );
}
