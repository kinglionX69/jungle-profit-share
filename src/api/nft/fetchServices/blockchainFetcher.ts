
import { toast } from "sonner";
import { NFT } from "../../types/nft.types";
import { BlockchainNFT } from "@/utils/aptos/types";

/**
 * Fetches NFTs from the blockchain for a wallet
 * @param walletAddress The wallet address to fetch NFTs for
 * @returns Array of NFTs from the blockchain
 */
export const fetchBlockchainNFTs = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Fetching blockchain NFTs for wallet: ${walletAddress}`);
    
    // Here you would typically use an API or SDK to fetch the NFTs
    // For demonstration, we'll return some mock data
    const mockNFTs: BlockchainNFT[] = [
      {
        tokenId: "0x1::collection::token1",
        name: "NFT #1",
        imageUrl: "https://picsum.photos/seed/nft1/300/300",
        creator: "0x123",
        standard: "Aptos",
        properties: "{}"
      },
      {
        tokenId: "0x1::collection::token2",
        name: "NFT #2",
        imageUrl: "https://picsum.photos/seed/nft2/300/300",
        creator: "0x123",
        standard: "Aptos",
        properties: "{}"
      }
    ];
    
    // Simulate a slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockNFTs;
  } catch (error) {
    console.error("Error fetching blockchain NFTs:", error);
    toast.error("Failed to fetch NFTs from blockchain");
    return [];
  }
};

/**
 * Creates demo NFTs for testing
 * @param count Number of NFTs to create
 * @returns Array of demo NFTs
 */
export const createDemoNFTs = (count: number = 5): BlockchainNFT[] => {
  console.log(`Creating ${count} demo NFTs`);
  
  return Array.from({ length: count }).map((_, i) => ({
    tokenId: `0x1::collection::demo_token_${i + 1}`,
    name: `Demo NFT #${i + 1}`,
    imageUrl: `https://picsum.photos/seed/demo${i + 1}/300/300`,
    creator: "0x123",
    standard: "Aptos",
    properties: JSON.stringify({ demo: true, index: i })
  }));
};
