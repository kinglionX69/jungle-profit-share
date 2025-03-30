
import React from 'react';
import { useUser } from '@/context/UserContext';
import NFTCard from './components/NFTCard';
import NFTGridSkeleton from './components/NFTGridSkeleton';
import NFTEmptyState from './components/NFTEmptyState';
import MockDataAlert from './components/MockDataAlert';

interface NFTGridProps {
  filterEligible?: boolean;
}

const NFTGrid: React.FC<NFTGridProps> = ({ filterEligible = false }) => {
  const { nfts, loadingNfts } = useUser();
  
  // Check if we're showing mock data
  const isMockData = nfts.some(nft => 
    nft.tokenId.includes('mock') || 
    nft.tokenId.includes('error') || 
    nft.name.includes('Mock')
  );
  
  // Filter NFTs based on the filterEligible prop
  const filteredNfts = filterEligible 
    ? nfts.filter(nft => nft.isEligible)
    : nfts;
  
  if (loadingNfts) {
    return <NFTGridSkeleton />;
  }
  
  if (filteredNfts.length === 0) {
    return <NFTEmptyState filterEligible={filterEligible} />;
  }
  
  return (
    <div className="space-y-4">
      {isMockData && <MockDataAlert />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredNfts.map((nft) => (
          <NFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    </div>
  );
};

export default NFTGrid;
