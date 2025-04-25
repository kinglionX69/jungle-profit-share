
import React, { useState, useEffect } from 'react';
import { Button, Typography, Tooltip, CircularProgress } from '@mui/material';
import { useWallet } from '@/context/wallet';
import { useSnackbar } from 'notistack';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkWalletInstalled } from '@/context/wallet/walletUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const WalletConnect: React.FC = () => {
  const { connected, connect, connectWallet, connecting: walletConnecting } = useWallet();
  const { enqueueSnackbar } = useSnackbar();
  const { claim, claimableAmount, isVerified } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [walletInstalled, setWalletInstalled] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  console.log("WalletConnect rendering - connected status:", connected);
  
  // Enhanced wallet checking with more robust detection
  useEffect(() => {
    const checkWallet = () => {
      try {
        // Check for Petra wallet
        const isPetraInstalled = window.aptos || window.petra;
        setWalletInstalled(!!isPetraInstalled);
        
        if (isPetraInstalled) {
          console.log("Petra wallet detected");
        } else {
          console.log("Petra wallet not detected");
        }
      } catch (error) {
        console.error("Error checking wallet installation:", error);
        setWalletInstalled(false);
      }
    };
    
    checkWallet();
    const intervalId = setInterval(checkWallet, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    try {
      console.log("Initiating wallet connect...");
      setIsConnecting(true);
      
      if (!walletInstalled) {
        console.log("Wallet not installed, showing instructions");
        // Use both notification systems for redundancy
        enqueueSnackbar(
          'Wallet not found. Please install Petra wallet.',
          { variant: 'error', autoHideDuration: 5000 }
        );
        
        toast.error('Petra wallet not detected. Redirecting to installation page.');
        
        if (isMobile) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS) {
            window.open('https://apps.apple.com/us/app/petra-aptos-wallet/id6446259840', '_blank');
          } else {
            window.open('https://play.google.com/store/apps/details?id=com.aptoslabs.petra', '_blank');
          }
        } else {
          window.open('https://petra.app/', '_blank');
        }
        setIsConnecting(false);
        return;
      }
      
      // Connect directly to Petra wallet with enhanced error handling
      console.log("Attempting to connect to Petra wallet...");
      try {
        await connectWallet('petra');
        toast.success('Successfully connected to wallet');
        console.log("Connection successful");
      } catch (walletError) {
        console.error('Specific error connecting wallet:', walletError);
        toast.error('Could not connect to wallet. Please make sure it is unlocked and try again.');
        throw walletError;
      }
    } catch (error) {
      console.error('General error connecting wallet:', error);
      enqueueSnackbar(
        'Failed to connect wallet. Please try again.',
        { variant: 'error', autoHideDuration: 5000 }
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClaim = async () => {
    if (!connected) {
      console.log("Not connected, cannot claim");
      return;
    }
    console.log("Navigating to dashboard for claim");
    navigate('/dashboard');
  };

  console.log("WalletConnect rendering with state:", {
    connected,
    walletConnecting,
    isConnecting,
    walletInstalled
  });

  if (connected) {
    return (
      <Button
        variant="contained"
        onClick={handleClaim}
        disabled={isClaiming}
        sx={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          px: 3,
          py: 1
        }}
      >
        <>
          Claim Now
          <ChevronRight style={{ marginLeft: 4, width: 16, height: 16 }} />
        </>
      </Button>
    );
  }

  return (
    <Tooltip title={!walletInstalled ? `Install Petra wallet ${isMobile ? 'app' : 'browser extension'} to connect` : ""} arrow>
      <Button
        variant="contained"
        onClick={handleConnect}
        disabled={isConnecting || walletConnecting}
        sx={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          px: 3,
          py: 1,
          minWidth: '160px'
        }}
      >
        {(isConnecting || walletConnecting) ? (
          <>
            <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
            Connecting...
          </>
        ) : 'Connect Wallet'}
      </Button>
    </Tooltip>
  );
};

export default WalletConnect;
