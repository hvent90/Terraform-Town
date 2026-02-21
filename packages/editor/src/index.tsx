import { createRoot } from 'react-dom/client';
import { Editor } from './Editor';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Editor />);
}
