
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
    console.log(`Resolving image URL for: ${uri}`);
    
    // Extract token ID from URI if possible
    let tokenId = "";
    if (uri.match(/0x[a-fA-F0-9]+/)) {
      tokenId = uri.match(/0x[a-fA-F0-9]+/)?.[0] || "";
    } else if (uri.match(/\d+/)) {
      // Extract numbers if they appear to be a token ID
      tokenId = uri.match(/\d+/)?.[0] || "";
    }
    
    console.log(`Extracted token ID: ${tokenId}`);
    
    // Build the metadata URL with the token ID
    // Format: https://api.proudlionsclub.com/tokenids/5000.json
    const metadataUrl = `${NFT_IMAGE_BASE_URL}${tokenId}.json`;
    console.log(`Attempting to fetch metadata from: ${metadataUrl}`);
    
    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        console.error(`Metadata fetch failed with status: ${response.status}`);
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      
      // Parse the JSON response
      const metadata = await response.json();
      console.log('Successfully parsed metadata:', metadata);
      
      if (metadata && metadata.image) {
        console.log(`Found image URL in metadata: ${metadata.image}`);
        return metadata.image;
      } else {
        console.log('No image field found in metadata');
        
        // Try alternative image sources in the metadata
        const alternativeImageSources = ['image_url', 'image_uri', 'imageUrl', 'imageURI'];
        for (const source of alternativeImageSources) {
          if (metadata[source]) {
            console.log(`Found alternative image source (${source}): ${metadata[source]}`);
            return metadata[source];
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching metadata from ${metadataUrl}:`, error);
    }
    
    // If we couldn't get metadata or the specific token format needed, try direct image formats
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
    let imageSource = nft.imageUrl || nft.uri || nft.token_uri || nft.tokenId;
    console.log(`Processing NFT ${nft.tokenId} with image source: ${imageSource}`);
    
    try {
      // For Proud Lions Club NFTs, we need to extract the numeric ID
      // This handles tokenIds like "0x123" or full IDs
      let numericId = "";
      
      if (typeof nft.tokenId === 'string') {
        // Try to extract a numeric ID from the tokenId
        const matches = nft.tokenId.match(/(\d+)$/);
        if (matches && matches[1]) {
          numericId = matches[1];
          console.log(`Extracted numeric ID ${numericId} from tokenId ${nft.tokenId}`);
        }
      }
      
      // If we have a numeric ID, use that directly with the base URL
      if (numericId) {
        const specificMetadataUrl = `${NFT_IMAGE_BASE_URL}${numericId}.json`;
        console.log(`Trying specific metadata URL: ${specificMetadataUrl}`);
        
        try {
          const response = await fetch(specificMetadataUrl);
          if (response.ok) {
            const metadata = await response.json();
            if (metadata && metadata.image) {
              console.log(`Found direct image from numeric ID: ${metadata.image}`);
              return {
                ...nft,
                imageUrl: metadata.image
              };
            }
          }
        } catch (metadataError) {
          console.error(`Error fetching specific metadata for ${numericId}:`, metadataError);
        }
      }
      
      // If specific approach failed, fall back to general resolver
      const resolvedUrl = await resolveImageUrl(imageSource);
      console.log(`Resolved ${imageSource} to ${resolvedUrl}`);
      
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
