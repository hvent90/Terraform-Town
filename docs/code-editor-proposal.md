# Browser Code Editor Proposal for Terraform Town

## Recommendation: Monaco Editor

**Choice:** Monaco Editor (VS Code's core editor)

**Why:**
- Built-in HCL syntax highlighting (via TextMate grammar support)
- Industry standard, well-maintained
- Excellent TypeScript support
- Familiar UX (VS Code-like)
- Built-in file tree component available via `@monaco-editor/react`

**Alternatives considered:**

| Editor | Pros | Cons |
|--------|------|------|
| **Monaco** | HCL support, mature, VS Code UX | ~2MB bundle |
| **CodeMirror 6** | Lightweight (~300KB), extensible | HCL grammar needs custom work |
| **Ace** | Mature, many modes | Larger than CodeMirror, less modern API |

**Bundle size trade-off:** Monaco is larger but provides the best out-of-box experience for HCL. The 2MB cost is acceptable for a desktop-focused learning tool.

---

## Component Structure

```
src/editor/
├── Editor.tsx              # Main editor component
├── FileExplorer.tsx       # Left sidebar tree
├── useMonaco.ts           # Monaco loader hook
├── hcl-language.ts        # HCL language config
└── types.ts               # TypeScript types

packages/visualization/
├── src/
│   └── ...
├── index.html             # Updated layout
└── demo.html              # Demo with editor + viz
```

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [ Terraform Town ]                              [?][⚙️]    │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  📁 main/  │    // main.tf                                 │
│    📄 main │    resource "aws_vpc" "main" {                 │
│    📄 vars │      cidr_block = "10.0.0.0/16"               │
│            │    }                                          │
│            │                                                │
│            │                                                │
│            │                                                │
│            ├────────────────────────────────────────────────┤
│            │         [ 3D VISUALIZATION ]                   │
│            │                                                │
│            │         ┌─────┐   ┌───┐                        │
│            │         │ VPC │───│SG │                        │
│            │         └─────┘   └───┘                        │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│  [Apply] [Plan] [Destroy]          Status: Ready            │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Sketch

### 1. Install Monaco

```bash
bun add @monaco-editor/react monaco-editor
```

### 2. FileExplorer.tsx

```tsx
import { useState } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

const defaultFiles: FileNode[] = [
  { name: 'main.tf', type: 'file', content: 'resource "aws_vpc" "main" {...}' },
  { name: 'variables.tf', type: 'file', content: 'variable "region" {...}' },
];

export function FileExplorer({ onSelect }: { onSelect: (file: FileNode) => void }) {
  const [files] = useState(defaultFiles);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="file-explorer" style={{ 
      width: 200, 
      background: '#1a1a1a', 
      padding: 8,
      color: '#ccc',
      fontFamily: 'monospace',
    }}>
      {files.map(file => (
        <div
          key={file.name}
          onClick={() => { setSelected(file.name); onSelect(file); }}
          style={{
            padding: '4px 8px',
            cursor: 'pointer',
            background: selected === file.name ? '#333' : 'transparent',
            borderRadius: 4,
          }}
        >
          📄 {file.name}
        </div>
      ))}
    </div>
  );
}
```

### 3. Editor.tsx

```tsx
import Editor from '@monaco-editor/react';
import type { FileNode } from './types';

interface Props {
  file: FileNode | null;
  onChange: (content: string) => void;
}

export function CodeEditor({ file, onChange }: Props) {
  return (
    <Editor
      height="100%"
      defaultLanguage="hcl"
      language="hcl"
      theme="vs-dark"
      value={file?.content ?? ''}
      onChange={(value) => onChange(value ?? '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'IBM Plex Mono, monospace',
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        folding: true,
        automaticLayout: true,
      }}
    />
  );
}
```

### 4. HCL Language Support

Monaco has built-in HCL support via TextMate grammars. No extra config needed for syntax highlighting.

For autocomplete/validation, we'd need a language server (terraform-ls), but that's out of scope for MVP.

### 5. Integration with Visualization

```tsx
// App.tsx
import { useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './Editor';
import { Visualization } from '@terraform-town/visualization';

export function App() {
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [state, setState] = useState<TerraformState>(emptyState);

  const handleApply = async () => {
    // Run terraform apply via backend
    const result = await fetch('/api/apply', {
      method: 'POST',
      body: activeFile?.content,
    });
    const newState = await result.json();
    setState(newState);
  };

  return (
    <div className="app">
      <div className="editor-panel">
        <FileExplorer onSelect={setActiveFile} />
        <CodeEditor file={activeFile} onChange={handleContentChange} />
      </div>
      <div className="viz-panel">
        <Visualization state={state} />
      </div>
      <div className="toolbar">
        <button onClick={handlePlan}>Plan</button>
        <button onClick={handleApply}>Apply</button>
        <button onClick={handleDestroy}>Destroy</button>
      </div>
    </div>
  );
}
```

---

## Gotchas

1. **Monaco worker loading:** Monaco uses web workers. Need to configure Vite:
   ```js
   // vite.config.ts
   import monacoEditorPlugin from 'vite-plugin-monaco-editor';
   
   export default defineConfig({
     plugins: [monacoEditorPlugin()],
   });
   ```

2. **HCL not auto-detected:** Monaco uses file extension. Set `language="hcl"` explicitly.

3. **State sync:** Editor content changes don't auto-update viz. User must click "Apply" to trigger terraform.

4. **File persistence:** MVP uses in-memory files. Real app would need backend storage.

---

## Shortest Happiest Path

1. Add `@monaco-editor/react`
2. Create `FileExplorer.tsx` with hardcoded files
3. Create `Editor.tsx` wrapping Monaco
4. Add "Apply" button that updates visualization
5. Skip: language server, file persistence, tabs

This gives a working editor + viz in ~200 lines of code.
