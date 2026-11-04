import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Global error handlers to capture any uncaught script or promise failures during startup
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error || event.message);
  showFallbackUI(event.error?.message || event.message || 'Script execution error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Unhandled Rejection]', event.reason);
  showFallbackUI(event.reason?.message || String(event.reason) || 'Unhandled Async Rejection');
});

function showFallbackUI(errorMessage: string) {
  const rootEl = document.getElementById('root');
  if (rootEl && rootEl.children.length === 0) {
    rootEl.innerHTML = `
      <div style="min-height: 100vh; background-color: #0A0A0A; color: white; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: system-ui, sans-serif;">
        <div style="max-width: 480px; width: 100%; background: #141414; border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 18px; text-transform: uppercase; font-weight: 800;">Critical App Startup Error</h2>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">An unexpected script error occurred during app boot:</p>
          <pre style="background: #050505; color: #f87171; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; border: 1px solid #222;">${errorMessage}</pre>
          <button onclick="window.location.reload()" style="margin-top: 16px; background: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">Reload Application</button>
        </div>
      </div>
    `;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary name="RootApp">
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err: any) {
    console.error('[main.tsx] Error initializing React root:', err);
    showFallbackUI(err?.message || 'Failed to render React root');
  }
}
