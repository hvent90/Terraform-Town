interface ToolbarProps {
  onPlan?: () => void;
  onApply?: () => void;
  onDestroy?: () => void;
}

export function Toolbar({ onPlan, onApply, onDestroy }: ToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        padding: "8px 12px",
        background: "#1e1e1e",
        borderBottom: "1px solid #333",
      }}
    >
      <button data-testid="btn-plan" onClick={onPlan} style={btnStyle}>
        Plan
      </button>
      <button data-testid="btn-apply" onClick={onApply} style={btnStyle}>
        Apply
      </button>
      <button data-testid="btn-destroy" onClick={onDestroy} style={{ ...btnStyle, color: "#f44" }}>
        Destroy
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#333",
  color: "#ccc",
  border: "1px solid #555",
  padding: "6px 16px",
  cursor: "pointer",
  fontSize: "13px",
};
