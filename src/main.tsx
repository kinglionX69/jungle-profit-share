
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App.tsx';

// Ensure React is properly initialized before rendering
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <CssBaseline />
      <App />
    </React.StrictMode>
  );
}
