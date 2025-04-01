
import { toast } from "sonner";
import { getNFTsInWallet } from "@/utils/aptos";
import { resolveNFTImages } from "@/utils/aptos/nftImageResolver";
import { USE_DEMO_MODE, NFT_COLLECTION_NAME } from "@/utils/aptos/constants";
import { NFT } from "../../types/nft.types";

/**
 * Fetches NFTs from the blockchain with appropriate error handling and logging
 * @param walletAddress The wallet address to fetch NFTs for
 * @returns Array of NFTs from the blockchain
 */
export const fetchBlockchainNFTs = async (walletAddress: string): Promise<NFT[]> => {
  if (!walletAddress) {
    console.error("No wallet address provided");
    return [];
  }

  console.log(`Fetching blockchain NFTs for wallet: ${walletAddress}`);
  
  try {
    // Set a longer timeout
    const timeoutPromise = new Promise<[]>((_, reject) =>
      setTimeout(() => reject(new Error("NFT fetch timeout")), 15000)
    );

    // This will use our enhanced fetcher via getNFTsInWallet
    const nftPromise = getNFTsInWallet(walletAddress);

    // Race between the fetch and timeout
    const blockchainNfts = await Promise.race([nftPromise, timeoutPromise]) as any[];
    
    console.log(`Found ${blockchainNfts.length} NFTs from blockchain`, blockchainNfts);
    
    // Log the current state of images
    blockchainNfts.forEach((nft, index) => {
      console.log(`NFT ${index} before image resolution:`, {
        tokenId: nft.tokenId,
        name: nft.name,
        imageUrl: nft.imageUrl,
        uri: nft.uri,
        token_uri: nft.token_uri
      });
    });
    
    // Resolve image URLs for all NFTs before proceeding
    const nftsWithResolvedImages = await resolveNFTImages(blockchainNfts);
    console.log("NFTs after image resolution:", nftsWithResolvedImages);
    
    return nftsWithResolvedImages;
  } catch (blockchainError) {
    console.error("Error fetching from blockchain:", blockchainError);
    toast.error("Failed to fetch NFTs from blockchain");
    
    if (USE_DEMO_MODE) {
      console.log("Using demo NFTs after blockchain error");
      return createDemoNFTs();
    }
    
    return [];
  }
};

/**
 * Creates demo NFT data for testing
 * @returns Array of demo NFTs
 */
export const createDemoNFTs = (): NFT[] => {
  console.log("Creating demo NFTs for testing");
  return Array.from({ length: 3 }).map((_, i) => ({
    tokenId: `demo-token-${i}`,
    name: `${NFT_COLLECTION_NAME} #${i + 1}`,
    imageUrl: `https://picsum.photos/seed/lion${i + 1}/300/300`,
    isEligible: true,
    isLocked: false,
    standard: "v2",
    creator: "0x1",
    properties: JSON.stringify({
      generation: i.toString(),
      rarity: i === 0 ? "legendary" : i === 1 ? "rare" : "common",
    }),
  }));
};
