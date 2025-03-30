
import { BlockchainNFT } from "../types";
import { APTOS_API, NFT_COLLECTION_ID, CREATOR_ADDRESS, TOKEN_STORE_ADDRESS } from "../constants";
import { extractTokensFromResource } from "./tokenStore";
import { tryDirectCollectionEndpoint } from "./collectionEndpoint";

/**
 * Fallback method to fetch NFTs using the Aptos Node API resources endpoint
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the Node API
 */
export const fetchFromResourcesAPI = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Node API (resources endpoint) for wallet: ${walletAddress} from collection: ${collectionName}`);
    console.log(`Collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Creator Address: ${CREATOR_ADDRESS}`);
    
    // Fetch account resources
    const resourcesEndpoint = `${APTOS_API}/accounts/${walletAddress}/resources`;
    console.log(`Fetching resources from endpoint: ${resourcesEndpoint}`);
    
    const resourcesResponse = await fetch(resourcesEndpoint);
    
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
    console.error("Error with resources API:", error);
    throw error;
  }
}
