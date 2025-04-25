
import React, { useState } from 'react';
import { Button, Typography, Tooltip } from '@mui/material';
import { useWallet } from '@/context/wallet';
import { useSnackbar } from 'notistack';
import { useUser } from '@/context/UserContext';
import { ChevronRight } from 'lucide-react';

const WalletConnect: React.FC = () => {
  const { connected, connect } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { claim, claimableAmount, isVerified } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      enqueueSnackbar(
        'Wallet not found. Please install Petra wallet extension.',
        { variant: 'error', autoHideDuration: 5000 }
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClaim = async () => {
    if (!connected || claimableAmount <= 0 || !isVerified) return;
    
    setIsClaiming(true);
    try {
      await claim();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      enqueueSnackbar('Failed to claim rewards. Please try again.', { 
        variant: 'error' 
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (connected) {
    return (
      <Button
        variant="contained"
        onClick={handleClaim}
        disabled={isClaiming || claimableAmount <= 0 || !isVerified}
        sx={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          px: 3,
          py: 1
        }}
      >
        {isClaiming ? (
          'Processing...'
        ) : (
          <>
            Claim Now
            <ChevronRight style={{ marginLeft: 4, width: 16, height: 16 }} />
          </>
        )}
      </Button>
    );
  }

  return (
    <Tooltip title="Install Petra wallet browser extension to connect" arrow>
      <Button
        variant="contained"
        onClick={handleConnect}
        disabled={isConnecting}
        sx={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          px: 3,
          py: 1
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </Tooltip>
  );
};

export default WalletConnect;
