
import { BlockchainNFT } from "./types";
import { NFT_IMAGE_BASE_URL } from "./constants";

/**
 * Helper function to resolve NFT image URLs by fetching and parsing metadata
 * @param uri The metadata URI from the NFT
 * @returns A resolved image URL
 */
export const resolveImageUrl = async (uri: string): Promise<string> => {
  if (!uri) return "https://picsum.photos/seed/default/300/300";
  
  try {
    console.log(`Resolving image URL: ${uri}`);
    
    // Handle the specific format for Proud Lions Club NFTs
    if (uri.includes(NFT_IMAGE_BASE_URL)) {
      console.log(`Using existing NFT_IMAGE_BASE_URL: ${uri}`);
      return uri; // Already in correct format
    }
    
    // Check if URI is already an image URL
    if (uri.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
      console.log(`Using direct image URL: ${uri}`);
      return uri;
    }
    
    // If URI is IPFS, convert to HTTP gateway URL
    if (uri.startsWith('ipfs://')) {
      const ipfsUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      console.log(`Converted IPFS URL: ${ipfsUrl}`);
      return ipfsUrl;
    }
    
    // If URI is HTTP/HTTPS and looks like JSON, try to fetch metadata
    if (uri.startsWith('http')) {
      try {
        console.log(`Attempting to fetch metadata from: ${uri}`);
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const metadata = await response.json();
          console.log('Metadata fetched:', metadata);
          
          // Extract image URL from metadata
          if (metadata.image) {
            console.log(`Found image in metadata: ${metadata.image}`);
            // Return the image URL directly without recursive resolution
            return metadata.image;
          } else if (metadata.uri) {
            console.log(`Found uri in metadata: ${metadata.uri}`);
            return resolveImageUrl(metadata.uri);
          } else if (metadata.imageUrl) {
            console.log(`Found imageUrl in metadata: ${metadata.imageUrl}`);
            return metadata.imageUrl;
          } else if (metadata.image_url) {
            console.log(`Found image_url in metadata: ${metadata.image_url}`);
            return metadata.image_url;
          }
        } else {
          // If not JSON but an image, return the URI
          if (contentType && contentType.includes('image/')) {
            console.log(`URI points directly to an image: ${uri}`);
            return uri;
          }
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        // Continue to fallback
      }
    }
    
    // If the URI is actually a token ID itself
    if (uri.startsWith('0x')) {
      const constructedUrl = `${NFT_IMAGE_BASE_URL}${uri}`;
      console.log(`Constructed URL from 0x token ID: ${constructedUrl}`);
      return constructedUrl;
    }
    
    // If URI contains a token ID, try to construct the image URL
    const tokenIdMatch = uri.match(/0x[a-fA-F0-9]+/);
    if (tokenIdMatch) {
      const constructedUrl = `${NFT_IMAGE_BASE_URL}${tokenIdMatch[0]}`;
      console.log(`Constructed URL from token ID: ${constructedUrl}`);
      return constructedUrl;
    }
    
    // Handle numeric token IDs
    if (!isNaN(Number(uri))) {
      const constructedUrl = `${NFT_IMAGE_BASE_URL}${uri}.json`;
      console.log(`Constructed URL from numeric token ID: ${constructedUrl}`);
      
      // Try to fetch the metadata from the constructed URL
      try {
        const response = await fetch(constructedUrl);
        if (response.ok) {
          const metadata = await response.json();
          if (metadata.image) {
            console.log(`Found image in token metadata: ${metadata.image}`);
            return metadata.image;
          }
        }
      } catch (error) {
        console.error(`Error fetching metadata from constructed URL: ${constructedUrl}`, error);
      }
    }
    
    // Generate a consistent random image based on the URI
    const hash = uri.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const fallbackUrl = `https://picsum.photos/seed/${hash}/300/300`;
    console.log(`Using fallback image: ${fallbackUrl}`);
    return fallbackUrl;
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
  
  const resolvedNfts = await Promise.all(nfts.map(async (nft) => {
    // First, ensure we have some kind of imageUrl to work with
    if (!nft.imageUrl) {
      console.log(`No imageUrl found for NFT ${nft.tokenId}, checking URI or token_uri`);
      
      // Try to use uri or token_uri if available
      if (nft.uri) {
        nft.imageUrl = nft.uri;
      } else if (nft.token_uri) {
        nft.imageUrl = nft.token_uri;
      } else {
        // Extract token ID from the tokenId string if it's not already an image URL
        let tokenId = nft.tokenId;
        
        // Try to extract a token ID from the string
        const match = nft.tokenId.match(/0x[a-fA-F0-9]+/);
        if (match) {
          tokenId = match[0];
        }
        
        console.log(`Constructing image URL for token ${tokenId}`);
        nft.imageUrl = `${NFT_IMAGE_BASE_URL}${tokenId}.json`;
      }
    }
    
    // Now resolve the image URL
    try {
      const resolvedUrl = await resolveImageUrl(nft.imageUrl);
      console.log(`Resolved ${nft.imageUrl} to ${resolvedUrl}`);
      
      return {
        ...nft,
        imageUrl: resolvedUrl
      };
    } catch (error) {
      console.error(`Failed to resolve image for NFT ${nft.tokenId}:`, error);
      // Fall back to a deterministic random image based on token ID
      const hash = nft.tokenId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      return {
        ...nft,
        imageUrl: `https://picsum.photos/seed/${hash}/300/300`
      };
    }
  }));
  
  return resolvedNfts;
}
