
import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { NFT_COLLECTION_NAME, USE_DEMO_MODE } from "./constants";
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

    // Use enhanced fetcher that tries multiple approaches
    const allNfts = await enhancedNFTFetch(walletAddress, collectionName);
    
    // Filter the NFTs to match our collection if specified
    const filteredNfts = collectionName 
      ? allNfts.filter(nft => 
          nft.collectionName === collectionName || 
          (nft.properties && nft.properties.includes(collectionName))
        )
      : allNfts;
      
    console.log(`Found ${filteredNfts.length} NFTs matching collection ${collectionName}`);
    
    // If we found no NFTs but demo mode is enabled, return demo NFTs
    if (filteredNfts.length === 0 && USE_DEMO_MODE) {
      console.log("No NFTs found but demo mode enabled, returning demo NFTs");
      // The enhancedNFTFetch function will have already returned demo NFTs if enabled
    }
    
    return filteredNfts;
  } catch (error) {
    console.error("Error getting NFTs:", error);
    toast.error("Failed to fetch NFTs. Please try again later.");
    return [];
  }
};

// Re-export lock status functionality
export { checkNFTLockStatus } from "./lockUtils";
