import { createRoot } from 'react-dom/client';
import { Editor } from './Editor';
import { SplitLayout } from './SplitLayout';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <SplitLayout
      left={<Editor />}
      right={<div id="visualization-container" style={{ width: '100%', height: '100%' }} />}
    />
  );
}
