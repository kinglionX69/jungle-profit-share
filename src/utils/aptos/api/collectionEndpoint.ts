
import { BlockchainNFT } from "../types";
import { 
  NFT_COLLECTION_NAME, 
  CREATOR_ADDRESS, 
  NFT_IMAGE_BASE_URL,
  NFT_COLLECTION_ID
} from "../constants";
import { fetchV2Tokens } from "./fetchers/v2TokenFetcher";
import { fetchNFTsWithGraphQL } from "./fetchers/graphqlFetcher";

/**
 * Try to fetch NFTs directly from the collection endpoint
 */
export async function tryDirectCollectionEndpoint(
  walletAddress: string,
  collectionName: string
): Promise<BlockchainNFT[]> {
  try {
    console.log(`Trying direct collection endpoint for wallet: ${walletAddress}, collection: ${collectionName}`);
    
    // Try V2 tokens first
    const v2Tokens = await fetchV2Tokens(walletAddress);
    if (v2Tokens.length > 0) return v2Tokens;
    
    // If no V2 tokens found, try GraphQL
    const graphqlTokens = await fetchNFTsWithGraphQL(walletAddress, collectionName);
    if (graphqlTokens.length > 0) return graphqlTokens;
    
    // If still no tokens found, return empty array
    console.log("No NFTs found after trying all collection endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with all collection endpoint approaches:", collectionError);
    return [];
  }
}

/**
 * Fetch NFTs using native Aptos client
 */
export async function getNFTsWithNativeClient(
  walletAddress: string,
  useMockData = false
): Promise<BlockchainNFT[]> {
  try {
    if (useMockData) {
      console.log("Using mock data for native client");
      return Array(2).fill(null).map((_, i) => ({
        tokenId: `mock-token-${i}`,
        name: `Mock NFT ${i + 1}`,
        imageUrl: `https://picsum.photos/seed/mock${i}/300/300`,
        creator: CREATOR_ADDRESS,
        standard: "v2",
        properties: "{}",
        collectionName: NFT_COLLECTION_NAME,
        collectionId: NFT_COLLECTION_ID
      }));
    }
    
    return await tryDirectCollectionEndpoint(walletAddress, NFT_COLLECTION_NAME);
  } catch (error) {
    console.error("Error fetching NFTs with native client:", error);
    return [];
  }
}

// Re-export the GraphQL fetcher
export { fetchNFTsWithGraphQL as getNFTsWithIndexerGraphQL };
