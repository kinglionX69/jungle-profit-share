import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { Toaster } from 'sonner';
import { LazyMotion, domAnimation } from 'framer-motion';
import { theme } from '@/theme/index';
import { WalletProvider } from '@/context/WalletContext';
import { UserProvider } from '@/context/UserContext';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Globally catch and log errors to help with debugging outside the sandbox
if (typeof window !== 'undefined') {
  // Set up comprehensive error handling
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error caught:', { message, source, lineno, colno, error });
    // Detailed logging for specific error types
    if (error && error.name === 'TypeError') {
      console.error('Type Error Details:', error.message, error.stack);
    }
    return false; // Let default handler run
  };
  
  // React error handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });
  
  // Add more detailed console logs for debugging
  console.log('Environment:', import.meta.env.MODE);
  console.log('Running outside sandbox:', window.location.hostname !== 'lovableproject.com');
  console.log('Browser:', navigator.userAgent);
  console.log('Initial page load timestamp:', new Date().toISOString());
  
  // Check for wallet extension presence
  const walletExtensions = {
    petra: !!window.aptos || !!window.petra,
    martian: !!window.martian,
    pontem: !!window.pontem,
    rise: !!window.rise
  };
  console.log('Wallet extensions detected:', walletExtensions);
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              maxSnack={3}
              autoHideDuration={5000}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Toaster position="top-right" richColors />
              <LazyMotion features={domAnimation}>
                <WalletProvider>
                  <UserProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </UserProvider>
                </WalletProvider>
              </LazyMotion>
            </SnackbarProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
    console.log('App successfully rendered');
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
