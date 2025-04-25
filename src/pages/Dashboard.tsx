import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  AlertTitle, 
  AlertDescription,
  Grid,
  Container
} from '@mui/material';
import { Refresh as RefreshIcon, AlertCircle as AlertCircleIcon } from '@mui/icons-material';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import WalletConnect from '@/components/Auth/WalletConnect';
import EmailVerification from '@/components/Auth/EmailVerification';
import NFTGrid from '@/components/NFT/NFTGrid';
import ClaimCard from '@/components/Claim/ClaimCard';
import ClaimHistory from '@/components/Claim/ClaimHistory';
import { useUser } from '@/context/UserContext';
import { IS_TESTNET } from '@/utils/aptos/constants';
import { useSnackbar } from 'notistack';

const Dashboard = () => {
  const { connected, address } = useWallet();
  const { isVerified, nfts, fetchUserData, loadingNfts } = useUser();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  const handleRefreshNFTs = () => {
    if (fetchUserData) {
      enqueueSnackbar("Refreshing NFT data...", { variant: 'info' });
      fetchUserData();
    }
  };
  
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
            startIcon={<RefreshIcon className={loadingNfts ? 'animate-spin' : ''} />}
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
            <AlertCircleIcon />
            <AlertTitle>Testnet Mode</AlertTitle>
            <AlertDescription>
              Application is running in testnet mode. NFTs and transactions will be on the Aptos testnet.
            </AlertDescription>
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
