
import { BlockchainNFT } from "./types";

/**
 * Helper function to resolve NFT image URLs
 * @param uri The metadata URI from the NFT
 * @returns A resolved image URL
 */
export const resolveImageUrl = async (uri: string): Promise<string> => {
  if (!uri) return "https://picsum.photos/seed/default/300/300";
  
  try {
    // Check if URI is already an image URL
    if (uri.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return uri;
    }
    
    // If URI is IPFS, convert to HTTP gateway URL
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
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
          // If metadata contains image URL, resolve it
          return resolveImageUrl(metadata.image);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        // Continue to fallback
      }
    }
    
    // Fallback
    return "https://picsum.photos/seed/default/300/300";
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
  return await Promise.all(nfts.map(async (nft) => ({
    ...nft,
    imageUrl: await resolveImageUrl(nft.imageUrl)
  })));
}
