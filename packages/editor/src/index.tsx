import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from './Editor';
import { SplitLayout } from './SplitLayout';
import { Toolbar } from './Toolbar';
import { applyToVisualization } from './applySync';
import { Visualization } from '../../visualization/src/Visualization';

function App() {
  const [editorContent, setEditorContent] = useState<string | undefined>();
  const visRef = useRef<Visualization | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el && !visRef.current) {
      visRef.current = new Visualization(el);
    }
    return () => {
      visRef.current?.dispose();
      visRef.current = null;
    };
  }, []);

  const handleApply = useCallback(() => {
    if (visRef.current && editorContent) {
      applyToVisualization(editorContent, visRef.current);
    }
  }, [editorContent]);

  return (
    <SplitLayout
      left={
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Toolbar onApply={handleApply} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor value={editorContent} onChange={(v) => setEditorContent(v)} />
          </div>
        </div>
      }
      right={
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%' }}
        />
      }
    />
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
