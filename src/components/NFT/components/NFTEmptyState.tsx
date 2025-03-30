
import React from 'react';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NFT_COLLECTION_NAME, APTOS_API, IS_TESTNET } from '@/utils/aptos/constants';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NFTEmptyStateProps {
  filterEligible: boolean;
}

const NFTEmptyState: React.FC<NFTEmptyStateProps> = ({ filterEligible }) => {
  // Function to copy debug info to clipboard
  const copyDebugInfo = () => {
    const debugInfo = {
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      collection: NFT_COLLECTION_NAME,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      error: "No NFTs found",
      network: IS_TESTNET ? "testnet" : "mainnet",
      apiEndpoint: APTOS_API
    };
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => toast.success("Debug info copied to clipboard"))
      .catch(err => {
        console.error("Failed to copy debug info", err);
        toast.error("Failed to copy debug info");
      });
  };
  
  return (
    <div className="space-y-4">
      <Alert variant="default">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>No NFTs Found</AlertTitle>
        <AlertDescription>
          {filterEligible ? 
            `We couldn't find any eligible NFTs for claiming. This could be because all your NFTs are currently locked or you don't own any NFTs from the ${NFT_COLLECTION_NAME} collection.` :
            `We couldn't find any ${NFT_COLLECTION_NAME} NFTs in your wallet. This could be due to:`}
          {!filterEligible && (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You don't own any NFTs from the {NFT_COLLECTION_NAME} collection</li>
              <li>There might be connection issues with the Aptos blockchain</li>
              <li>The wallet might not be properly connected</li>
              <li>The NFTs might be stored in a different format or standard</li>
            </ul>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="text-center py-10 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Troubleshooting</h3>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          If you believe this is an error and you should see NFTs, please try:
        </p>
        <ul className="text-sm text-left max-w-lg mx-auto mt-4 space-y-2">
          <li>• Refreshing the page</li>
          <li>• Disconnecting and reconnecting your wallet</li>
          <li>• Making sure your wallet is connected to the {IS_TESTNET ? "Aptos Testnet" : "Aptos Mainnet"}</li>
          <li>• Using a different browser or device</li>
          <li>• Checking if you have NFTs in the {NFT_COLLECTION_NAME} collection</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Button variant="outline" size="sm" onClick={copyDebugInfo} className="flex items-center">
            <Copy className="h-4 w-4 mr-2" />
            Copy Debug Info
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://explorer.aptoslabs.com/', '_blank')}
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Aptos Explorer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Reload the page with debug parameter
              const url = new URL(window.location.href);
              url.searchParams.set('debug', 'true');
              window.location.href = url.toString();
            }}
            className="flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Show Debug Info
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Network: {IS_TESTNET ? "Testnet" : "Mainnet"} | API Endpoint: {APTOS_API.substring(0, 30)}...
        </p>
      </div>
    </div>
  );
};

export default NFTEmptyState;
