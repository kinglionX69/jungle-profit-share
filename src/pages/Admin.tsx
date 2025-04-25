
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  AlertTitle,
  Grid,
  Tabs,
  Tab,
  Paper,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/wallet';
import TokenDeposit from '@/components/Admin/TokenDeposit';
import TokenWithdrawal from '@/components/Admin/TokenWithdrawal';
import ClaimStatistics from '@/components/Admin/ClaimStatistics';
import WalletBalance from '@/components/Admin/WalletBalance';
import WalletConnect from '@/components/Auth/WalletConnect';

const Admin = () => {
  const { connected, address, isAdmin, connecting } = useWallet();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // The hardcoded admin wallet address
  const adminWalletAddress = "0xbaa4882c050dd32d2405e9c50eecd308afa1cf4f023e45371671a60a051ea500";
  const isAdminWallet = isAdmin || (address === adminWalletAddress);
  
  // Debug logging
  console.log("Admin Page - Rendering with:", { 
    connected, 
    address, 
    isAdmin, 
    isAdminWallet,
    connecting
  });
  
  // Check connection and admin status
  useEffect(() => {
    const checkAccess = async () => {
      console.log("Admin - Checking connection and admin status");
      
      // Wait to confirm connection status
      setTimeout(() => {
        setIsLoading(false);
        
        if (!connecting && !connected) {
          console.log("Admin: Not connected, redirecting to home");
          navigate('/');
        } else if (!connecting && connected && !isAdminWallet) {
          console.log("Admin: Not an admin wallet, redirecting to dashboard");
          navigate('/dashboard');
        }
      }, 1000); // Give wallet connection a moment to establish
    };
    
    checkAccess();
  }, [connected, isAdmin, address, isAdminWallet, navigate, connecting]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Show loading state
  if (isLoading || connecting) {
    return (
      <>
        <Header />
        <PageContainer>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)'
          }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Checking admin access...
            </Typography>
          </Box>
        </PageContainer>
      </>
    );
  }
  
  // Show connect wallet if not connected
  if (!connected) {
    return (
      <>
        <Header />
        <PageContainer>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)'
          }}>
            <Paper sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
                Connect your wallet to access admin panel
              </Typography>
              <WalletConnect />
            </Paper>
          </Box>
        </PageContainer>
      </>
    );
  }
  
  // Show access restricted if not admin
  if (!isAdminWallet) {
    return (
      <>
        <Header />
        <PageContainer>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)'
          }}>
            <Alert 
              severity="error" 
              sx={{ maxWidth: 'md' }}
            >
              <AlertTitle>Access Restricted</AlertTitle>
              <Typography>This page is only accessible to the admin wallet.</Typography>
            </Alert>
          </Box>
        </PageContainer>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <PageContainer>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Admin Panel
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Manage token deposits and monitor claim activity
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{ mb: 3 }}
              >
                <Tab label="Deposit" />
                <Tab label="Withdraw" />
              </Tabs>
              
              <Box sx={{ mt: 2 }}>
                {tabValue === 0 && <TokenDeposit />}
                {tabValue === 1 && <TokenWithdrawal />}
              </Box>
            </Paper>
          </Grid>
          <Grid xs={12} md={4}>
            <WalletBalance />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <ClaimStatistics />
          </Paper>
        </Box>
      </PageContainer>
    </>
  );
};

export default Admin;
