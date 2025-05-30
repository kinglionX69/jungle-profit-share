
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
  CircularProgress,
  Paper
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
import { toast } from 'sonner';

const Dashboard = () => {
  const { connected, address, connecting } = useWallet();
  const { isVerified, nfts, fetchUserData, loadingNfts } = useUser();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  
  console.log("Dashboard Rendering - Connection Status:", { connected, address, connecting });
  console.log("User Context Data:", { isVerified, nftCount: nfts?.length, loadingNfts });
  
  useEffect(() => {
    console.log("Dashboard - Initial useEffect running");
    const checkConnection = async () => {
      console.log("Dashboard - Checking connection status");
      
      setTimeout(() => {
        setIsLoading(false);
        
        if (!connecting && !connected) {
          console.log("Dashboard: Not connected, redirecting to home");
          navigate('/');
        }
      }, 1000);
    };
    
    checkConnection();
  }, [connected, connecting, navigate]);

  useEffect(() => {
    console.log("Dashboard - Data load useEffect running with state:", { connected, address });
    
    if (connected && address && fetchUserData) {
      console.log("Dashboard: Connected, fetching user data");
      fetchUserData().catch(error => {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load your data");
      });
    }
  }, [connected, address, fetchUserData]);

  const handleRefreshNFTs = () => {
    if (fetchUserData) {
      console.log("Manual refresh of NFT data requested");
      enqueueSnackbar("Refreshing NFT data...", { variant: 'info' });
      toast.info("Refreshing NFTs...");
      fetchUserData().catch(error => {
        console.error("Error refreshing data:", error);
      });
    }
  };
  
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
                Connect your wallet to access your dashboard
              </Typography>
              <WalletConnect />
            </Paper>
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
        
        <Grid container spacing={4} sx={{ mb: 4 }} component="div">
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', lg: 'span 8' } }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Eligible NFTs for Claim
              </Typography>
              <NFTGrid filterEligible={true} />
            </Paper>
          </Grid>
          
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', lg: 'span 4' } }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <ClaimCard />
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <ClaimHistory />
          </Paper>
        </Box>
      </PageContainer>
    </>
  );
};

export default Dashboard;
