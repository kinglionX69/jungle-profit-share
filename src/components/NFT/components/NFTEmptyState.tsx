
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import { Button } from '@/components/ui/button';

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
      error: "No NFTs found"
    };
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => alert("Debug info copied to clipboard"))
      .catch(err => console.error("Failed to copy debug info", err));
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
          <li>• Making sure your wallet is connected to the Aptos Testnet</li>
          <li>• Using a different browser or device</li>
        </ul>
        <div className="mt-6 flex gap-4 justify-center">
          <Button variant="outline" size="sm" onClick={copyDebugInfo}>
            Copy Debug Info
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://explorer.aptoslabs.com/', '_blank')}
          >
            Open Aptos Explorer
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Add ?debug=true to the URL for more diagnostic information
        </p>
      </div>
    </div>
  );
};

export default NFTEmptyState;
