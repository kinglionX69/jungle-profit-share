
import React from 'react';
import { Search, PackageOpen, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/context/UserContext';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

interface NFTEmptyStateProps {
  filterEligible?: boolean;
}

const NFTEmptyState: React.FC<NFTEmptyStateProps> = ({ filterEligible = false }) => {
  const { fetchUserData } = useUser();
  
  return (
    <Card className="glass border border-jungle-700/20">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 bg-amber-500/10 text-amber-400 rounded-full mb-4">
          {filterEligible ? (
            <Search className="h-10 w-10" />
          ) : (
            <PackageOpen className="h-10 w-10" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2 font-poppins">
          {filterEligible 
            ? 'No Eligible NFTs Found' 
            : `No ${NFT_COLLECTION_NAME} NFTs Found`}
        </h3>
        
        <p className="text-muted-foreground text-center max-w-md mb-6 font-nunito">
          {filterEligible
            ? 'You don\'t have any NFTs eligible for claiming rewards at this time.'
            : `We couldn't find any ${NFT_COLLECTION_NAME} NFTs in your wallet.`}
        </p>
        
        <div className="space-y-2 w-full max-w-xs">
          <Button 
            variant="outline" 
            className="w-full justify-center border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => fetchUserData()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh NFTs
          </Button>
          
          {!filterEligible && (
            <div className="text-sm text-muted-foreground mt-4 space-y-2 text-left">
              <p className="font-semibold font-poppins">Troubleshooting Tips:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs font-nunito">
                <li>Make sure your wallet contains Proud Lions Club NFTs</li>
                <li>Check that you're connected with the correct wallet</li>
                <li>Try refreshing your browser and reconnecting</li>
                <li>The blockchain network might be congested, try again later</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTEmptyState;
