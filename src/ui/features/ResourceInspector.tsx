import { useThemedComponents } from '../../theme/ThemeProvider';
import type { DataTableRow } from '../components';

type ResourceInspectorSection = {
  title: string;
  rows: DataTableRow[];
};

type ResourceInspectorProps = {
  open: boolean;
  onClose: () => void;
  resourceLabel: string;
  resourceName: string;
  status: string;
  statusColor?: string;
  subtitle?: string;
  sections: ResourceInspectorSection[];
  footer?: string;
};

export function ResourceInspector({
  open, onClose, resourceLabel, resourceName, status, statusColor,
  subtitle, sections, footer,
}: ResourceInspectorProps) {
  const { SlidePanel, Badge, SectionHeader, DataTable } = useThemedComponents();

  return (
    <SlidePanel open={open} onClose={onClose} side="right" width={340}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 150, 50, 0.15)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: 4 }}>
            {resourceLabel}
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>
            {resourceName}
          </div>
        </div>
        <div
          onClick={onClose}
          style={{
            cursor: 'pointer',
            opacity: 0.35,
            fontSize: 16,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 4,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.35'; }}
        >
          &#x2715;
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255, 150, 50, 0.1)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Badge label={status} color={statusColor} variant="status" />
        {subtitle && <span style={{ marginLeft: 'auto', opacity: 0.4 }}>{subtitle}</span>}
      </div>

      {/* Sections */}
      <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
        {sections.map(section => (
          <div key={section.title}>
            <SectionHeader title={section.title} />
            <DataTable rows={section.rows} />
          </div>
        ))}
      </div>

      {/* Footer */}
      {footer && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 150, 50, 0.1)', fontSize: 10, opacity: 0.35, flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </SlidePanel>
  );
}
