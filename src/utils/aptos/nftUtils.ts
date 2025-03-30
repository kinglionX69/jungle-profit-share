
import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { NFT_COLLECTION_NAME } from "./constants";
import { enhancedNFTFetch } from "./enhancedNFTFetcher";

/**
 * Check if the user has NFTs from the specified collection
 * @param walletAddress The wallet address to check
 * @param collectionName The collection name to filter by (defaults to the constant)
 * @returns Array of NFTs owned by the wallet
 */
export const getNFTsInWallet = async (walletAddress: string, collectionName: string = NFT_COLLECTION_NAME) => {
  try {
    console.log(`Attempting to get NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }
    
    // Use the enhanced fetcher that tries multiple approaches
    return await enhancedNFTFetch(walletAddress, collectionName);
  } catch (error) {
    console.error("Error getting NFTs:", error);
    toast.error("Failed to fetch NFTs. Please try again later.");
    return [];
  }
};

// Re-export lock status functionality
export { checkNFTLockStatus } from "./lockUtils";
