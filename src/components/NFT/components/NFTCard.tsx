
import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { NFT } from '@/api/types/nft.types';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

interface NFTCardProps {
  nft: NFT;
}

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

const NFTCardOverlay: React.FC<NFTCardProps> = ({ nft }) => {
  return (
    <>
      <div className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center backdrop-blur-sm ${
        nft.isEligible 
          ? 'bg-jungle-700/10' 
          : nft.isLocked 
            ? 'bg-destructive/10' 
            : 'bg-amber-500/10'
      }`}>
        {nft.isEligible && (
          <div className="bg-black/60 rounded-full p-3 shadow-glow animate-pulse-light">
            <CheckCircle className="h-12 w-12 text-amber-400" />
          </div>
        )}
        
        {nft.isLocked && (
          <div className="flex flex-col items-center p-4 glass rounded-xl shadow-md">
            {nft.unlockDate && (
              <>
                <p className="text-xs text-muted-foreground mb-1 font-nunito">Unlocks in</p>
                <p className="text-lg font-mono font-semibold mb-2">{formatTimeRemaining(nft.unlockDate)}</p>
                <p className="text-xs text-muted-foreground font-nunito">Days:Hours:Mins</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium font-nunito
        ${nft.isEligible 
          ? 'bg-jungle-700/20 text-amber-400' 
          : nft.isLocked 
            ? 'bg-destructive/20 text-destructive' 
            : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {nft.isEligible ? 'Eligible' : nft.isLocked ? 'Locked' : 'Not Eligible'}
      </div>
    </>
  );
};

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Generate a fallback image URL based on the token ID for consistency
  const getFallbackImageUrl = () => {
    const hash = nft.tokenId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return `https://picsum.photos/seed/${hash}/300/300`;
  };
  
  return (
    <div className="nft-card glass border border-jungle-700/20 overflow-hidden hover:shadow-glow transition-all hover:translate-y-[-2px]">
      <div className="relative">
        {!imageLoaded && !imageError && (
          <div className="w-full h-48 flex items-center justify-center bg-jungle-700/10">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <img 
          src={imageError ? getFallbackImageUrl() : nft.imageUrl} 
          alt={nft.name} 
          className={`w-full h-48 object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.log(`Image failed to load: ${nft.imageUrl}`);
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        <NFTCardOverlay nft={nft} />
      </div>
      
      <div className="p-4 font-nunito">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium truncate mr-2 text-left font-poppins">{nft.name}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs glass border border-jungle-700/20 shadow-lg">
                <div className="text-xs">
                  <p className="font-semibold mb-1 font-poppins">NFT Details</p>
                  <p>Collection: {NFT_COLLECTION_NAME}</p>
                  <p>Token ID: {nft.tokenId}</p>
                  {nft.standard && <p>Standard: {nft.standard}</p>}
                  {nft.creator && <p>Creator: {nft.creator.substring(0, 10)}...</p>}
                  {nft.isLocked && nft.unlockDate && (
                    <p>Unlock Date: {nft.unlockDate.toLocaleDateString()}</p>
                  )}
                  {nft.imageUrl && (
                    <p className="truncate">Image: {nft.imageUrl.substring(0, 25)}...</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-sm text-muted-foreground text-left">Token ID: {nft.tokenId.substring(0, 12)}...</p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center">
            {nft.isEligible ? (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                <CheckCircle className="h-3 w-3 mr-1" />
                Available
              </Badge>
            ) : nft.isLocked ? (
              <Badge variant="outline" className="text-muted-foreground border-muted">
                <Clock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive/30">
                <XCircle className="h-3 w-3 mr-1" />
                Ineligible
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
            {NFT_COLLECTION_NAME}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
