
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

interface NFTEmptyStateProps {
  filterEligible: boolean;
}

const NFTEmptyState: React.FC<NFTEmptyStateProps> = ({ filterEligible }) => {
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
            </ul>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="text-center py-10 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Debugging Information</h3>
        <p className="text-muted-foreground mt-2">
          Check the browser console for more details (F12 &gt; Console)
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Try adding ?debug=true to the URL for more information
        </p>
      </div>
    </div>
  );
};

export default NFTEmptyState;
