
import { toast } from "sonner";
import { 
  APTOS_API, 
  NFT_COLLECTION_NAME, 
  USE_DEMO_MODE,
  IS_TESTNET
} from "./constants";
import { fetchWithNodeAPI } from "./nodeApiFetcher";
import { fetchMockNFTs } from "./mockNFTUtils";
import { fetchFromResourcesAPI } from "./api/resourceFetcher";
import { BlockchainNFT } from "./types";
import { resolveNFTImages } from "./nftImageResolver";
import { fetchWithAptosSdk } from "./aptosSdkFetcher";

/**
 * Enhanced NFT fetcher that tries multiple approaches to find NFTs
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs found from any successful method
 */
export const enhancedNFTFetch = async (
  walletAddress: string,
  collectionName: string = NFT_COLLECTION_NAME
): Promise<BlockchainNFT[]> => {
  console.log(`Using enhanced NFT fetcher for wallet: ${walletAddress}, collection: ${collectionName}`);
  console.log(`Network: ${IS_TESTNET ? 'TESTNET' : 'MAINNET'}`);
  
  // Normalize the wallet address
  if (walletAddress && !walletAddress.startsWith("0x")) {
    walletAddress = `0x${walletAddress}`;
  }
  
  let allNfts: BlockchainNFT[] = [];
  let errors: string[] = [];
  
  // In test mode, directly return demo NFTs
  if (USE_DEMO_MODE) {
    console.log("Using DEMO MODE for NFT fetch");
    const demoNfts = await fetchMockNFTs(collectionName);
    return demoNfts;
  }
  
  try {
    // Try all methods in parallel for maximum chance of success
    const fetchPromises = [
      { method: 'aptosSdk', promise: fetchWithAptosSdk(walletAddress) },
      { method: 'nodeAPI', promise: fetchWithNodeAPI(walletAddress, collectionName) },
      { method: 'resourcesAPI', promise: fetchFromResourcesAPI(walletAddress, collectionName) },
    ];
    
    console.log(`Starting ${fetchPromises.length} fetch methods in parallel`);
    
    // Execute all promises and handle their results
    const results = await Promise.allSettled(fetchPromises.map(f => f.promise));
    
    // Process the results from each method
    results.forEach((result, index) => {
      const method = fetchPromises[index].method;
      
      if (result.status === 'fulfilled') {
        console.log(`Method ${method} succeeded with ${result.value.length} NFTs`);
        
        // Log each NFT from this method
        if (result.value.length > 0) {
          console.log(`Sample NFT from ${method}:`, result.value[0]);
        }
        
        // Add NFTs from this method, avoiding duplicates
        result.value.forEach(nft => {
          if (!allNfts.some(existingNft => existingNft.tokenId === nft.tokenId)) {
            allNfts.push(nft);
          }
        });
      } else if (result.status === 'rejected') {
        console.error(`Method ${method} failed:`, result.reason);
        errors.push(`${method}: ${result.reason}`);
        
        // Track error but don't fail the whole operation
      }
    });
    
    console.log(`Combined results: ${allNfts.length} unique NFTs found`);
    
    // If we found any NFTs, process them
    if (allNfts.length > 0) {
      const processedNFTs = await resolveNFTImages(allNfts);
      console.log(`Processed ${processedNFTs.length} NFTs with images`);
      return processedNFTs;
    }
    
    // If all fetching methods failed, handle accordingly
    if (errors.length === fetchPromises.length) {
      console.error("All NFT fetching methods failed:", errors);
      toast.error("Failed to fetch NFTs using any method");
      
      if (USE_DEMO_MODE) {
        console.log("Falling back to demo NFTs after all methods failed");
        return await fetchMockNFTs(collectionName);
      }
    }
    
    // If we still found no NFTs but we want to show something, use demo NFTs
    if (allNfts.length === 0 && USE_DEMO_MODE) {
      console.log("No NFTs found but demo mode enabled, returning demo NFTs");
      return await fetchMockNFTs(collectionName);
    }
    
    // Return whatever we found, even if empty
    return allNfts;
  } catch (error) {
    console.error("Enhanced NFT fetcher error:", error);
    
    if (USE_DEMO_MODE) {
      return await fetchMockNFTs(collectionName);
    }
    
    return [];
  }
};
