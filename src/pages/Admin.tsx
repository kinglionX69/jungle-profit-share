import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  AlertTitle,
  Grid,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import TokenDeposit from '@/components/Admin/TokenDeposit';
import TokenWithdrawal from '@/components/Admin/TokenWithdrawal';
import ClaimStatistics from '@/components/Admin/ClaimStatistics';
import WalletBalance from '@/components/Admin/WalletBalance';

const Admin = () => {
  const { connected, isAdmin } = useWallet();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  
  useEffect(() => {
    if (!connected) {
      navigate('/');
    } else if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [connected, isAdmin, navigate]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  if (!connected || !isAdmin) {
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
              <WarningIcon />
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
          <Grid item xs={12} md={8}>
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
          <Grid item xs={12} md={4}>
            <WalletBalance />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <ClaimStatistics />
        </Box>
      </PageContainer>
    </>
  );
};

export default Admin;
