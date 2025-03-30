import { BlockchainNFT } from "../types";
import { CREATOR_ADDRESS, NFT_COLLECTION_NAME, NFT_COLLECTION_ID } from "../constants";

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
    console.log("Extracting tokens from resource:", JSON.stringify(tokenStoreResource, null, 2).slice(0, 500) + "...");
    
    // Look for tokens in the store that match our collection
    if (!tokenStoreResource.data) {
      console.error("TokenStore resource has no data property");
      return tokens;
    }
    
    // Handle different token store data structures
    let tokenMap = null;
    
    // Try multiple possible structures
    const possiblePaths = [
      // V1 format
      tokenStoreResource.data.tokens?.tokens,
      tokenStoreResource.data.tokens,
      // V2 format
      tokenStoreResource.data.token_data,
      // Other potential formats
      tokenStoreResource.data.data?.tokens,
      tokenStoreResource.data.data,
      // Direct access
      tokenStoreResource.data
    ];
    
    // Find the first valid token map
    for (const path of possiblePaths) {
      if (path && typeof path === 'object' && !Array.isArray(path)) {
        tokenMap = path;
        console.log("Found tokens using format:", path === tokenStoreResource.data.tokens?.tokens ? "V1-nested" :
                                               path === tokenStoreResource.data.tokens ? "V1-flat" :
                                               path === tokenStoreResource.data.token_data ? "V2" :
                                               path === tokenStoreResource.data.data?.tokens ? "alt-nested" :
                                               path === tokenStoreResource.data.data ? "alt-flat" : "direct");
        break;
      }
    }
    
    if (!tokenMap) {
      console.error("Could not find valid token map in resource");
      return tokens;
    }
    
    console.log(`Processing tokens map with ${Object.keys(tokenMap).length} entries`);
    
    // Process each token to find matches for our collection
    for (const [tokenId, tokenData] of Object.entries(tokenMap)) {
      const lowerTokenId = tokenId.toLowerCase();
      const lowerCollectionName = collectionName.toLowerCase();
      const lowerCollectionId = NFT_COLLECTION_ID?.toLowerCase() || '';
      const lowerCreatorAddress = CREATOR_ADDRESS.toLowerCase();
      
      // Check if this token belongs to our collection by ID, name, or creator
      const matchesCollection = 
        lowerTokenId.includes(lowerCollectionName) || 
        (lowerCollectionId && lowerTokenId.includes(lowerCollectionId)) || 
        lowerTokenId.includes(lowerCreatorAddress);
        
      if (matchesCollection) {
        console.log(`Found potentially matching token: ${tokenId}`);
        
        try {
          // Create a standard NFT entry with available data
          const nft: BlockchainNFT = {
            tokenId: tokenId,
            name: `${NFT_COLLECTION_NAME} #${tokenId.substring(0, 6)}`,
            imageUrl: "",
            creator: CREATOR_ADDRESS,
            standard: "v2",
            properties: "{}"
          };
          
          // Try to extract additional data if available
          if (tokenData && typeof tokenData === 'object') {
            const tokenObj = tokenData as Record<string, any>;
            
            // Name extraction
            if ('name' in tokenObj && typeof tokenObj.name === 'string') {
              nft.name = tokenObj.name;
            }
            
            // URI/Image extraction - multiple possible property names
            const uriProperties = ['uri', 'metadata_uri', 'image', 'content_uri'];
            for (const prop of uriProperties) {
              if (prop in tokenObj && typeof tokenObj[prop] === 'string') {
                nft.imageUrl = tokenObj[prop];
                break;
              }
            }
            
            // Creator extraction
            if ('creator' in tokenObj && typeof tokenObj.creator === 'string') {
              nft.creator = tokenObj.creator;
            }
            
            // Properties extraction
            if ('properties' in tokenObj) {
              try {
                nft.properties = typeof tokenObj.properties === 'string' 
                  ? tokenObj.properties 
                  : JSON.stringify(tokenObj.properties);
              } catch (e) {
                nft.properties = "{}";
              }
            }
          }
          
          tokens.push(nft);
          console.log(`Added token: ${nft.name} with ID ${nft.tokenId}`);
        } catch (tokenError) {
          console.error(`Error processing token ${tokenId}:`, tokenError);
        }
      }
    }
    
    console.log(`Extracted ${tokens.length} tokens from resource`);
  } catch (extractError) {
    console.error("Error extracting tokens from resource:", extractError);
  }
  
  return tokens;
}
