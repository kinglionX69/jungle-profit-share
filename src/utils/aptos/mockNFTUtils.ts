
import { BlockchainNFT } from "./types";
import { toast } from "sonner";

/**
 * Generates mock NFT data for testing and fallback
 * @param collectionName The collection name to use for mock NFTs
 * @param errorMode Whether to generate error-state mock data
 * @returns Array of mock NFTs
 */
export const generateMockNFTs = (collectionName: string, errorMode = false): BlockchainNFT[] => {
  if (errorMode) {
    toast.error("Failed to fetch NFTs. Showing sample data instead.");
    return [
      {
        tokenId: "error-token",
        name: "Error Loading NFT (Mock)",
        imageUrl: "https://picsum.photos/seed/error/300/300",
        creator: "0x1",
        standard: "v2",
        properties: "{}",
        collectionName: collectionName
      }
    ];
  }
  
  toast.warning("No NFTs found in your wallet. Showing sample data for demonstration.");
  
  return [
    {
      tokenId: "mock-token-1",
      name: "Proud Lion #1 (Mock)",
      imageUrl: "https://picsum.photos/seed/lion1/300/300",
      creator: "0x1",
      standard: "v2",
      properties: "{}",
      collectionName: collectionName
    },
    {
      tokenId: "mock-token-2",
      name: "Proud Lion #2 (Mock)",
      imageUrl: "https://picsum.photos/seed/lion2/300/300",
      creator: "0x1",
      standard: "v2",
      properties: "{}",
      collectionName: collectionName
    }
  ];
};

/**
 * Fetch mock NFTs for demo and testing purposes
 * @param collectionName The collection name to use for mock NFTs
 * @param errorMode Whether to simulate an error state
 * @returns Array of mock NFTs
 */
export const fetchMockNFTs = async (collectionName: string, errorMode = false): Promise<BlockchainNFT[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return generateMockNFTs(collectionName, errorMode);
};

/**
 * Determines if NFT data is mock/sample data
 * @param nfts Array of NFTs to check
 * @returns Boolean indicating if any NFT is mock data
 */
export const isMockNFTData = (nfts: BlockchainNFT[]): boolean => {
  return nfts.some(nft => 
    nft.tokenId.includes('mock') || 
    nft.tokenId.includes('error') || 
    nft.name.includes('Mock')
  );
};
