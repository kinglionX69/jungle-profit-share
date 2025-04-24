
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  Token as TokenIcon,
  Landscape as LandscapeIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import Header from '@/components/Layout/Header';
import WalletConnect from '@/components/Auth/WalletConnect';
import { useWallet } from '@/context/wallet';

const Index = () => {
  const { connected } = useWallet();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(15, 26, 18, 1) 0%, rgba(22, 38, 27, 1) 100%)'
      }}
    >
      <Header />
      
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6, py: 8, alignItems: 'center' }}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              component="h1" 
              variant="h2"
              sx={{ 
                mb: 2, 
                background: 'linear-gradient(90deg, #4CAF50 0%, #FFC107 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }
              }}
            >
              JUNGLE NFT REWARDS
            </Typography>
            
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
              Connect your wallet to claim rewards with your Jungle NFTs
            </Typography>
            
            {connected ? (
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                endIcon={<ArrowForwardIcon />}
                component={RouterLink}
                to="/dashboard"
                sx={{ 
                  py: 1.5, 
                  px: 4,
                  borderRadius: 3,
                  fontSize: '1.1rem'
                }}
              >
                View Dashboard
              </Button>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Connect your wallet to get started with Jungle NFT Rewards
              </Typography>
            )}
          </Box>
          
          <Box display="flex" justifyContent="center" width="100%">
            <Paper 
              elevation={6} 
              sx={{ 
                p: 4,
                borderRadius: 4,
                maxWidth: 400,
                width: '100%',
                backgroundColor: 'rgba(22, 32, 25, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <WalletConnect />
            </Paper>
          </Box>
        </Box>
        
        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Typography 
            variant="h3" 
            align="center"
            sx={{ 
              mb: 6,
              background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            How It Works
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
            {[
              {
                icon: <LandscapeIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
                title: 'Own Jungle NFTs',
                description: 'Purchase Jungle NFTs from our collection to become eligible for rewards'
              },
              {
                icon: <TokenIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
                title: 'Claim Rewards',
                description: 'Connect your wallet and claim tokens based on your NFT holdings'
              },
              {
                icon: <SecurityIcon sx={{ fontSize: 48, color: 'success.main' }} />,
                title: 'Secure Earnings',
                description: 'Your rewards are securely stored and easily accessible anytime'
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button size="small" color="primary" endIcon={<ArrowForwardIcon />}>
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>
      
      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Jungle NFT Rewards. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Index;
