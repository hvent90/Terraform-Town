import { useThemedComponents } from '../../theme/ThemeProvider';
import { ALL_CAMERA_MODES, CAMERA_LABELS, type CameraMode } from '../../camera';
import { ui } from '../../theme/tron/colors';

type CameraPanelProps = {
  mode: CameraMode;
  onChangeMode: (mode: CameraMode) => void;
  isOrtho: boolean;
  onToggleOrtho: () => void;
  focusOnClick: boolean;
  onToggleFocusOnClick: () => void;
};

export function CameraPanel({ mode, onChangeMode, isOrtho, onToggleOrtho, focusOnClick, onToggleFocusOnClick }: CameraPanelProps) {
  const { Panel } = useThemedComponents();
  return (
    <Panel title="Camera" collapsible defaultCollapsed>
      {ALL_CAMERA_MODES.map(m => (
        <div
          key={m}
          onClick={() => onChangeMode(m)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: mode === m ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            border: `1px solid ${mode === m ? ui.accentBorder : ui.inactiveBorder}`,
            background: mode === m ? ui.accent : 'transparent',
            boxShadow: mode === m ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>{CAMERA_LABELS[m]}</span>
        </div>
      ))}

      <div style={{
        borderTop: `1px solid ${ui.borderSubtle}`,
        marginTop: 6,
        paddingTop: 6,
      }}>
        <div
          onClick={onToggleOrtho}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            border: `1px solid ${isOrtho ? ui.accentBorder : ui.inactiveBorder}`,
            background: isOrtho ? ui.accent : 'transparent',
            boxShadow: isOrtho ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>{isOrtho ? 'Orthographic' : 'Perspective'}</span>
        </div>
        <div
          onClick={onToggleFocusOnClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: 0.8,
            marginTop: 4,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            border: `1px solid ${focusOnClick ? ui.accentBorder : ui.inactiveBorder}`,
            background: focusOnClick ? ui.accent : 'transparent',
            boxShadow: focusOnClick ? `0 0 6px ${ui.accentGlow}` : 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }} />
          <span>Focus on Click</span>
        </div>
      </div>
    </Panel>
  );
}
