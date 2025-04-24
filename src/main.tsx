
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App.tsx';

// Get the root element
const rootElement = document.getElementById("root");

// Make sure rootElement exists before rendering
if (rootElement) {
  // Create a root
  const root = createRoot(rootElement);
  
  // Render the app with explicit React import
  root.render(
    <React.StrictMode>
      <CssBaseline />
      <App />
    </React.StrictMode>
  );
}
