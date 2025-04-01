
import { supabase } from "@/integrations/supabase/client";
import { NFT } from "../../types/nft.types";

/**
 * Converts blockchain NFTs to application format
 * @param blockchainNfts Array of NFTs from the blockchain
 * @returns Array of NFTs in application format
 */
export const convertToApplicationFormat = (blockchainNfts: any[]): NFT[] => {
  return blockchainNfts.map(nft => ({
    tokenId: nft.tokenId,
    name: nft.name || `NFT ${nft.tokenId.substring(0, 8)}...`,
    imageUrl: nft.imageUrl || `https://picsum.photos/seed/${nft.tokenId}/300/300`, // Use resolved image or fallback
    isEligible: true, // Default to eligible, we'll check locks below
    isLocked: false,
    standard: nft.standard,
    creator: nft.creator,
    properties: nft.properties,
  }));
};

/**
 * Checks for locked NFTs in the database and updates NFT status
 * @param nfts Array of NFTs to check locks for
 * @param walletAddress The wallet address to check locks for
 * @returns Array of NFTs with updated lock status
 */
export const checkAndUpdateLockedStatus = async (nfts: NFT[], walletAddress: string): Promise<NFT[]> => {
  console.log("Checking for locked NFTs in database");
  
  const { data: nftClaimsData, error: nftClaimsError } = await supabase
    .from("nft_claims")
    .select("*")
    .eq("wallet_address", walletAddress);

  if (nftClaimsError) {
    console.error("Error fetching NFT claims:", nftClaimsError);
    return nfts;
  }
  
  if (nftClaimsData && nftClaimsData.length > 0) {
    console.log(`Found ${nftClaimsData.length} locked NFTs in database`);

    // Update the NFTs to reflect locked status
    nftClaimsData.forEach((claim) => {
      const nftIndex = nfts.findIndex(
        (nft) => nft.tokenId === claim.token_id
      );
      if (nftIndex !== -1) {
        nfts[nftIndex].isLocked = true;
        nfts[nftIndex].isEligible = false;
        nfts[nftIndex].unlockDate = new Date(claim.unlock_date);
        console.log(
          `Marked NFT ${nfts[nftIndex].name} as locked until ${nfts[nftIndex].unlockDate}`
        );
      }
    });
  } else {
    console.log("No locked NFTs found in database");
  }
  
  return nfts;
};
