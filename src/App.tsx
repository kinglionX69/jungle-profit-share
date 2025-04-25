
import * as React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { WalletProvider } from "./context/wallet";
import { UserProvider } from "./context/UserContext";
import { LazyMotion, domAnimation } from "framer-motion";
import theme from './theme/theme';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Create a new query client instance
const queryClient = new QueryClient();

// The application component with all providers
const App = () => (
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
);

export default App;
