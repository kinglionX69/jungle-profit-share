
import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { fetchNFTsWithFallback } from "./nftFetcher";
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

// Re-export lock status functionality
export { checkNFTLockStatus } from "./lockUtils";
