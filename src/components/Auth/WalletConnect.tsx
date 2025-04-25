
import React, { useState } from 'react';
import { Button, Typography, Tooltip } from '@mui/material';
import { useWallet } from '@/context/wallet';
import { useSnackbar } from 'notistack';

const WalletConnect: React.FC = () => {
  const { connected, address, connect, disconnect } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const [isConnecting, setIsConnecting] = useState(false);

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

  if (connected && address) {
    return (
      <Button
        variant="contained"
        onClick={disconnect}
        sx={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          px: 3,
          py: 1
        }}
      >
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
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
