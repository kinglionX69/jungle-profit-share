import * as React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Toaster } from 'sonner';
import { WalletProvider } from "./context/wallet/WalletProvider";
import { UserProvider } from "./context/UserContext";
import { LazyMotion, domAnimation } from "framer-motion";
import theme from './theme/theme';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Create a new query client instance with enhanced resilience settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 60000,
      onError: (error) => {
        console.error('Query error:', error);
        // Optional: Add global error handling logic
      }
    },
  },
});

// The application component with all providers
const App = () => {
  // Add error boundary to catch and handle errors
  React.useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // Prevent the error from crashing the app
      event.preventDefault();
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider 
            maxSnack={3} 
            autoHideDuration={5000}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <Toaster position="top-right" richColors />
            <LazyMotion features={domAnimation}>
              <BrowserRouter>
                <WalletProvider>
                  <UserProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </UserProvider>
                </WalletProvider>
              </BrowserRouter>
            </LazyMotion>
          </SnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
