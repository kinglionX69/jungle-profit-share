
import { toast } from "sonner";
import { APTOS_INDEXER_API } from "./constants";
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
    
    // Use a simpler GraphQL query that's less likely to cause errors
    const query = {
      query: `
        query GetCurrentTokens($owner_address: String, $collection_name: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              collection_name: {_eq: $collection_name},
              amount: {_gt: "0"}
            }
          ) {
            name
            collection_name
            token_data_id_hash
            creator_address
            token_properties
            metadata_uri: token_uri
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: collectionName
      },
    };

    console.log("Sending GraphQL query to Aptos Indexer:", JSON.stringify(query.variables));
    
    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Indexer API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query errors");
    }
    
    console.log("Raw response from Indexer:", result);
    
    const tokens = result.data?.current_token_ownerships || [];
    console.log(`Indexer returned ${tokens.length} tokens`);
    
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.name || `Token #${token.token_data_id_hash.substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address
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
 * @returns Array of mock NFTs for testing
 */
export const fetchFromNodeAPI = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    // For demo purposes, we'll return mock data
    // In production, you would implement actual Node API calls here
    return [
      {
        tokenId: "mock-token-1",
        name: "Proud Lion #1",
        imageUrl: "https://picsum.photos/seed/lion1/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-2",
        name: "Proud Lion #2",
        imageUrl: "https://picsum.photos/seed/lion2/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-3",
        name: "Proud Lion #3",
        imageUrl: "https://picsum.photos/seed/lion3/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-4",
        name: "Proud Lion #4",
        imageUrl: "https://picsum.photos/seed/lion4/300/300",
        creator: "0x1"
      }
    ];
  } catch (error) {
    console.error("Error fetching from node API:", error);
    return [];
  }
};
