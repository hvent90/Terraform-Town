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
}

export function Editor({ value, onChange }: EditorProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="hcl"
        theme="vs-dark"
        value={value ?? SAMPLE_HCL}
        onChange={onChange}
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
