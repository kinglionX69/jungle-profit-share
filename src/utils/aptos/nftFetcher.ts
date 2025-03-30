
import { toast } from "sonner";
import { APTOS_INDEXER_API, IS_TESTNET, NFT_COLLECTION_ID, NFT_COLLECTION_NAME } from "./constants";
import { BlockchainNFT } from "./types";
import { resolveNFTImages } from "./nftImageResolver";
import { fetchFromNodeAPI } from "./nodeApiFetcher";

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
 * Fetch NFTs with fallback strategy from primary source to secondary and finally mock data
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs processed and ready to display
 */
export async function fetchNFTsWithFallback(walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> {
  // Try using the indexer first with better error handling
  try {
    console.log("Fetching NFTs from indexer...");
    const nfts = await fetchFromIndexer(walletAddress, collectionName);
    
    if (nfts.length > 0) {
      console.log(`Found ${nfts.length} NFTs from indexer for wallet: ${walletAddress}`);
      
      // Process NFTs to resolve image URLs
      return await resolveNFTImages(nfts);
    } else {
      console.log("No NFTs found from indexer, trying Node API");
    }
  } catch (indexerError) {
    console.error("Error with indexer, details:", indexerError);
    console.log("Trying fallback to Node API");
  }
  
  // If no NFTs found or indexer error, try the node API as fallback
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress}`);
    const nodeFetchResult = await fetchFromNodeAPI(walletAddress, collectionName);
    console.log(`Node API fallback result: ${nodeFetchResult.length} NFTs found`);
    
    if (nodeFetchResult.length > 0) {
      // Process NFTs to resolve image URLs
      return await resolveNFTImages(nodeFetchResult);
    } 
    
    console.log("No NFTs found from Node API either");
    throw new Error("No NFTs found from any API endpoint");
  } catch (nodeError) {
    console.error("Node API fallback also failed:", nodeError);
    throw nodeError;
  }
}
