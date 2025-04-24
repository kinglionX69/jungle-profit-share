
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { BlockchainNFT } from "../../types";
import { TokenV2Data } from "../types/collectionTypes";
import { 
  NFT_COLLECTION_NAME, 
  CREATOR_ADDRESS, 
  NFT_IMAGE_BASE_URL,
  NFT_COLLECTION_ID,
  IS_TESTNET
} from "../../constants";

/**
 * Initialize Aptos client with the appropriate network
 */
const getAptosClient = () => {
  const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
  const aptosConfig = new AptosConfig({ network });
  return new Aptos(aptosConfig);
};

/**
 * Fetch tokens using the Aptos TS SDK V2 endpoints
 */
export const fetchV2Tokens = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Fetching V2 tokens for wallet: ${walletAddress}`);
    
    // Create Aptos client
    const aptos = getAptosClient();
    
    // Fetch token data for the wallet
    const response = await aptos.getAccountOwnedTokens({
      accountAddress: walletAddress,
      minimumLedgerVersion: undefined,
      options: {
        // Collections filter is optional, but can be used if needed
        // tokenStandard: "v2",
      }
    });
    
    console.log(`Found ${response.length} V2 tokens for wallet`);
    
    // Filter for tokens from our collection
    const collectionTokens = response.filter(token => {
      const currentCollection = token.current_token_data?.current_collection_data;
      return (
        currentCollection?.collection_name === NFT_COLLECTION_NAME || 
        currentCollection?.collection_id === NFT_COLLECTION_ID
      );
    });
    
    console.log(`Found ${collectionTokens.length} tokens from our collection`);
    
    // Map tokens to our format
    return collectionTokens.map((token: TokenV2Data): BlockchainNFT => {
      const tokenData = token.current_token_data || {};
      
      return {
        tokenId: token.token_data_id_hash || token.token_data_id || "",
        name: tokenData.name || `NFT #${token.token_data_id_hash?.substring(0, 6) || ""}`,
        imageUrl: tokenData.uri || `${NFT_IMAGE_BASE_URL}/token-${token.token_data_id_hash?.substring(0, 8)}`,
        creator: tokenData.creator_address || CREATOR_ADDRESS,
        standard: "v2",
        properties: JSON.stringify(token),
        collectionName: tokenData.collection_name || NFT_COLLECTION_NAME,
        collectionId: tokenData.collection_id || NFT_COLLECTION_ID
      };
    });
  } catch (error) {
    console.error("Error fetching V2 tokens:", error);
    return [];
  }
};
