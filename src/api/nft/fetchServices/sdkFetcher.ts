
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { testnetClient } from "@/utils/aptos/client";
import { NFT_COLLECTION_NAME } from "@/utils/aptos/constants";
import { NFT } from "../../types/nft.types";
import { Aptos, AptosConfig, Network, TokenStandard } from '@aptos-labs/ts-sdk';

/**
 * Fetches NFTs using the Aptos SDK
 * @param walletAddress The wallet address to fetch NFTs for
 * @returns Array of NFTs in application format
 */
export const fetchNFTsWithSDK = async (
  walletAddress: string
): Promise<NFT[]> => {
  try {
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }
    
    console.log(`Getting user NFTs for wallet: ${walletAddress}`);
    
    // Create a new Aptos SDK instance with the appropriate configuration
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    
    // Use the SDK to fetch tokens
    const response = await aptos.getAccountNFTs({
      accountAddress: walletAddress,
      minimumLedgerVersion: BigInt(0) // Start from genesis
    });
    
    const _nfts = response.current_token_ownerships || [];
    
    console.log(`Found ${_nfts.length} tokens via SDK`, _nfts);

    const nfts = _nfts
      .filter((nft) => {
        const collectionNameMatches = nft.current_collection_data?.collection_name === NFT_COLLECTION_NAME;
        console.log(`NFT collection name check: ${nft.current_collection_data?.collection_name} === ${NFT_COLLECTION_NAME}: ${collectionNameMatches}`);
        return collectionNameMatches;
      })
      .map((nft) => {
        // Extract token ID from the token_data_id
        const tokenId = nft.token_data_id_hash || '';
        
        // Extract image URL from token URI if available
        const tokenUri = nft.current_token_data?.token_uri || '';
        console.log(`Token URI for ${tokenId}: ${tokenUri}`);
        
        // Try to get collection info
        const collectionName = nft.current_collection_data?.collection_name || NFT_COLLECTION_NAME;
        const creatorAddress = nft.current_collection_data?.creator_address || '';
        const tokenStandard = nft.token_standard || TokenStandard.V2;
        
        // Create the NFT object with the unlockDate property included
        return {
          tokenId,
          name: `${collectionName} #${tokenId.substring(tokenId.length - 8)}`,
          imageUrl: tokenUri || `https://picsum.photos/seed/${tokenId}/300/300`,
          isEligible: true,
          isLocked: false,
          standard: tokenStandard.toString(),
          creator: creatorAddress,
          properties: JSON.stringify(nft.current_token_data || {}),
          unlockDate: undefined // Initialize with undefined
        };
      });

    console.log(`Converted ${nfts.length} NFTs from SDK format:`, nfts);
    
    // Check for locked NFTs in the database
    return await checkForLockedNFTs(nfts, walletAddress);
  } catch (error) {
    console.error("Error fetching NFTs with SDK:", error);
    toast.error("Failed to load NFTs from your wallet");
    return [];
  }
};

/**
 * Checks for locked NFTs in the database and updates NFT status
 * @param nfts Array of NFTs to check locks for
 * @param walletAddress The wallet address to check locks for
 * @returns Array of NFTs with updated lock status
 */
const checkForLockedNFTs = async (nfts: NFT[], walletAddress: string): Promise<NFT[]> => {
  console.log("Checking for locked NFTs in database");
  const { data: nftClaimsData, error: nftClaimsError } = await supabase
    .from("nft_claims")
    .select("*")
    .eq("wallet_address", walletAddress);

  if (nftClaimsError) {
    console.error("Error fetching NFT claims:", nftClaimsError);
  } else if (nftClaimsData && nftClaimsData.length > 0) {
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
  }

  return nfts;
};
