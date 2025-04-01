
import React, { useState, useEffect } from 'react';
import { Clock, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NFT } from '@/api/types/nft.types';
import { NFT_COLLECTION_NAME, NFT_IMAGE_BASE_URL } from '@/utils/aptos/constants';

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
  if (!nft.isLocked) return null;
  
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center backdrop-blur-sm bg-destructive/10">
      {nft.unlockDate && (
        <div className="flex flex-col items-center p-4 glass rounded-xl shadow-md">
          <p className="text-xs text-muted-foreground mb-1 font-nunito">Unlocks in</p>
          <p className="text-lg font-mono font-semibold mb-2">{formatTimeRemaining(nft.unlockDate)}</p>
          <p className="text-xs text-muted-foreground font-nunito">Days:Hours:Mins</p>
        </div>
      )}
      
      <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium font-nunito bg-destructive/20 text-destructive">
        Locked
      </div>
    </div>
  );
};

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  
  // Get a numeric token ID if possible (for API URL construction)
  const getNumericTokenId = () => {
    if (!nft.tokenId) return null;
    const matches = nft.tokenId.match(/(\d+)$/);
    return matches && matches[1] ? matches[1] : null;
  };
  
  // Generate a fallback image URL based on the token ID for consistency
  const getFallbackImageUrl = () => {
    const hash = nft.tokenId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return `https://picsum.photos/seed/${hash}/300/300`;
  };
  
  const fetchMetadataDirectly = async () => {
    setIsMetadataLoading(true);
    try {
      // Try to extract numeric ID for the API URL
      const numericId = getNumericTokenId();
      
      if (!numericId) {
        console.log(`Couldn't extract numeric ID from ${nft.tokenId}, using fallback`);
        setImageUrl(getFallbackImageUrl());
        return false;
      }
      
      const metadataUrl = `${NFT_IMAGE_BASE_URL}${numericId}.json`;
      console.log(`NFT Card fetching metadata from: ${metadataUrl}`);
      
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        console.error(`Metadata fetch failed with status: ${response.status}`);
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      
      const metadata = await response.json();
      console.log('NFT Card parsed metadata:', metadata);
      
      if (metadata && metadata.image) {
        console.log(`NFT Card found image in metadata: ${metadata.image}`);
        setImageUrl(metadata.image);
        return true;
      } else {
        console.log('No image found in metadata, using fallback');
        setImageUrl(getFallbackImageUrl());
        return false;
      }
    } catch (error) {
      console.error(`Error fetching metadata for ${nft.tokenId}:`, error);
      setImageUrl(getFallbackImageUrl());
      return false;
    } finally {
      setIsMetadataLoading(false);
    }
  };
  
  useEffect(() => {
    // Reset states when NFT changes
    setImageError(false);
    setImageLoaded(false);
    setRetryCount(0);
    setIsMetadataLoading(false);
    
    const loadImage = async () => {
      // First try: If the NFT already has a valid image URL that looks like a proper image
      if (nft.imageUrl && nft.imageUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
        console.log(`NFT Card using provided image URL: ${nft.imageUrl}`);
        setImageUrl(nft.imageUrl);
        return;
      }
      
      // Second try: Look for a numeric ID and use it to fetch metadata
      const numericId = getNumericTokenId();
      if (numericId) {
        console.log(`NFT Card has numeric ID ${numericId}, fetching metadata directly`);
        await fetchMetadataDirectly();
      } else if (nft.imageUrl) {
        // Third try: Use whatever image URL was provided
        console.log(`NFT Card using existing image URL: ${nft.imageUrl}`);
        setImageUrl(nft.imageUrl);
      } else {
        // Last resort: Use fallback
        console.log(`No viable image source for NFT ${nft.tokenId}, using fallback`);
        setImageUrl(getFallbackImageUrl());
      }
    };
    
    loadImage();
  }, [nft]);
  
  const handleImageError = async () => {
    console.log(`Image failed to load: ${imageUrl}`);
    
    // If we have retries left, try to fetch the metadata again
    if (retryCount < 2) {
      console.log(`Retrying image load (${retryCount + 1}/2)`);
      setRetryCount(prev => prev + 1);
      
      // Try direct metadata fetch as a last resort
      const success = await fetchMetadataDirectly();
      
      if (!success) {
        setImageError(true);
        setImageUrl(getFallbackImageUrl());
      }
    } else {
      // If we've exhausted retries, show error state
      setImageError(true);
      setImageUrl(getFallbackImageUrl());
    }
    
    setImageLoaded(true);
  };
  
  return (
    <div className="nft-card glass border border-jungle-700/20 overflow-hidden hover:shadow-glow transition-all hover:translate-y-[-2px]">
      <div className="relative w-full h-48">
        {(isMetadataLoading || (!imageLoaded && !imageError)) && (
          <div className="w-full h-48 flex items-center justify-center bg-jungle-700/10">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {imageError && (
          <div className="w-full h-48 flex flex-col items-center justify-center bg-jungle-700/10 gap-2">
            <ImageOff className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </div>
        )}
        
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={`${NFT_COLLECTION_NAME} #${nft.tokenId.substring(nft.tokenId.length - 6)}`}
            className={`w-full h-48 object-cover transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        )}
        
        {/* Only show the overlay if the NFT is locked */}
        {nft.isLocked && <NFTCardOverlay nft={nft} />}
      </div>
      
      <div className="p-4 font-nunito text-center">
        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
          {NFT_COLLECTION_NAME}
        </Badge>
      </div>
    </div>
  );
};

export default NFTCard;
