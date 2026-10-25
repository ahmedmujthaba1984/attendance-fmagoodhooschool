import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline mobile capability
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[PWA] Portal is cached and ready to work fully offline.');
  },
  onNeedRefresh() {
    console.log('[PWA] New portal version available.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
