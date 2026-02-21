interface TerraformFile {
  name: string;
  path: string;
}

interface FileExplorerProps {
  files: TerraformFile[];
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

export function FileExplorer({ files, selectedFile, onSelect }: FileExplorerProps) {
  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#ccc",
        height: "100%",
        overflow: "auto",
        padding: "8px 0",
      }}
    >
      {files.map((file) => (
        <div
          key={file.path}
          data-testid="file-item"
          data-selected={file.path === selectedFile ? "true" : "false"}
          onClick={() => onSelect?.(file.path)}
          style={{
            padding: "4px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: file.path === selectedFile ? "#094771" : "transparent",
          }}
        >
          <span data-testid="file-icon" style={{ fontSize: "14px" }}>
            {file.name.endsWith(".tf") ? "HCL" : "TXT"}
          </span>
          <span>{file.name}</span>
        </div>
      ))}
    </div>
  );
}
