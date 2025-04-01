
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getNFTsInWallet } from "@/utils/aptos";
import { NFT } from "../types/nft.types";
import { resolveNFTImages } from "@/utils/aptos/nftImageResolver";

import {
  NFT_COLLECTION_NAME,
  USE_DEMO_MODE,
} from "@/utils/aptos/constants";
import { testnetClient } from "@/utils/aptos/client";
import {
  AccountAddressInput,
} from "@aptos-labs/ts-sdk";

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
      
      // Log the resolved images
      nftsWithResolvedImages.forEach((nft, index) => {
        console.log(`NFT ${index} after image resolution:`, {
          tokenId: nft.tokenId,
          name: nft.name,
          imageUrl: nft.imageUrl
        });
      });
      
      if (nftsWithResolvedImages.length === 0 && !USE_DEMO_MODE) {
        console.log("No NFTs found for this wallet");
        toast.info("No NFTs found in your wallet");
        return [];
      }

      // Convert blockchain NFTs to our application format
      const nfts: NFT[] = nftsWithResolvedImages.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name || `NFT ${nft.tokenId.substring(0, 8)}...`,
        imageUrl: nft.imageUrl || `https://picsum.photos/seed/${nft.tokenId}/300/300`, // Use resolved image or fallback
        isEligible: true, // Default to eligible, we'll check locks below
        isLocked: false,
        standard: nft.standard,
        creator: nft.creator,
        properties: nft.properties,
      }));

      // Check for locks in the database
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
      } else {
        console.log("No locked NFTs found in database");
      }

      console.log(`Returning ${nfts.length} processed NFTs for display`);
      return nfts;
    } catch (blockchainError) {
      console.error("Error fetching from blockchain:", blockchainError);
      toast.error("Failed to fetch NFTs from blockchain");

      if (USE_DEMO_MODE) {
        // Return demo NFTs if enabled
        console.log("Using demo NFTs after blockchain error");
        const demoNfts: NFT[] = Array.from({ length: 3 }).map((_, i) => ({
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
        return demoNfts;
      }
      return [];
    }
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    toast.error("Failed to load NFTs from your wallet.");
    return [];
  }
};

export const getUserNfts = async (
  walletAddress: AccountAddressInput
): Promise<NFT[]> => {
  try {
    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }
    
    console.log(`Getting user NFTs for wallet: ${walletAddress}`);
    
    const _nfts = await testnetClient.getAccountOwnedTokens({
      accountAddress: walletAddress,
    });
    
    console.log(`Found ${_nfts.length} tokens via SDK`, _nfts);

    const nfts = _nfts
      .filter((nft) => {
        const collectionNameMatches = nft.current_token_data?.current_collection?.collection_name === NFT_COLLECTION_NAME;
        console.log(`NFT collection name check: ${nft.current_token_data?.current_collection?.collection_name} === ${NFT_COLLECTION_NAME}: ${collectionNameMatches}`);
        return collectionNameMatches;
      })
      .map((nft) => {
        // Extract token ID from the token_data_id
        const tokenId = nft.token_data_id || '';
        
        // Extract image URL from token URI if available
        const tokenUri = nft.current_token_data?.token_uri || '';
        console.log(`Token URI for ${tokenId}: ${tokenUri}`);
        
        // Try to get collection info
        const collectionName = nft.current_token_data?.current_collection?.collection_name || NFT_COLLECTION_NAME;
        const creatorAddress = nft.current_token_data?.current_collection?.creator_address || '';
        const tokenStandard = nft.current_token_data?.current_collection?.token_standard || '';
        
        // Create the NFT object with the unlockDate property included
        return {
          tokenId,
          name: `${collectionName} #${tokenId.substring(tokenId.length - 8)}`,
          imageUrl: tokenUri || `https://picsum.photos/seed/${tokenId}/300/300`,
          isEligible: true,
          isLocked: false,
          standard: tokenStandard,
          creator: creatorAddress,
          properties: JSON.stringify(nft.current_token_data || {}),
          unlockDate: undefined // Initialize with undefined
        };
      });

    console.log(`Converted ${nfts.length} NFTs from SDK format:`, nfts);
    
    console.log("Checking for locked NFTs in database");
      const { data: nftClaimsData, error: nftClaimsError } = await supabase
        .from("nft_claims")
        .select("*")
        .eq("wallet_address", walletAddress as string);

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
  } catch (error) {
    console.error("Error fetching NFTs with SDK:", error);
    toast.error("Failed to load NFTs from your wallet");
    return [];
  }
};
