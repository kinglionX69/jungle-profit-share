
import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { fetchFromIndexer, fetchFromNodeAPI, resolveImageUrl } from "./nftFetcher";
import { generateMockNFTs } from "./mockNFTUtils";
import { IS_TESTNET, NFT_COLLECTION_NAME } from "./constants";

/**
 * Check if the user has NFTs from the specified collection
 * @param walletAddress The wallet address to check
 * @param collectionName The collection name to filter by (defaults to the constant)
 * @returns Array of NFTs owned by the wallet
 */
export const getNFTsInWallet = async (walletAddress: string, collectionName: string = NFT_COLLECTION_NAME) => {
  try {
    console.log(`Attempting to get NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
    console.log(`Using testnet: ${IS_TESTNET}`);
    
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }
    
    return await fetchNFTsWithFallback(walletAddress, collectionName);
  } catch (error) {
    console.error("Error getting NFTs:", error);
    toast.error("Failed to fetch NFTs. Showing sample data instead.");
    
    // Return an error mock NFT for complete failure
    return generateMockNFTs(collectionName, true);
  }
};

/**
 * Fetch NFTs with fallback strategy from primary source to secondary and finally mock data
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs processed and ready to display
 */
async function fetchNFTsWithFallback(walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> {
  // Try using the indexer first with better error handling
  try {
    console.log("Fetching NFTs from indexer...");
    const nfts = await fetchFromIndexer(walletAddress, collectionName);
    
    if (nfts.length > 0) {
      console.log(`Found ${nfts.length} NFTs from indexer for wallet: ${walletAddress}`);
      
      // Process NFTs to resolve image URLs
      return await processNFTImages(nfts);
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
      return await processNFTImages(nodeFetchResult);
    } else {
      console.log("No NFTs found from Node API either");
      // Only use mock data as a last resort and with a clear warning
      console.warn("USING MOCK DATA: No real NFTs found from any source");
      
      // Provide mock data only as last resort
      return generateMockNFTs(collectionName);
    }
  } catch (nodeError) {
    console.error("Node API fallback also failed:", nodeError);
    
    // Only use mock data as absolute last resort
    return generateMockNFTs(collectionName);
  }
}

/**
 * Process NFT image URLs
 * @param nfts Array of NFTs to process images for
 * @returns Array of NFTs with resolved image URLs
 */
async function processNFTImages(nfts: BlockchainNFT[]): Promise<BlockchainNFT[]> {
  return await Promise.all(nfts.map(async (nft) => ({
    ...nft,
    imageUrl: await resolveImageUrl(nft.imageUrl)
  })));
}

// Re-export lock status functionality
export { checkNFTLockStatus } from "./lockUtils";
