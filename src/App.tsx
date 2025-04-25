import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { Toaster } from 'sonner';
import { LazyMotion, domAnimation } from 'framer-motion';
import { theme } from '@/theme';
import { WalletProvider } from '@/context/WalletContext';
import { UserProvider } from '@/context/UserContext';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
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
                  <AppRoutes />
                </BrowserRouter>
              </UserProvider>
            </WalletProvider>
          </LazyMotion>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
