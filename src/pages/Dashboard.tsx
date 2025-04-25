
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  AlertTitle,
  Grid,
  Container,
  CircularProgress
} from '@mui/material';
import { Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/wallet';
import WalletConnect from '@/components/Auth/WalletConnect';
import EmailVerification from '@/components/Auth/EmailVerification';
import NFTGrid from '@/components/NFT/NFTGrid';
import ClaimCard from '@/components/Claim/ClaimCard';
import ClaimHistory from '@/components/Claim/ClaimHistory';
import { useUser } from '@/context/UserContext';
import { IS_TESTNET } from '@/utils/aptos/constants';
import { useSnackbar } from 'notistack';

const Dashboard = () => {
  const { connected, address, connecting } = useWallet();
  const { isVerified, nfts, fetchUserData, loadingNfts } = useUser();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check connection status and load data
  useEffect(() => {
    const checkConnection = async () => {
      // Wait to confirm connection status
      setTimeout(() => {
        setIsLoading(false);
        
        // Only redirect if we're confirmed not connected
        if (!connecting && !connected) {
          console.log("Dashboard: Not connected, redirecting to home");
          navigate('/');
        }
      }, 1000); // Give wallet connection a moment to establish
    };
    
    checkConnection();
  }, [connected, connecting, navigate]);

  // Load user data when connected
  useEffect(() => {
    if (connected && address && fetchUserData) {
      console.log("Dashboard: Connected, fetching user data");
      fetchUserData();
    }
  }, [connected, address, fetchUserData]);

  const handleRefreshNFTs = () => {
    if (fetchUserData) {
      enqueueSnackbar("Refreshing NFT data...", { variant: 'info' });
      fetchUserData();
    }
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
              Checking wallet connection...
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
            <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
              Connect your wallet to access your dashboard
            </Typography>
            <WalletConnect />
          </Box>
        </PageContainer>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <PageContainer>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              View your eligible NFTs and claim your rewards
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefreshNFTs} 
            disabled={loadingNfts}
            startIcon={<RefreshIcon />}
            sx={{
              '& .MuiSvgIcon-root': {
                animation: loadingNfts ? 'spin 2s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }
            }}
          >
            {loadingNfts ? 'Refreshing...' : 'Refresh NFTs'}
          </Button>
        </Box>
        
        {IS_TESTNET && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 4,
              backgroundColor: 'rgba(255, 167, 38, 0.1)',
              borderColor: 'rgba(255, 167, 38, 0.2)'
            }}
          >
            <AlertTitle>Testnet Mode</AlertTitle>
            <Typography>
              Application is running in testnet mode. NFTs and transactions will be on the Aptos testnet.
            </Typography>
          </Alert>
        )}
        
        {!isVerified && (
          <Box sx={{ mb: 4, maxWidth: 'md' }}>
            <EmailVerification />
          </Box>
        )}
        
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Eligible NFTs for Claim
            </Typography>
            <NFTGrid filterEligible={true} />
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <ClaimCard />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <ClaimHistory />
        </Box>
      </PageContainer>
    </>
  );
};

export default Dashboard;
