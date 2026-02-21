import type { ReactNode } from "react";

interface SplitLayoutProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        data-testid="editor-panel"
        style={{ width: "50%", height: "100%", overflow: "hidden" }}
      >
        {left}
      </div>
      <div
        data-testid="visualization-panel"
        style={{ width: "50%", height: "100%", overflow: "hidden" }}
      >
        {right}
      </div>
    </div>
  );
}
