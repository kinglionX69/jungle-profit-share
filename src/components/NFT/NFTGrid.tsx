
import React from 'react';
import { useUser } from '@/context/UserContext';
import NFTCard from './components/NFTCard';
import NFTGridSkeleton from './components/NFTGridSkeleton';
import NFTEmptyState from './components/NFTEmptyState';
import { Loader } from 'lucide-react';

interface NFTGridProps {
  filterEligible?: boolean;
}

const NFTGrid: React.FC<NFTGridProps> = ({ filterEligible = false }) => {
  const { nfts, loadingNfts } = useUser();
  
  // Filter NFTs based on the filterEligible prop
  const filteredNfts = filterEligible 
    ? nfts.filter(nft => nft.isEligible)
    : nfts;
  
  if (loadingNfts) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <NFTGridSkeleton />
        <div className="mt-6 flex items-center justify-center text-muted-foreground">
          <Loader className="h-5 w-5 animate-spin mr-2" />
          <span>Searching for Proud Lion NFTs in your wallet...</span>
        </div>
      </div>
    );
  }
  
  if (filteredNfts.length === 0) {
    return <NFTEmptyState filterEligible={filterEligible} />;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {filteredNfts.map((nft) => (
        <NFTCard key={nft.tokenId} nft={nft} />
      ))}
    </div>
  );
};

export default NFTGrid;
