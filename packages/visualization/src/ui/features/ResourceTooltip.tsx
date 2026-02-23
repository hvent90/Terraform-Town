import { useThemedComponents } from '../../theme/ThemeProvider';

type ResourceTooltipProps = {
  label: string;
  status: string;
  statusColor?: string;
};

export function ResourceTooltip({ label, status, statusColor }: ResourceTooltipProps) {
  const { Tooltip, Badge } = useThemedComponents();

  return (
    <Tooltip>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
      <Badge label={status} color={statusColor} variant="status" />
    </Tooltip>
  );
}
