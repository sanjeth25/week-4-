import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent external third-party script cross-origin errors (e.g. Disqus tracker/iframe blockers) from crashing the app
window.addEventListener('error', (event) => {
  if (
    event.message === 'Script error.' ||
    (event.filename && event.filename.includes('disqus')) ||
    (event.filename && event.filename.includes('c.disquscdn.com'))
  ) {
    // Gracefully handle cross-origin third-party script errors
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
