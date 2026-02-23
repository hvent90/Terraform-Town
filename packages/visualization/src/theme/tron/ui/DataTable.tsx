import type { DataTableProps } from '../../../ui/components';
import { ui } from '../colors';

export function DataTable({ rows }: DataTableProps) {
  return (
    <table style={{ borderSpacing: 0, marginBottom: 20, width: '100%' }}>
      <tbody>
        {rows.map(({ key, value }) => (
          <tr key={key}>
            <td style={{
              color: ui.textDim,
              paddingRight: 14,
              whiteSpace: 'nowrap',
              verticalAlign: 'top',
              paddingBottom: 4,
            }}>{key}</td>
            <td style={{
              color: ui.textBright,
              whiteSpace: 'nowrap',
              paddingBottom: 4,
            }}>{Array.isArray(value) ? value.join(', ') : value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
