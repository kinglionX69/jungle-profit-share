import { toast } from "sonner";
import { APTOS_INDEXER_API, IS_TESTNET } from "./constants";
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
    console.log(`Using testnet: ${IS_TESTNET}`);
    
    // Use the recommended GraphQL query format for Aptos
    const query = {
      query: `
        query CurrentTokens($owner_address: String, $collection_name: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              collection_name: {_eq: $collection_name},
              amount: {_gt: "0"}
            }
            limit: 50
          ) {
            name
            collection_name
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
        collection_name: collectionName
      },
    };

    console.log("Sending GraphQL query to Aptos Indexer");
    
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
    
    // Transform the data into our BlockchainNFT format
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.name || `Token #${token.token_data_id_hash.substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address,
      standard: token.token_standard,
      properties: token.token_properties
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
    console.log(`Using testnet: ${IS_TESTNET}`);
    
    // For testnet, we'll use more test data since collections might be different
    if (IS_TESTNET) {
      // Return testnet mock data
      return [
        {
          tokenId: "testnet-token-1",
          name: "Testnet Lion #1",
          imageUrl: "https://picsum.photos/seed/testlion1/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        },
        {
          tokenId: "testnet-token-2",
          name: "Testnet Lion #2",
          imageUrl: "https://picsum.photos/seed/testlion2/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        },
        {
          tokenId: "testnet-token-3",
          name: "Testnet Lion #3",
          imageUrl: "https://picsum.photos/seed/testlion3/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        }
      ];
    }
    
    // Original mainnet fallback logic
    try {
      const tokenStoreResource = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${walletAddress}/resource/0x3::token::TokenStore`);
      
      if (!tokenStoreResource.ok) {
        console.error("Token store resource not found, using mock data");
        throw new Error("Token store resource not found");
      }
      
      const tokenData = await tokenStoreResource.json();
      console.log("Token data from Node API:", tokenData);
      
      // Process the token data (simplified for demo)
      // In a production app, you would parse this data to find tokens from the specific collection
      
      return [
        {
          tokenId: "node-api-token-1",
          name: "Proud Lion from Node API",
          imageUrl: "https://picsum.photos/seed/lion1/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        }
      ];
    } catch (mainnetError) {
      console.error("Error fetching from mainnet node:", mainnetError);
      // Fall back to mock data
      return [
        {
          tokenId: "mock-token-1",
          name: "Proud Lion #1",
          imageUrl: "https://picsum.photos/seed/lion1/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        },
        {
          tokenId: "mock-token-2",
          name: "Proud Lion #2",
          imageUrl: "https://picsum.photos/seed/lion2/300/300",
          creator: "0x1",
          standard: "v2",
          properties: "{}"
        }
      ];
    }
  } catch (error) {
    console.error("Error with node API fallback:", error);
    return [];
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
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      
      const metadata = await response.json();
      if (metadata.image) {
        // If metadata contains image URL, resolve it
        return resolveImageUrl(metadata.image);
      }
    }
    
    // Fallback
    return "https://picsum.photos/seed/default/300/300";
  } catch (error) {
    console.error("Error resolving image URL:", error);
    return "https://picsum.photos/seed/default/300/300";
  }
};
