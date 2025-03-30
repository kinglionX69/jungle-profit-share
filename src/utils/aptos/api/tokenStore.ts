import { BlockchainNFT } from "../types";
import { CREATOR_ADDRESS } from "../constants";

/**
 * Extract tokens from a TokenStore resource
 * @param walletAddress The wallet address
 * @param tokenStoreResource The TokenStore resource
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the TokenStore
 */
export async function extractTokensFromResource(
  walletAddress: string, 
  tokenStoreResource: any,
  collectionName: string
): Promise<BlockchainNFT[]> {
  const tokens: BlockchainNFT[] = [];
  
  try {
    // Look for tokens in the store that match our collection
    if (tokenStoreResource.data) {
      // Handle different token store data structures
      let tokenMap = null;
      
      // V1 format
      if (tokenStoreResource.data.tokens) {
        tokenMap = tokenStoreResource.data.tokens.tokens || tokenStoreResource.data.tokens;
        console.log("Found tokens in V1 TokenStore format");
      } 
      // V2 format
      else if (tokenStoreResource.data.token_data) {
        tokenMap = tokenStoreResource.data.token_data;
        console.log("Found tokens in V2 TokenStore format");
      }
      // Other potential formats
      else if (tokenStoreResource.data.data) {
        tokenMap = tokenStoreResource.data.data.tokens || tokenStoreResource.data.data;
        console.log("Found tokens in alternative TokenStore format");
      }
      
      if (tokenMap && typeof tokenMap === 'object') {
        console.log("Processing tokens from TokenStore");
        
        // Process each token to find matches for our collection
        for (const [tokenId, tokenData] of Object.entries(tokenMap)) {
          // Check if this token belongs to our collection by ID, name, or creator
          if (
            tokenId.includes(collectionName) || 
            tokenId.includes(process.env.NFT_COLLECTION_ID || '') || 
            tokenId.includes(CREATOR_ADDRESS)
          ) {
            console.log(`Found matching token: ${tokenId}`);
            
            try {
              // Use properly type-guarded access for tokenData properties
              // First check if tokenData is an object
              if (tokenData && typeof tokenData === 'object') {
                // Using type assertion with 'as' and 'in' operator for safe property access
                const tokenObj = tokenData as Record<string, any>;
                
                const name = 'name' in tokenObj && typeof tokenObj.name === 'string'
                  ? tokenObj.name
                  : `Proud Lion #${tokenId.substring(0, 6)}`;
                  
                const imageUrl = 'uri' in tokenObj && typeof tokenObj.uri === 'string'
                  ? tokenObj.uri
                  : "";
                  
                const creator = 'creator' in tokenObj && typeof tokenObj.creator === 'string'
                  ? tokenObj.creator
                  : CREATOR_ADDRESS;
                  
                const properties = 'properties' in tokenObj && tokenObj.properties
                  ? JSON.stringify(tokenObj.properties)
                  : "{}";
                  
                tokens.push({
                  tokenId: tokenId,
                  name: name,
                  imageUrl: imageUrl,
                  creator: creator,
                  standard: "v2",
                  properties: properties
                });
              } else {
                // If tokenData is not an object, create a minimal NFT with defaults
                tokens.push({
                  tokenId: tokenId,
                  name: `Proud Lion #${tokenId.substring(0, 6)}`,
                  imageUrl: "",
                  creator: CREATOR_ADDRESS,
                  standard: "v2",
                  properties: "{}"
                });
              }
            } catch (tokenError) {
              console.error(`Error processing token ${tokenId}:`, tokenError);
            }
          }
        }
      }
    }
  } catch (extractError) {
    console.error("Error extracting tokens from resource:", extractError);
  }
  
  return tokens;
}
