
import { BlockchainNFT } from "./types";
import { NFT_COLLECTION_ID, CREATOR_ADDRESS } from "./constants";

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
    const testnetEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`;
    console.log(`Fetching resources from testnet endpoint: ${testnetEndpoint}`);
    
    const resourcesResponse = await fetch(testnetEndpoint);
    
    if (!resourcesResponse.ok) {
      console.error(`Node API responded with status: ${resourcesResponse.status}`);
      throw new Error(`Node API responded with status: ${resourcesResponse.status}`);
    }
    
    const resources = await resourcesResponse.json();
    
    // Find the TokenStore resource
    const tokenStoreResource = resources.find((r: any) => r.type === '0x3::token::TokenStore' || r.type.includes('::token::'));
    
    if (!tokenStoreResource) {
      console.error("TokenStore resource not found");
      throw new Error("TokenStore resource not found");
    }
    
    console.log("Found TokenStore resource:", tokenStoreResource);
    
    // If we have token data, parse it to find NFTs from our collection
    const tokens: BlockchainNFT[] = await extractTokensFromResource(walletAddress, tokenStoreResource, collectionName);
    
    // If we found tokens from the collection, return them
    if (tokens.length > 0) {
      console.log(`Found ${tokens.length} tokens from Node API`);
      return tokens;
    } 
    
    console.log("No tokens found in Node API, trying last resort check");
    
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
  
  // Look for tokens in the store that match our collection
  if (tokenStoreResource.data && tokenStoreResource.data.tokens) {
    const tokenMap = tokenStoreResource.data.tokens.tokens;
    
    if (tokenMap && typeof tokenMap === 'object') {
      console.log("Found tokens in TokenStore");
      
      // Process each token to find matches for our collection
      for (const [tokenId, tokenData] of Object.entries(tokenMap)) {
        // Check if this token belongs to our collection by ID, name, or creator
        if (
          tokenId.includes(collectionName) || 
          tokenId.includes(NFT_COLLECTION_ID) || 
          tokenId.includes(CREATOR_ADDRESS)
        ) {
          console.log(`Found matching token: ${tokenId}`);
          
          // Fetch token metadata if available
          try {
            const tokenInfoEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${walletAddress}/resource/0x3::token::TokenStore/${tokenId}`;
            const tokenInfoResponse = await fetch(tokenInfoEndpoint);
            
            if (tokenInfoResponse.ok) {
              const tokenInfo = await tokenInfoResponse.json();
              tokens.push({
                tokenId: tokenId,
                name: tokenInfo.data?.name || `Proud Lion #${tokenId.substring(0, 6)}`,
                imageUrl: tokenInfo.data?.uri || "",
                creator: tokenInfo.data?.creator || CREATOR_ADDRESS,
                standard: "v2",
                properties: JSON.stringify(tokenInfo.data?.properties || {})
              });
            }
          } catch (error) {
            console.error(`Error fetching token info for ${tokenId}:`, error);
          }
        }
      }
    }
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
    const collectionEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${walletAddress}/collection/${collectionName}`;
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
    
    // Another attempt - try to get tokens from the creator's account
    const creatorEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${CREATOR_ADDRESS}/resources`;
    console.log(`Trying creator endpoint: ${creatorEndpoint}`);
    
    const creatorResponse = await fetch(creatorEndpoint);
    if (creatorResponse.ok) {
      const creatorResources = await creatorResponse.json();
      const collectionResource = creatorResources.find((r: any) => 
        r.type.includes('collection') && 
        (r.data?.name === collectionName || r.data?.collection_name === collectionName)
      );
      
      if (collectionResource) {
        console.log("Found collection in creator resources:", collectionResource);
        return [];  // You'd need to parse this depending on the structure
      }
    }
    
    // If we've tried everything and still found nothing, return empty array
    console.log("No NFTs found after trying all endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with direct collection endpoint:", collectionError);
    throw collectionError;
  }
}
