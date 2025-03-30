
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
      // If we get a 404, it could mean the account doesn't exist on this network
      if (resourcesResponse.status === 404) {
        console.log("Account not found on this network. The wallet might not have been used on this network yet.");
        return [];
      }
      throw new Error(`Node API responded with status: ${resourcesResponse.status}`);
    }
    
    const resources = await resourcesResponse.json();
    console.log(`Found ${resources.length} resources for the wallet`);
    
    // Find the TokenStore resource (using both v1 and v2 formats)
    const tokenStoreResources = resources.filter((r: any) => {
      return r.type === TOKEN_STORE_ADDRESS || 
             r.type.includes('token::TokenStore') || 
             r.type.includes('::token_store::') ||
             r.type.includes('::token::TokenStore') ||
             r.type.includes('0x3::token::TokenStore') ||
             r.type.includes('0x4::token::TokenStore');
    });
    
    console.log(`Found ${tokenStoreResources.length} token store resources`);
    
    if (tokenStoreResources.length === 0) {
      console.log("TokenStore resource not found, trying alternate collection endpoint directly");
      return await tryDirectCollectionEndpoint(walletAddress, collectionName);
    }
    
    // Try to extract tokens from each token store resource
    let allTokens: BlockchainNFT[] = [];
    
    for (const tokenStoreResource of tokenStoreResources) {
      console.log("Processing TokenStore resource:", tokenStoreResource.type);
      
      try {
        const tokensFromResource = await extractTokensFromResource(walletAddress, tokenStoreResource, collectionName);
        console.log(`Found ${tokensFromResource.length} tokens in this resource`);
        
        // Add tokens to our collection
        allTokens.push(...tokensFromResource);
      } catch (extractError) {
        console.error("Error extracting tokens from resource:", extractError);
      }
    }
    
    // If we found tokens from any resources, return them
    if (allTokens.length > 0) {
      console.log(`Found ${allTokens.length} total tokens from resources API`);
      return allTokens;
    } 
    
    console.log("No tokens found in TokenStore resources, trying last resort check");
    
    // Try direct collection endpoint as last resort
    return await tryDirectCollectionEndpoint(walletAddress, collectionName);
  } catch (error) {
    console.error("Error with resources API:", error);
    // Return empty array instead of throwing to prevent cascade failures
    return [];
  }
}
