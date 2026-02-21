import MonacoEditor from '@monaco-editor/react';

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

export function Editor() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="hcl"
        theme="vs-dark"
        defaultValue={SAMPLE_HCL}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
