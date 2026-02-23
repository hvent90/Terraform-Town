export type SlidePanelSide = 'left' | 'right';
export type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  side?: SlidePanelSide;
  width?: number;
  children: React.ReactNode;
};
