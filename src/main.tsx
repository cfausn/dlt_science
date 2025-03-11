import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { WidgetConfig } from './App.tsx'
import './index.css'

// Function to create and export the widget
export function createHederaDonationWidget(elementId: string, config: Partial<WidgetConfig> = {}) {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`Element with id "${elementId}" not found.`);
    return;
  }
  
  ReactDOM.createRoot(targetElement).render(
    <React.StrictMode>
      <App {...config} />
    </React.StrictMode>,
  );
}

// Auto-initialize if this is loaded in standalone mode
if (!window.hederaDonationWidget) {
  window.hederaDonationWidget = createHederaDonationWidget;
  
  // Find our root element in standalone mode
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

// Expose the widget creation function globally
declare global {
  interface Window {
    hederaDonationWidget: typeof createHederaDonationWidget;
  }
}

// Make sure widget is available globally
if (typeof window !== 'undefined') {
  (window as any).hederaDonationWidget = createHederaDonationWidget;
}
