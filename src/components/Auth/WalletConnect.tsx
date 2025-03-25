
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
    setShowWalletSelector
  } = useWallet();
  
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  if (connected) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="bg-muted p-3 rounded-full mb-2">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse-light" />
            <span className="font-medium">Connected</span>
          </div>
          <p className="text-sm text-muted-foreground">{shortAddress}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-muted p-3 rounded-full">
        <Wallet className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-semibold text-lg">Connect Your Wallet</h2>
      <p className="text-center text-muted-foreground max-w-xs">
        Connect your Aptos wallet to access your NFTs and claim rewards
      </p>
      <Button 
        className="mt-2" 
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
