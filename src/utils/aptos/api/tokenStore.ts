
import { BlockchainNFT } from "../types";
import { CREATOR_ADDRESS, NFT_COLLECTION_NAME } from "../constants";

// Define an interface for token data to avoid "unknown" type errors
interface TokenData {
  collection_name?: string;
  creator?: string;
  name?: string;
  uri?: string;
  properties?: Record<string, any> | string;
  [key: string]: any; // Allow for other properties
}

/**
 * Extract tokens from a token store resource
 * @param walletAddress The wallet address
 * @param tokenStoreResource The token store resource
 * @param collectionName The collection name to filter by
 * @returns Array of tokens extracted from the resource
 */
export const extractTokensFromResource = async (
  walletAddress: string,
  tokenStoreResource: any,
  collectionName: string
): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Extracting tokens from resource for wallet: ${walletAddress}`);
    
    // Find the token map in the resource (different paths based on token standard)
    let tokenMap = null;
    
    // Try different paths for token data (based on observed resource structures)
    const possiblePaths = [
      tokenStoreResource.data?.tokens?.data?.inner?.handle,
      tokenStoreResource.data?.tokens?.handle,
      tokenStoreResource.data?.tokens?.tokens,
      tokenStoreResource.data?.tokens,
      tokenStoreResource.data?.current_token_ownerships,
      tokenStoreResource.data?.token_data,
      tokenStoreResource.data
    ];
    
    // Try to find valid token map in any of the paths
    for (const path of possiblePaths) {
      if (path && typeof path === 'object') {
        tokenMap = path;
        break;
      }
    }
    
    if (!tokenMap || Object.keys(tokenMap).length === 0) {
      console.log("No tokens found in resource data");
      return [];
    }
    
    console.log(`Found token map with ${Object.keys(tokenMap).length} tokens`);
    
    // Extract tokens from the map
    const tokens: BlockchainNFT[] = [];
    
    // Iterate through token handles
    for (const [tokenId, tokenDataRaw] of Object.entries(tokenMap)) {
      try {
        // Skip empty or invalid entries
        if (!tokenDataRaw) continue;
        
        // Cast tokenData to our interface for type safety
        const tokenData = tokenDataRaw as TokenData;
        
        // Normalize token ID format
        const normalizedTokenId = tokenId.includes('::') ? tokenId.split('::').pop()! : tokenId;
        
        // Check various collection matching conditions
        const matchesCollection = 
          // Match by token ID containing collection name
          normalizedTokenId.toLowerCase().includes(collectionName.toLowerCase()) ||
          // Match by token data containing collection name
          (tokenData.collection_name && 
           tokenData.collection_name.toLowerCase() === collectionName.toLowerCase()) ||
          // Match by creator address in token data
          (tokenData.creator && 
           tokenData.creator.toLowerCase() === CREATOR_ADDRESS.toLowerCase()) ||
          // Match by token ID containing creator address
          normalizedTokenId.toLowerCase().includes(CREATOR_ADDRESS.toLowerCase());
        
        if (matchesCollection) {
          // Create NFT object from token data
          const nft: BlockchainNFT = {
            tokenId: normalizedTokenId,
            name: tokenData.name || `${NFT_COLLECTION_NAME} #${normalizedTokenId.substring(0, 6)}`,
            imageUrl: tokenData.uri || "",
            creator: tokenData.creator || CREATOR_ADDRESS,
            standard: "v2",
            properties: tokenData.properties ? 
              (typeof tokenData.properties === 'string' ? 
                tokenData.properties : 
                JSON.stringify(tokenData.properties)
              ) : "{}"
          };
          
          tokens.push(nft);
          console.log(`Found matching token: ${nft.name} (${nft.tokenId})`);
        }
      } catch (tokenError) {
        console.error(`Error processing token ${tokenId}:`, tokenError);
      }
    }
    
    console.log(`Extracted ${tokens.length} matching tokens from resource`);
    return tokens;
  } catch (error) {
    console.error("Error extracting tokens from resource:", error);
    return [];
  }
};
