
import { toast } from "sonner";
import { BlockchainNFT } from "./types";
import { 
  NFT_COLLECTION_NAME, 
  USE_DEMO_MODE, 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_ID, 
  IS_TESTNET,
  NFT_IMAGE_BASE_URL
} from "./constants";
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
    console.log(`Looking for collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Looking for creator address: ${CREATOR_ADDRESS}`);
    console.log(`Network: ${IS_TESTNET ? 'TESTNET' : 'MAINNET'}`);
    console.log(`NFT Image base URL: ${NFT_IMAGE_BASE_URL}`);
    
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }

    // Use enhanced fetcher that tries multiple approaches
    const allNfts = await enhancedNFTFetch(walletAddress, collectionName);
    
    console.log(`Enhanced fetcher returned ${allNfts.length} total NFTs`);
    if (allNfts.length > 0) {
      console.log("Sample NFT:", allNfts[0]);
    }
    
    // Filter the NFTs to match our collection ID OR name AND creator address
    // More relaxed filtering to catch all variations of "Proud Lions Club"
    const filteredNfts = allNfts.filter(nft => {
      // Check for collection name match (case insensitive and partial)
      const nameMatches = nft.collectionName && (
        nft.collectionName === collectionName ||
        nft.collectionName.toLowerCase().includes("lion") ||
        nft.collectionName.toLowerCase().includes("proud")
      );
      
      // Check for collection ID match
      const idMatches = nft.collectionId === NFT_COLLECTION_ID;
      
      // Check for creator match
      const creatorMatches = nft.creator === CREATOR_ADDRESS;
      
      // Check properties for any relevant information
      const propertiesMatch = nft.properties && (
        nft.properties.includes(collectionName) || 
        nft.properties.includes(NFT_COLLECTION_ID) ||
        nft.properties.includes(CREATOR_ADDRESS) ||
        nft.properties.toLowerCase().includes("lion") ||
        nft.properties.toLowerCase().includes("proud")
      );
      
      // Log each NFT to see which filtering condition it matches
      console.log(`NFT ${nft.name} filtering:`, {
        nameMatches,
        idMatches,
        creatorMatches,
        propertiesMatch,
        collectionName: nft.collectionName,
        collectionId: nft.collectionId,
        creator: nft.creator,
        tokenId: nft.tokenId
      });
      
      // If image URL is missing but we have a token ID, construct it
      if (!nft.imageUrl && nft.tokenId) {
        // Extract the token ID from the string if possible
        const idMatch = nft.tokenId.match(/0x[a-fA-F0-9]+/);
        if (idMatch) {
          nft.imageUrl = `${NFT_IMAGE_BASE_URL}${idMatch[0]}`;
          console.log(`Constructed image URL for ${nft.name}: ${nft.imageUrl}`);
        }
      }
      
      // Match if any of these conditions are true
      return (nameMatches || idMatches || propertiesMatch || creatorMatches);
    });
      
    console.log(`Found ${filteredNfts.length} NFTs matching collection '${collectionName}' (ID: ${NFT_COLLECTION_ID}) and creator '${CREATOR_ADDRESS}'`);
    
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
