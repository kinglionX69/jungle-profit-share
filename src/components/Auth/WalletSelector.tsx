
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

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
    icon: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=64&h=64&q=80',
    downloadUrl: 'https://petra.app',
  },
  {
    name: 'Martian',
    icon: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=64&h=64&q=80',
    downloadUrl: 'https://martianwallet.xyz',
  },
  {
    name: 'Pontem',
    icon: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=64&h=64&q=80',
    downloadUrl: 'https://pontem.network',
  },
  {
    name: 'Rise',
    icon: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=64&h=64&q=80',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {walletOptions.map((wallet) => (
            <div 
              key={wallet.name} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-background overflow-hidden">
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} wallet`} 
                    className="w-6 h-6 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
                <span className="font-medium">{wallet.name}</span>
              </div>
              
              {wallet.isInstalled ? (
                <Button 
                  size="sm"
                  onClick={() => onSelectWallet(wallet.name.toLowerCase())}
                >
                  Connect
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(wallet.downloadUrl, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to check if a wallet is installed
function checkWalletInstalled(walletName: string): boolean {
  const walletNameLower = walletName.toLowerCase();
  
  if (walletNameLower === 'petra') {
    return !!window.aptos;
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
