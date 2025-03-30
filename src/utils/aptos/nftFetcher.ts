
import { toast } from "sonner";
import { APTOS_INDEXER_API, IS_TESTNET, NFT_COLLECTION_ID, NFT_COLLECTION_NAME } from "./constants";
import { BlockchainNFT } from "./types";

/**
 * Fetch NFTs using the Aptos Indexer
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs owned by the wallet
 */
export const fetchFromIndexer = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Querying Aptos Indexer for wallet: ${walletAddress}, collection: ${collectionName}`);
    console.log(`Collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Using testnet: ${IS_TESTNET}`);
    
    // Use the recommended GraphQL query format for Aptos
    // The query is now more focused on finding tokens by both collection name and collection id
    const query = {
      query: `
        query CurrentTokens($owner_address: String, $collection_name: String, $collection_id: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              _or: [
                {collection_name: {_eq: $collection_name}},
                {collection_id: {_eq: $collection_id}}
              ],
              amount: {_gt: "0"}
            }
            limit: 50
          ) {
            name
            collection_name
            collection_id
            property_version
            token_data_id_hash
            creator_address
            transaction_timestamp
            token_properties
            token_standard
            metadata_uri: token_uri
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: collectionName,
        collection_id: NFT_COLLECTION_ID
      },
    };

    console.log("Sending GraphQL query to Aptos Indexer with payload:", JSON.stringify(query, null, 2));
    
    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error(`Indexer API responded with status: ${response.status}`);
      console.error(`Response text: ${await response.text()}`);
      throw new Error(`Indexer API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query errors");
    }
    
    console.log("Raw response from Indexer:", JSON.stringify(result, null, 2));
    
    const tokens = result.data?.current_token_ownerships || [];
    console.log(`Indexer returned ${tokens.length} tokens`);
    
    if (tokens.length === 0) {
      console.log("No tokens found from the indexer for this wallet and collection");
    }
    
    // Transform the data into our BlockchainNFT format
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.name || `Token #${token.token_data_id_hash.substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address,
      standard: token.token_standard,
      properties: token.token_properties,
      collectionName: token.collection_name,
      collectionId: token.collection_id
    }));
  } catch (error) {
    console.error("Error fetching from indexer:", error);
    throw error; // Re-throw to trigger fallback
  }
};

/**
 * Fallback method to fetch NFTs using the Aptos Node API
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the Node API
 */
export const fetchFromNodeAPI = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    // For testnet, we'll try to fetch real data instead of returning mock data immediately
    const testnetEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`;
    console.log(`Fetching resources from testnet endpoint: ${testnetEndpoint}`);
    
    const resourcesResponse = await fetch(testnetEndpoint);
    
    if (!resourcesResponse.ok) {
      console.error(`Node API responded with status: ${resourcesResponse.status}`);
      throw new Error(`Node API responded with status: ${resourcesResponse.status}`);
    }
    
    const resources = await resourcesResponse.json();
    
    // Find the TokenStore resource
    const tokenStoreResource = resources.find((r: any) => r.type === '0x3::token::TokenStore');
    
    if (!tokenStoreResource) {
      console.error("TokenStore resource not found");
      throw new Error("TokenStore resource not found");
    }
    
    console.log("Found TokenStore resource:", tokenStoreResource);
    
    // If we have token data, parse it to find NFTs from our collection
    const tokens: BlockchainNFT[] = [];
    
    // Look for tokens in the store that match our collection
    if (tokenStoreResource.data && tokenStoreResource.data.tokens) {
      const tokenMap = tokenStoreResource.data.tokens.tokens;
      
      if (tokenMap && typeof tokenMap === 'object') {
        console.log("Found tokens in TokenStore");
        
        // Process each token to find matches for our collection
        for (const [tokenId, tokenData] of Object.entries(tokenMap)) {
          // Check if this token belongs to our collection
          if (tokenId.includes(collectionName) || tokenId.includes(NFT_COLLECTION_ID)) {
            console.log(`Found matching token: ${tokenId}`);
            
            // Fetch token metadata if available
            try {
              const tokenInfoEndpoint = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${walletAddress}/resource/0x3::token::TokenStore/${tokenId}`;
              const tokenInfoResponse = await fetch(tokenInfoEndpoint);
              
              if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                tokens.push({
                  tokenId: tokenId,
                  name: tokenInfo.data?.name || `Token from ${collectionName}`,
                  imageUrl: tokenInfo.data?.uri || "",
                  creator: tokenInfo.data?.creator || "",
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
    
    // If we found tokens from the collection, return them
    if (tokens.length > 0) {
      console.log(`Found ${tokens.length} tokens from Node API`);
      return tokens;
    }
    
    console.log("No tokens found in Node API, using last resort check");
    
    // Last resort: try to query the direct endpoints for this collection
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
            name: `${collectionName} #${tokenId.substring(0, 6)}`,
            imageUrl: "",  // We don't have the image URL from this endpoint
            creator: collectionData.creator || "",
            standard: "v2",
            properties: "{}"
          }));
        }
      }
    } catch (collectionError) {
      console.error("Error with direct collection endpoint:", collectionError);
    }
    
    // If we've tried everything and still found nothing, throw an error
    // This will trigger the fallback to mock data in nftUtils.ts
    throw new Error("No NFTs found from any API endpoint");
  } catch (error) {
    console.error("Error with node API fallback:", error);
    throw error;
  }
};

/**
 * Helper function to resolve NFT image URLs
 * @param uri The metadata URI from the NFT
 * @returns A resolved image URL
 */
export const resolveImageUrl = async (uri: string): Promise<string> => {
  if (!uri) return "https://picsum.photos/seed/default/300/300";
  
  try {
    // Check if URI is already an image URL
    if (uri.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return uri;
    }
    
    // If URI is IPFS, convert to HTTP gateway URL
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // If URI is HTTP/HTTPS, try to fetch metadata
    if (uri.startsWith('http')) {
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        const metadata = await response.json();
        if (metadata.image) {
          // If metadata contains image URL, resolve it
          return resolveImageUrl(metadata.image);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        // Continue to fallback
      }
    }
    
    // Fallback
    return "https://picsum.photos/seed/default/300/300";
  } catch (error) {
    console.error("Error resolving image URL:", error);
    return "https://picsum.photos/seed/default/300/300";
  }
};
