import { useState } from 'react';
import type { PanelProps } from '../../../ui/components';
import { ui } from '../colors';

export function Panel({ title, collapsible, children }: PanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: ui.surface,
      border: `1px solid ${ui.border}`,
      borderRadius: ui.radiusMd,
      padding: collapsed ? '8px 14px' : '12px 16px',
      fontFamily: ui.font,
      fontSize: 12,
      color: ui.text,
      backdropFilter: `blur(${ui.blur})`,
      userSelect: 'none',
      minWidth: 180,
    }}>
      <div
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        style={{
          cursor: collapsible ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        {collapsible && (
          <span style={{
            display: 'inline-block',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: 10,
          }}>&#9660;</span>
        )}
        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>{title}</span>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {children}
        </div>
      )}
    </div>
  );
}
