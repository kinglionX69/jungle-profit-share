
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
    
    // If URI is a token ID or not a URL, try to fetch from the Proud Lions API
    if (uri.startsWith('0x') || !uri.startsWith('http')) {
      // Extract token ID from the string
      const tokenId = uri.match(/0x[a-fA-F0-9]+/)?.[0] || uri;
      const metadataUrl = `${NFT_IMAGE_BASE_URL}${tokenId}`;
      console.log(`Constructed metadata URL: ${metadataUrl}`);
      
      try {
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          console.log(`Metadata fetch failed with status: ${response.status}`);
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        // Parse the JSON response
        const metadata = await response.json();
        console.log('Parsed metadata successfully:', metadata);
        
        if (metadata && metadata.image) {
          console.log(`Found image in metadata: ${metadata.image}`);
          
          // Handle IPFS URLs from metadata
          if (metadata.image.startsWith('ipfs://')) {
            return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          return metadata.image;
        } else {
          console.log('No image field found in metadata:', metadata);
        }
      } catch (error) {
        console.error(`Error fetching metadata from ${metadataUrl}:`, error);
      }
    }
    
    // If URI is HTTP/HTTPS, try to fetch metadata
    if (uri.startsWith('http')) {
      try {
        console.log(`Attempting to fetch metadata from: ${uri}`);
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        // Try to parse as JSON
        const metadata = await response.json();
        console.log('Parsed HTTP metadata:', metadata);
        
        // Extract image URL from metadata
        if (metadata.image) {
          console.log(`Found image in HTTP metadata: ${metadata.image}`);
          
          // Handle IPFS URLs from metadata
          if (metadata.image.startsWith('ipfs://')) {
            return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          return metadata.image;
        }
      } catch (error) {
        console.error("Error fetching HTTP metadata:", error);
      }
    }
    
    // Generate a consistent fallback image based on the URI
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
        // Try to extract a token ID from the string
        const tokenId = nft.tokenId.match(/0x[a-fA-F0-9]+/)?.[0] || nft.tokenId;
        console.log(`Using token ID for metadata lookup: ${tokenId}`);
        nft.imageUrl = tokenId;
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
