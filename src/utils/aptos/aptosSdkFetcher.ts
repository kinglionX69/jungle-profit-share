
import { AptosClient } from "aptos";
import { NFT } from "@/api/types/nft.types";
import { IS_TESTNET } from "./constants/network";
import { NFT_COLLECTION_ID, NFT_COLLECTION_NAME } from "./constants/collection";
import { getNFTsWithNativeClient, getNFTsWithIndexerGraphQL } from "./api/collectionEndpoint";
import { enhanceNFTsWithClaimStatus } from "./enhancedNFTFetcher";

// Re-export modules for easier access
export { getNFTsWithNativeClient, getNFTsWithIndexerGraphQL };

/**
 * Enhanced fetch function that combines data from multiple sources
 */
export const fetchNFTsWithSdk = async (
  walletAddress: string,
  useMockData = false,
  previousNfts: NFT[] | null = null
): Promise<NFT[]> => {
  try {
    // 1. Fetch NFTs using the native Aptos SDK (direct API calls)
    const nftsFromNative = await getNFTsWithNativeClient(
      walletAddress,
      useMockData
    );

    // 2. Fetch NFTs using the Indexer GraphQL API
    const nftsFromIndexer = await getNFTsWithIndexerGraphQL(
      walletAddress,
      useMockData
    );

    // Combine the results from both sources
    let allNFTs = [...nftsFromNative, ...nftsFromIndexer];

    // Remove duplicates based on the token id
    const uniqueNFTs = Array.from(
      new Map(allNFTs.map((nft) => [nft.tokenId, nft])).values()
    );

    // 3. Enhance NFTs with claim status (from Supabase)
    const enhancedNFTs = await enhanceNFTsWithClaimStatus(
      walletAddress,
      uniqueNFTs,
      previousNfts
    );

    return enhancedNFTs;
  } catch (error) {
    console.error("Error fetching NFTs with SDK:", error);
    return [];
  }
};
