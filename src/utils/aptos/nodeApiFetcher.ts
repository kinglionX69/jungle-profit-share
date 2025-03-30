
import { BlockchainNFT } from "./types";
import { fetchFromResourcesAPI } from "./api/resourceFetcher";

/**
 * Fallback method to fetch NFTs using the Aptos Node API
 * This is a wrapper around more specific API endpoint fetchers
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from the Node API
 */
export const fetchFromNodeAPI = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    if (!walletAddress) {
      throw new Error("Wallet address is required for Node API");
    }
    
    if (!collectionName) {
      throw new Error("Collection name is required for Node API");
    }
    
    // Display wallet and collection for debugging
    console.log("Wallet address format check:", {
      length: walletAddress.length,
      startsWithZeroX: walletAddress.startsWith("0x"),
      containsOnlyHex: /^0x[0-9a-fA-F]+$/.test(walletAddress)
    });
    
    // Use the resources API endpoint to fetch NFTs
    return await fetchFromResourcesAPI(walletAddress, collectionName);
  } catch (error) {
    console.error("Error with node API fallback:", error);
    throw error;
  }
};
