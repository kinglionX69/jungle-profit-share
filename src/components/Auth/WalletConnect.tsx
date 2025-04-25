
import React from 'react';
import { Button } from '@mui/material';
import { useWallet } from '@/context/WalletContext';

const WalletConnect: React.FC = () => {
  const { connected, address, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
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
    <Button
      variant="contained"
      onClick={handleConnect}
      sx={{
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 600,
        textTransform: 'none',
        px: 3,
        py: 1
      }}
    >
      Connect Wallet
    </Button>
  );
};

export default WalletConnect;
