import { BlockchainNFT } from "./types";
import { APTOS_API, NFT_COLLECTION_ID, CREATOR_ADDRESS, TOKEN_STORE_ADDRESS } from "./constants";

/**
 * Fallback method to fetch NFTs using the Aptos Node API
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the Node API
 */
export const fetchFromNodeAPI = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress} from collection: ${collectionName}`);
    console.log(`Collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Creator Address: ${CREATOR_ADDRESS}`);
    
    // For testnet, fetch actual data
    const testnetEndpoint = `${APTOS_API}/accounts/${walletAddress}/resources`;
    console.log(`Fetching resources from testnet endpoint: ${testnetEndpoint}`);
    
    const resourcesResponse = await fetch(testnetEndpoint);
    
    if (!resourcesResponse.ok) {
      console.error(`Node API responded with status: ${resourcesResponse.status}`);
      throw new Error(`Node API responded with status: ${resourcesResponse.status}`);
    }
    
    const resources = await resourcesResponse.json();
    
    // Find the TokenStore resource (using both v1 and v2 formats)
    const tokenStoreResource = resources.find((r: any) => {
      return r.type === TOKEN_STORE_ADDRESS || 
             r.type.includes('token::TokenStore') || 
             r.type.includes('::token_store::') || 
             r.type.includes('::token::');
    });
    
    if (!tokenStoreResource) {
      // Try an alternative approach before giving up
      console.log("TokenStore resource not found, trying alternate collection endpoint directly");
      return await tryDirectCollectionEndpoint(walletAddress, collectionName);
    }
    
    console.log("Found TokenStore resource:", tokenStoreResource);
    
    // If we have token data, parse it to find NFTs from our collection
    const tokens: BlockchainNFT[] = await extractTokensFromResource(walletAddress, tokenStoreResource, collectionName);
    
    // If we found tokens from the collection, return them
    if (tokens.length > 0) {
      console.log(`Found ${tokens.length} tokens from Node API`);
      return tokens;
    } 
    
    console.log("No tokens found in TokenStore, trying last resort check");
    
    // Try direct collection endpoint as last resort
    return await tryDirectCollectionEndpoint(walletAddress, collectionName);
  } catch (error) {
    console.error("Error with node API fallback:", error);
    throw error;
  }
};

/**
 * Extract tokens from a TokenStore resource
 * @param walletAddress The wallet address
 * @param tokenStoreResource The TokenStore resource
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the TokenStore
 */
async function extractTokensFromResource(
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
            tokenId.includes(NFT_COLLECTION_ID) || 
            tokenId.includes(CREATOR_ADDRESS)
          ) {
            console.log(`Found matching token: ${tokenId}`);
            
            try {
              // Extract as much data as possible from the token
              const name = typeof tokenData === 'object' && tokenData.name 
                ? tokenData.name 
                : `Proud Lion #${tokenId.substring(0, 6)}`;
                
              const imageUrl = typeof tokenData === 'object' && tokenData.uri 
                ? tokenData.uri 
                : "";
                
              const creator = typeof tokenData === 'object' && tokenData.creator 
                ? tokenData.creator 
                : CREATOR_ADDRESS;
                
              const properties = typeof tokenData === 'object' && tokenData.properties 
                ? JSON.stringify(tokenData.properties) 
                : "{}";
                
              tokens.push({
                tokenId: tokenId,
                name: name,
                imageUrl: imageUrl,
                creator: creator,
                standard: "v2",
                properties: properties
              });
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

/**
 * Try to fetch NFTs directly from the collection endpoint
 * @param walletAddress The wallet address
 * @param collectionName The collection name
 * @returns Array of NFTs from the collection
 */
async function tryDirectCollectionEndpoint(
  walletAddress: string,
  collectionName: string
): Promise<BlockchainNFT[]> {
  try {
    const collectionEndpoint = `${APTOS_API}/accounts/${walletAddress}/collection/${collectionName}`;
    console.log(`Trying direct collection endpoint: ${collectionEndpoint}`);
    
    const collectionResponse = await fetch(collectionEndpoint);
    
    if (collectionResponse.ok) {
      const collectionData = await collectionResponse.json();
      console.log("Collection data:", collectionData);
      
      // If we found the collection, look for tokens
      if (collectionData && collectionData.token_ids && collectionData.token_ids.length > 0) {
        console.log(`Found ${collectionData.token_ids.length} tokens in collection`);
        
        // Map the token IDs to NFT objects
        return collectionData.token_ids.map((tokenId: string) => ({
          tokenId: tokenId,
          name: `Proud Lion #${tokenId.substring(0, 6)}`,
          imageUrl: "",  // We don't have the image URL from this endpoint
          creator: collectionData.creator || CREATOR_ADDRESS,
          standard: "v2",
          properties: "{}"
        }));
      }
    }
    
    // Another approach - try to find NFTs in creator's account that might be in the wallet
    console.log("Trying to get collection info from creator's account");
    
    // Try with the collection in creator's account
    const creatorCollectionEndpoint = `${APTOS_API}/accounts/${CREATOR_ADDRESS}/resource/0x3::token::Collections`;
    console.log(`Checking creator's collections: ${creatorCollectionEndpoint}`);
    
    const creatorCollectionResponse = await fetch(creatorCollectionEndpoint);
    if (creatorCollectionResponse.ok) {
      const creatorCollections = await creatorCollectionResponse.json();
      console.log("Creator collections:", creatorCollections);
      
      // Look for our collection and see if the wallet has any tokens from it
      // This is implementation-specific and would need to be customized
    }
    
    // If everything failed, check if the wallet has ANY tokens of any type
    // as a diagnostic approach
    console.log("Checking if wallet has ANY tokens of any type as diagnostic");
    
    const accountTokensEndpoint = `${APTOS_API}/accounts/${walletAddress}/resources`;
    const accountResponse = await fetch(accountTokensEndpoint);
    if (accountResponse.ok) {
      const resources = await accountResponse.json();
      const tokenRelatedResources = resources.filter((r: any) => 
        r.type.includes('token') || r.type.includes('nft') || r.type.includes('collection')
      );
      
      console.log("Token-related resources found:", tokenRelatedResources.length);
      if (tokenRelatedResources.length > 0) {
        console.log("Types found:", tokenRelatedResources.map((r: any) => r.type));
      }
    }
    
    // If we've tried everything and still found nothing, return empty array
    console.log("No NFTs found after trying all endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with direct collection endpoint:", collectionError);
    return [];
  }
}
