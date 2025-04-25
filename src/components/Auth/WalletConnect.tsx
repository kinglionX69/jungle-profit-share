import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Link } from '@mui/material';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';

interface WalletConnectProps {
  onSuccess?: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onSuccess }) => {
  const { connect, connecting, connected } = useWallet();
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const checkWalletInstallation = () => {
      if (typeof window !== 'undefined') {
        setIsInstalled(!!window.petra);
      }
    };

    checkWalletInstallation();
    // Check periodically for wallet installation
    const interval = setInterval(checkWalletInstallation, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connected && onSuccess) {
      onSuccess();
    }
  }, [connected, onSuccess]);

  const handleConnect = async () => {
    try {
      if (!isInstalled) {
        window.open('https://petra.app', '_blank');
        toast.error('Please install Petra Wallet to continue');
        return;
      }

      await connect();
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Connect Your Wallet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isInstalled 
          ? 'Connect your Petra wallet to access your NFTs and rewards'
          : 'Please install Petra wallet to continue'}
      </Typography>
      {!isInstalled ? (
        <Link 
          href="https://petra.app"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ textDecoration: 'none' }}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            Install Petra Wallet
          </Button>
        </Link>
      ) : (
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={connecting}
          fullWidth
          sx={{
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          {connecting ? (
            <>
              <CircularProgress size={20} color="inherit" />
              Connecting...
            </>
          ) : (
            'Connect Petra'
          )}
        </Button>
      )}
    </Box>
  );
};

export default WalletConnect;
