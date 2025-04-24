
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, SnackbarProvider } from '@mui/material';
import { WalletProvider } from "./context/wallet";
import { UserProvider } from "./context/UserContext";
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
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={5000}
      >
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
      </SnackbarProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
