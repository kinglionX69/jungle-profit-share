
import React from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { Wallet } from 'lucide-react';
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
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="bg-amber-500/20 p-3 rounded-full mb-2">
          <Wallet className="h-8 w-8 text-amber-400" />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse-light" />
            <span className="font-medium">Connected {walletName && `(${walletName})`}</span>
          </div>
          <p className="text-sm text-muted-foreground">{shortAddress}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-amber-500/20 p-3 rounded-full">
        <Wallet className="h-8 w-8 text-amber-400" />
      </div>
      <h2 className="font-semibold text-lg font-poppins">Connect Your Wallet</h2>
      <p className="text-center text-muted-foreground max-w-xs font-nunito">
        Connect your Aptos wallet to access your NFTs and claim rewards
      </p>
      <Button 
        className="mt-2 bg-amber-500 hover:bg-amber-600 text-black font-medium shadow-glow hover:shadow-glow" 
        size="lg"
        onClick={connect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onSelectWallet={connectWallet}
      />
    </div>
  );
};

export default WalletConnect;
