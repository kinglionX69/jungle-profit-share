
import React from 'react';
import { useUser } from '@/context/UserContext';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const NFTGrid: React.FC = () => {
  const { nfts, loadingNfts } = useUser();
  
  // Format time remaining as DD:HH:MM
  const formatTimeRemaining = (unlockDate?: Date) => {
    if (!unlockDate) return '';
    
    const now = new Date();
    const diff = unlockDate.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  if (loadingNfts) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="rounded-lg border overflow-hidden bg-card">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (nfts.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">No NFTs Found</h3>
        <p className="text-muted-foreground mt-2">
          We couldn't find any Proud Lions Club NFTs in your wallet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <div key={nft.tokenId} className="rounded-lg border overflow-hidden bg-card hover:shadow-soft transition-all hover-lift">
          <div className="relative">
            <img 
              src={nft.imageUrl} 
              alt={nft.name} 
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            
            {/* Status overlay */}
            <div className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center backdrop-blur-sm ${
              nft.isEligible 
                ? 'bg-success/10' 
                : nft.isLocked 
                  ? 'bg-destructive/10' 
                  : 'bg-warning/10'
            }`}>
              {nft.isEligible && (
                <div className="bg-white/90 dark:bg-black/80 rounded-full p-3">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
              )}
              
              {nft.isLocked && (
                <div className="flex flex-col items-center p-4 bg-white/90 dark:bg-black/80 rounded-xl">
                  {nft.unlockDate && (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">Unlocks in</p>
                      <p className="text-lg font-mono font-semibold mb-2">{formatTimeRemaining(nft.unlockDate)}</p>
                      <p className="text-xs text-muted-foreground">Days:Hours:Mins</p>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Status indicator */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium 
              ${nft.isEligible 
                ? 'bg-success/20 text-success' 
                : nft.isLocked 
                  ? 'bg-destructive/20 text-destructive' 
                  : 'bg-warning/20 text-warning'
              }`}
            >
              {nft.isEligible ? 'Eligible' : 'Locked'}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium truncate">{nft.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">Token ID: {nft.tokenId}</p>
            
            <div className="flex items-center mt-2">
              {nft.isEligible ? (
                <div className="flex items-center text-success text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Available for claim
                </div>
              ) : nft.isLocked ? (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Locked for 30 days
                </div>
              ) : (
                <div className="flex items-center text-destructive text-sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  Not eligible
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGrid;
