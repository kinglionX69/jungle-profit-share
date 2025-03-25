
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
    icon: '/wallet-icons/petra.png',
    downloadUrl: 'https://petra.app/download',
  },
  {
    name: 'Martian',
    icon: '/wallet-icons/martian.png',
    downloadUrl: 'https://martianwallet.xyz/download',
  },
  {
    name: 'Pontem',
    icon: '/wallet-icons/pontem.png',
    downloadUrl: 'https://pontem.network/download',
  },
  {
    name: 'Rise',
    icon: '/wallet-icons/rise.png',
    downloadUrl: 'https://risewallet.io/download',
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
                    className="w-6 h-6"
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
