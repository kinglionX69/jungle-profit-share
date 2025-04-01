
import { BlockchainNFT } from "./types";
import { NFT_IMAGE_BASE_URL } from "./constants";

/**
 * Helper function to resolve NFT image URLs
 * @param uri The metadata URI from the NFT
 * @returns A resolved image URL
 */
export const resolveImageUrl = async (uri: string): Promise<string> => {
  if (!uri) return "https://picsum.photos/seed/default/300/300";
  
  try {
    // Handle the specific format for Proud Lions Club NFTs
    if (uri.includes(NFT_IMAGE_BASE_URL)) {
      return uri; // Already in correct format
    }
    
    // Check if URI is already an image URL
    if (uri.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return uri;
    }
    
    // If URI is IPFS, convert to HTTP gateway URL
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // If URI contains a token ID, try to construct the image URL
    const tokenIdMatch = uri.match(/0x[a-fA-F0-9]+/);
    if (tokenIdMatch) {
      return `${NFT_IMAGE_BASE_URL}${tokenIdMatch[0]}`;
    }
    
    // If the URI is actually a token ID itself
    if (uri.startsWith('0x')) {
      return `${NFT_IMAGE_BASE_URL}${uri}`;
    }
    
    // If URI is HTTP/HTTPS, try to fetch metadata
    if (uri.startsWith('http')) {
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        const metadata = await response.json();
        if (metadata.image) {
          // If metadata contains image URL, resolve it recursively
          return resolveImageUrl(metadata.image);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        // Continue to fallback
      }
    }
    
    // Fallback to random image
    return "https://picsum.photos/seed/lion/300/300";
  } catch (error) {
    console.error("Error resolving image URL:", error);
    return "https://picsum.photos/seed/default/300/300";
  }
};

/**
 * Process NFT image URLs for an array of NFTs
 * @param nfts Array of NFTs to process images for
 * @returns Array of NFTs with resolved image URLs
 */
export async function resolveNFTImages(nfts: BlockchainNFT[]): Promise<BlockchainNFT[]> {
  console.log("Resolving images for", nfts.length, "NFTs");
  
  return await Promise.all(nfts.map(async (nft) => {
    // Extract token ID from the tokenId string if it's not already an image URL
    if (!nft.imageUrl || !nft.imageUrl.startsWith('http')) {
      let tokenId = nft.tokenId;
      
      // Try to extract a token ID from the string
      const match = nft.tokenId.match(/0x[a-fA-F0-9]+/);
      if (match) {
        tokenId = match[0];
      }
      
      console.log(`Constructing image URL for token ${tokenId}`);
      nft.imageUrl = `${NFT_IMAGE_BASE_URL}${tokenId}`;
    }
    
    // Resolve the image URL
    const resolvedUrl = await resolveImageUrl(nft.imageUrl);
    console.log(`Resolved ${nft.imageUrl} to ${resolvedUrl}`);
    
    return {
      ...nft,
      imageUrl: resolvedUrl
    };
  }));
}
