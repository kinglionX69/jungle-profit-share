
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getNFTsInWallet } from "@/utils/aptos";
import { NFT } from "../types/nft.types";
import { NFT_COLLECTION_NAME } from "@/utils/aptos/constants";

/**
 * Fetches NFTs for a wallet from the blockchain and determines eligibility
 * @param walletAddress The wallet address to check NFTs for
 */
export const fetchNFTs = async (walletAddress: string): Promise<NFT[]> => {
  try {
    console.log(`Attempting to fetch NFTs for wallet: ${walletAddress}`);
    console.log(`Using collection name: ${NFT_COLLECTION_NAME}`);
    
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }
    
    // Get NFTs from blockchain with improved logging
    try {
      console.log(`Fetching blockchain NFTs for wallet: ${walletAddress}`);
      // This will use our enhanced fetcher via getNFTsInWallet
      const blockchainNfts = await getNFTsInWallet(walletAddress, NFT_COLLECTION_NAME);
      
      console.log(`Found ${blockchainNfts.length} NFTs from blockchain`, blockchainNfts);
      
      if (blockchainNfts.length === 0) {
        console.log("No NFTs found for this wallet");
        toast.info("No Proud Lion NFTs found in your wallet");
        return [];
      }
      
      // Convert blockchain NFTs to our application format
      const nfts: NFT[] = blockchainNfts.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name,
        imageUrl: nft.imageUrl || "https://picsum.photos/seed/lion1/300/300", // Fallback image
        isEligible: true, // Default to eligible, we'll check locks below
        isLocked: false,
        standard: nft.standard,
        creator: nft.creator,
        properties: nft.properties
      }));
      
      // Check for locks in the database
      console.log("Checking for locked NFTs in database");
      const { data: nftClaimsData, error: nftClaimsError } = await supabase
        .from('nft_claims')
        .select('*')
        .eq('wallet_address', walletAddress);
      
      if (nftClaimsError) {
        console.error("Error fetching NFT claims:", nftClaimsError);
      } else if (nftClaimsData && nftClaimsData.length > 0) {
        console.log(`Found ${nftClaimsData.length} locked NFTs in database`);
        
        // Update the NFTs to reflect locked status
        nftClaimsData.forEach(claim => {
          const nftIndex = nfts.findIndex(nft => nft.tokenId === claim.token_id);
          if (nftIndex !== -1) {
            nfts[nftIndex].isLocked = true;
            nfts[nftIndex].isEligible = false;
            nfts[nftIndex].unlockDate = new Date(claim.unlock_date);
            console.log(`Marked NFT ${nfts[nftIndex].name} as locked until ${nfts[nftIndex].unlockDate}`);
          }
        });
      } else {
        console.log("No locked NFTs found in database");
      }
      
      console.log(`Returning ${nfts.length} processed NFTs for display`);
      return nfts;
    } catch (blockchainError) {
      console.error("Error fetching from blockchain:", blockchainError);
      toast.error("Failed to fetch NFTs from blockchain");
      return [];
    }
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    toast.error("Failed to load NFTs from your wallet.");
    return [];
  }
};
