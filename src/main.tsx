
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App.tsx';

// Ensure React is properly initialized before rendering
createRoot(document.getElementById("root")!).render(
  <>
    <CssBaseline />
    <App />
  </>
);
