
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Divider,
  Link,
  useTheme
} from '@mui/material';
import { Wallet, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletConnect } from '@/components/Auth/WalletConnect';
import { PageContainer } from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import { useMobile } from '@/hooks/use-mobile';

const Index = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMobile();
  const { address, connected } = useWallet();
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  
  const handleGetStarted = () => {
    if (connected) {
      navigate('/dashboard');
    } else {
      setShowWalletConnect(true);
    }
  };
  
  return (
    <PageContainer maxWidth="lg">
      {showWalletConnect && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0, 0, 0, 0.7)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Paper sx={{ 
            p: 4, 
            maxWidth: 500, 
            width: '100%',
            position: 'relative'
          }}>
            <Button 
              onClick={() => setShowWalletConnect(false)}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              Close
            </Button>
            <WalletConnect onSuccess={() => navigate('/dashboard')} />
          </Paper>
        </Box>
      )}
      
      <Box sx={{ py: { xs: 4, md: 8 } }}>
        <Grid container spacing={4} component="div">
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h2" component="h1" sx={{ mb: 2, fontWeight: 700 }}>
                Proud Lions Club
              </Typography>
              <Typography variant="h5" component="h2" sx={{ mb: 4, color: 'text.secondary' }}>
                Earn rewards with your NFTs on the Aptos blockchain
              </Typography>
              <Box sx={{ mb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleGetStarted}
                  endIcon={<ChevronRight />}
                  sx={{ 
                    px: 4, 
                    py: 1.5, 
                    borderRadius: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  {connected ? 'Go to Dashboard' : 'Connect Wallet'}
                </Button>
              </Box>
              <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Already own Proud Lion NFTs? Connect your wallet to claim your rewards.
                </Typography>
              </Paper>
            </Box>
          </Grid>
          
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Box 
              component="img"
              src="/placeholder.svg"
              alt="Proud Lions Club"
              sx={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: 400,
                objectFit: 'cover',
                borderRadius: 4
              }}
            />
          </Box>
        </Grid>
      </Box>
      
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 4, textAlign: 'center' }}>
          How It Works
        </Typography>
        
        <Grid container spacing={4} component="div">
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  1. Connect Wallet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Connect your Aptos wallet containing your Proud Lion NFTs to get started.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  2. View Your NFTs
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  We'll scan your wallet for eligible Proud Lion NFTs that can earn rewards.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  3. Claim Rewards
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Claim APT or EMOJICOIN rewards for each eligible NFT you own.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 6 }} />
      
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 Proud Lions Club. All rights reserved.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Terms
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Privacy
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Contact
          </Link>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Index;
