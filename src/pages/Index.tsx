
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import { Mountain, Package, Shield } from 'lucide-react';
import Header from '@/components/Layout/Header';
import WalletConnect from '@/components/Auth/WalletConnect';
import { useWallet } from '@/context/wallet';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Paper 
      elevation={0}
      className="glass hover-scale"
      sx={{ 
        p: 4, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box 
        sx={{ 
          p: 2,
          borderRadius: '50%',
          bgcolor: 'rgba(76, 175, 80, 0.1)',
          display: 'flex',
          mb: 2
        }}
      >
        <Icon size={32} className="text-primary" />
      </Box>
      <Typography variant="h5" component="h3" align="center" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center">
        {description}
      </Typography>
    </Paper>
  </Box>
);

const Index = () => {
  const { connected } = useWallet();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        {/* Hero Section */}
        <Grid container spacing={6} alignItems="center" sx={{ mb: 12 }}>
          <Grid item xs={12} md={7}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography 
                variant="h1" 
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  lineHeight: 1.2,
                  mb: 3,
                  background: 'linear-gradient(90deg, #4CAF50 30%, #FFC107 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                JUNGLE NFT REWARDS
              </Typography>
              
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ mb: 4, maxWidth: 600 }}
              >
                Connect your wallet to unlock exclusive rewards with your Jungle NFTs. 
                Start earning today!
              </Typography>
              
              <Box sx={{ mt: 4 }}>
                <WalletConnect />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                component="img"
                src="/placeholder.svg"
                alt="Jungle NFT"
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box sx={{ mb: 12 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography 
              variant="h2" 
              align="center" 
              sx={{ 
                mb: 6,
                background: 'linear-gradient(90deg, #4CAF50 30%, #FFC107 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              How It Works
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={Mountain}
                title="Own Jungle NFTs"
                description="Purchase Jungle NFTs from our collection to become eligible for rewards"
                delay={0.3}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={Package}
                title="Claim Rewards"
                description="Connect your wallet and claim tokens based on your NFT holdings"
                delay={0.4}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={Shield}
                title="Secure Earnings"
                description="Your rewards are securely stored and easily accessible anytime"
                delay={0.5}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          mt: 'auto',
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
