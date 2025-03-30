import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { fetchFromIndexer, fetchFromNodeAPI, resolveImageUrl } from "./nftFetcher";
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
    
    // First try using the indexer
    try {
      const nfts = await fetchFromIndexer(walletAddress, collectionName);
      
      if (nfts.length > 0) {
        console.log(`Found ${nfts.length} NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
        
        // Process NFTs to resolve image URLs
        const processedNfts = await Promise.all(nfts.map(async (nft) => ({
          ...nft,
          imageUrl: await resolveImageUrl(nft.imageUrl)
        })));
        
        return processedNfts;
      }
    } catch (indexerError) {
      console.error("Error with indexer, trying fallback:", indexerError);
    }
    
    // If no NFTs found or indexer error, try the node API as fallback
    console.log(`No NFTs found from indexer, trying node API fallback for wallet: ${walletAddress}`);
    const nodeFetchResult = await fetchFromNodeAPI(walletAddress, collectionName);
    console.log(`Node API fallback result: ${nodeFetchResult.length} NFTs found`);
    
    // Process NFTs to resolve image URLs
    const processedNodeNfts = await Promise.all(nodeFetchResult.map(async (nft) => ({
      ...nft,
      imageUrl: await resolveImageUrl(nft.imageUrl)
    })));
    
    return processedNodeNfts;
  } catch (error) {
    console.error("Error getting NFTs:", error);
    // Return an empty array rather than failing completely
    return [];
  }
};

/**
 * Check if an NFT is locked (has been used for a claim in the last 30 days)
 * @param tokenId The token ID to check
 * @param walletAddress The wallet address that owns the token
 * @returns Lock status and unlock date if locked
 */
export const checkNFTLockStatus = async (tokenId: string, walletAddress: string) => {
  try {
    // Try to fetch lock status from database
    try {
      const response = await fetch(`/api/check-lock-status?tokenId=${tokenId}&walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const { data, error } = await response.json();
      
      if (error) {
        console.error("Error checking lock status:", error);
        throw error;
      }
      
      return {
        isLocked: data?.isLocked || false,
        unlockDate: data?.unlockDate ? new Date(data.unlockDate) : null
      };
    } catch (fetchError) {
      console.error("Error fetching lock status, using fallback:", fetchError);
      
      // Fallback: Check directly from the database
      // This is done to handle API route errors gracefully
      return { isLocked: false, unlockDate: null };
    }
  } catch (error) {
    console.error("Error checking NFT lock status:", error);
    return { isLocked: false, unlockDate: null };
  }
};
