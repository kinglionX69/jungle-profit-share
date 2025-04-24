
import React from 'react';
import { Button, Box, Typography, Paper, CircularProgress, Avatar } from '@mui/material';
import { AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { useWallet } from '@/context/WalletContext';
import WalletSelector from './WalletSelector';

interface WalletConnectProps {
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { 
    connected, 
    connecting, 
    address, 
    connect, 
    connectWallet,
    showWalletSelector,
    setShowWalletSelector,
    walletType
  } = useWallet();
  
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const walletName = walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : '';
  
  if (connected) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2
      }}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            mb: 2
          }}
        >
          <WalletIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
        </Paper>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: 'success.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 }
                }
              }}
            />
            <Typography variant="body1" fontWeight="medium">
              Connected {walletName && `(${walletName})`}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{shortAddress}</Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 4
    }}>
      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(255, 193, 7, 0.2)'
        }}
      >
        <WalletIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
      </Paper>
      <Typography variant="h5" component="h2">Connect Your Wallet</Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 'xs' }}>
        Connect your Aptos wallet to access your NFTs and claim rewards
      </Typography>
      <Button 
        variant="contained" 
        color="secondary"
        size="large"
        onClick={connect}
        disabled={connecting}
        sx={{ 
          mt: 2,
          py: 1.5,
          px: 4,
          borderRadius: 3,
          boxShadow: '0 8px 16px rgba(255, 193, 7, 0.25)'
        }}
      >
        {connecting ? (
          <>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            Connecting...
          </>
        ) : 'Connect Wallet'}
      </Button>
      
      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onSelectWallet={connectWallet}
      />
    </Box>
  );
};

export default WalletConnect;
