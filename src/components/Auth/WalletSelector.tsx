
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md border-jungle-700/20">
        <DialogHeader>
          <DialogTitle className="font-poppins">Connect Your Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {walletOptions.map((wallet) => (
            <div 
              key={wallet.name} 
              className="flex items-center justify-between p-3 border border-jungle-700/20 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-black/20 overflow-hidden">
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} wallet`} 
                    className="w-6 h-6 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
                <span className="font-medium font-nunito">{wallet.name}</span>
              </div>
              
              {wallet.isInstalled ? (
                <Button 
                  size="sm"
                  onClick={() => onSelectWallet(wallet.name.toLowerCase())}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                >
                  Connect
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(wallet.downloadUrl, '_blank')}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
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
