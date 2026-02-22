import { useThemedComponents } from '../../theme/ThemeProvider';

type CameraToggleProps = {
  isOrtho: boolean;
  onToggle: () => void;
};

export function CameraToggle({ isOrtho, onToggle }: CameraToggleProps) {
  const { KeyHint } = useThemedComponents();

  return (
    <KeyHint
      keyName="C"
      label="Camera"
      active={isOrtho}
      onClick={onToggle}
    />
  );
}
