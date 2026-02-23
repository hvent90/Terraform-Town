import type { SectionHeaderProps } from '../../../ui/components';
import { ui } from '../colors';

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div style={{
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: ui.textMuted,
      marginBottom: 10,
    }}>
      {title}
    </div>
  );
}
