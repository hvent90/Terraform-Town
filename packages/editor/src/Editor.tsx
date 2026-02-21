import MonacoEditor from "@monaco-editor/react";

const SAMPLE_HCL = `resource "aws_s3_bucket" "example" {
  bucket = "my-terraform-bucket"

  tags = {
    Name        = "My bucket"
    Environment = "Dev"
  }
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main"
  }
}
`;

interface EditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onSelectionChange?: (selectedText: string) => void;
}

export function Editor({ value, onChange, onSelectionChange }: EditorProps) {
  function handleMount(editor: any) {
    if (onSelectionChange) {
      editor.onDidChangeCursorSelection(() => {
        const selection = editor.getSelection();
        if (selection) {
          const text = editor.getModel()?.getValueInRange(selection) ?? "";
          onSelectionChange(text);
        }
      });
    }
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="hcl"
        theme="vs-dark"
        value={value ?? SAMPLE_HCL}
        onChange={onChange}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
