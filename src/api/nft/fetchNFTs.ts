
import { toast } from "sonner";
import { NFT } from "../types/nft.types";
import { AccountAddressInput } from "@aptos-labs/ts-sdk";
import { fetchBlockchainNFTs, createDemoNFTs } from "./fetchServices/blockchainFetcher";
import { convertToApplicationFormat, checkAndUpdateLockedStatus } from "./fetchServices/nftProcessor";
import { fetchNFTsWithSDK } from "./fetchServices/sdkFetcher";

/**
 * Fetches NFTs for a wallet from the blockchain and determines eligibility
 * @param walletAddress The wallet address to check NFTs for
 */
export const fetchNFTs = async (walletAddress: string): Promise<NFT[]> => {
  try {
    console.log(`Attempting to fetch NFTs for wallet: ${walletAddress}`);

    if (!walletAddress) {
      console.error("No wallet address provided");
      return [];
    }

    // Get NFTs from blockchain with improved logging
    const blockchainNfts = await fetchBlockchainNFTs(walletAddress);
    
    if (blockchainNfts.length === 0) {
      console.log("No NFTs found for this wallet");
      toast.info("No NFTs found in your wallet");
      return [];
    }

    // Convert blockchain NFTs to our application format
    const nfts = convertToApplicationFormat(blockchainNfts);

    // Check for locks in the database
    return await checkAndUpdateLockedStatus(nfts, walletAddress);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    toast.error("Failed to load NFTs from your wallet.");
    return [];
  }
};

// Re-export the getUserNfts function that uses the SDK fetcher
export const getUserNfts = fetchNFTsWithSDK;
