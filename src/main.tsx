
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App';

// Globally catch and log errors to help with debugging outside the sandbox
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    return false; // Let default handler run
  };
  
  console.log('Environment:', import.meta.env.MODE);
  console.log('Running outside sandbox:', window.location.hostname !== 'lovableproject.com');
}

// Get the root element
const rootElement = document.getElementById("root");

// Make sure rootElement exists before rendering
if (rootElement) {
  try {
    // Create a root
    const root = createRoot(rootElement);
    
    // Render the app
    root.render(
      <React.StrictMode>
        <CssBaseline />
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render application:', error);
    // Add fallback display if rendering fails
    if (rootElement) {
      rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Application Error</h2><p>Failed to load the application. Please check the console for details.</p></div>';
    }
  }
} else {
  console.error('Root element not found, cannot mount application');
}
