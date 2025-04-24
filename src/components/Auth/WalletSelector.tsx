
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Button, 
  Box, 
  Typography 
} from '@mui/material';
import { Download } from '@mui/icons-material';

export interface WalletOption {
  name: string;
  icon: string;
  isInstalled: boolean;
  downloadUrl: string;
}

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWallet: (walletName: string) => Promise<void>;
}

const WALLET_OPTIONS: Omit<WalletOption, 'isInstalled'>[] = [
  {
    name: 'Petra',
    icon: '/wallet-icons/petra.png',
    downloadUrl: 'https://petra.app',
  },
  {
    name: 'Martian',
    icon: '/wallet-icons/martian.png',
    downloadUrl: 'https://martianwallet.xyz',
  },
  {
    name: 'Pontem',
    icon: '/wallet-icons/pontem.png',
    downloadUrl: 'https://pontem.network',
  },
  {
    name: 'Rise',
    icon: '/wallet-icons/rise.png',
    downloadUrl: 'https://risewallet.io',
  }
];

const WalletSelector: React.FC<WalletSelectorProps> = ({ 
  open, 
  onOpenChange,
  onSelectWallet
}) => {
  // Check which wallets are installed
  const walletOptions = WALLET_OPTIONS.map(wallet => ({
    ...wallet,
    isInstalled: checkWalletInstalled(wallet.name)
  }));

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: 'sm'
        }
      }}
    >
      <DialogTitle sx={{ fontFamily: "'Bungee', cursive" }}>Connect Your Wallet</DialogTitle>
      <DialogContent>
        <List sx={{ py: 2 }}>
          {walletOptions.map((wallet) => (
            <ListItem 
              key={wallet.name} 
              sx={{ 
                mb: 1.5, 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: 2, 
                p: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ListItemIcon>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 1, 
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} wallet`} 
                    style={{ width: 30, height: 30, objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={wallet.name} 
                primaryTypographyProps={{ 
                  fontWeight: 'medium',
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
              
              {wallet.isInstalled ? (
                <Button 
                  size="small"
                  variant="contained" 
                  color="secondary"
                  onClick={() => onSelectWallet(wallet.name.toLowerCase())}
                  sx={{ 
                    fontWeight: 'medium', 
                    color: 'text.primary',
                    minWidth: 100
                  }}
                >
                  Connect
                </Button>
              ) : (
                <Button 
                  size="small" 
                  variant="outlined"
                  color="secondary"
                  onClick={() => window.open(wallet.downloadUrl, '_blank')}
                  startIcon={<Download />}
                  sx={{ minWidth: 120 }}
                >
                  Download
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to check if a wallet is installed
function checkWalletInstalled(walletName: string): boolean {
  const walletNameLower = walletName.toLowerCase();
  
  if (walletNameLower === 'petra') {
    return !!window.petra || !!window.aptos;
  } else if (walletNameLower === 'martian') {
    return !!window.martian;
  } else if (walletNameLower === 'pontem') {
    return !!window.pontem;
  } else if (walletNameLower === 'rise') {
    return !!window.rise;
  }
  
  return false;
}

export default WalletSelector;
