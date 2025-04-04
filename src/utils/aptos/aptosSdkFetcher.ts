
import { Aptos, AptosConfig, Network, AccountAddress } from '@aptos-labs/ts-sdk';
import { BlockchainNFT } from './types';
import { 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_NAME, 
  IS_TESTNET, 
  NFT_COLLECTION_ID,
  NFT_IMAGE_BASE_URL
} from './constants';

/**
 * Fetch NFTs using the official Aptos SDK
 * @param walletAddress The wallet address to fetch NFTs for
 * @returns Array of NFTs from the Aptos SDK
 */
export const fetchWithAptosSdk = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Aptos SDK to fetch NFTs for wallet: ${walletAddress}`);
    console.log(`Looking for collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Looking for collection name: ${NFT_COLLECTION_NAME}`);
    console.log(`Network: ${IS_TESTNET ? 'TESTNET' : 'MAINNET'}`);
    
    // Set up the Aptos client with the appropriate network
    const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);
    
    console.log(`Configured Aptos SDK for ${network}`);
    
    try {
      // Convert address to AccountAddress
      const accountAddress = AccountAddress.fromString(walletAddress);
      
      // Fetch all tokens owned by the wallet
      const tokens = await aptos.getAccountOwnedTokens({ 
        accountAddress
      });
      
      console.log(`Found ${tokens.length} total tokens with Aptos SDK`);
      
      // Filter for relevant tokens
      const filtered = tokens.filter(token => {
        // Get collection name from token data
        const collectionName = token.current_token_data?.current_collection?.collection_name;
        
        // Check if collection name matches or contains our collection name
        const matchesCollectionName = 
          collectionName === NFT_COLLECTION_NAME ||
          collectionName?.includes("Lion") ||
          collectionName?.includes("lion");
          
        // Check if creator matches
        const creatorAddress = token.current_token_data?.current_collection?.creator_address;
        const matchesCreator = creatorAddress === CREATOR_ADDRESS;
        
        return matchesCollectionName || matchesCreator;
      });
      
      console.log(`After filtering, found ${filtered.length} tokens matching collection criteria`);
      
      // Convert to our BlockchainNFT format
      const nfts: BlockchainNFT[] = filtered.map(token => {
        // Extract token ID
        const tokenId = token.token_data_id?.toString() || `unknown-${Math.random().toString(36).substring(2, 10)}`;
        
        // Get collection info
        const collectionData = token.current_token_data?.current_collection;
        const collectionName = collectionData?.collection_name || NFT_COLLECTION_NAME;
        
        // Extract name from token data
        const name = token.current_token_data?.token_name || `${collectionName} #${tokenId.substring(tokenId.length - 8)}`;
        
        // Get description if available
        const description = token.current_token_data?.token_description || '';
        
        // Get image URL from token URI
        const imageUrl = token.current_token_data?.token_uri || `${NFT_IMAGE_BASE_URL}${tokenId}`;
        
        // Get creator address
        const creator = collectionData?.creator_address || CREATOR_ADDRESS;
        
        // Get collection ID
        const collectionId = token.current_token_data?.token_properties?.collection_id || NFT_COLLECTION_ID;
        
        // Build the NFT object
        return {
          tokenId,
          name,
          collectionName,
          description,
          imageUrl,
          creator,
          properties: JSON.stringify(token),
          standard: token.token_standard || 'v2',
          collectionId: collectionId?.toString() || NFT_COLLECTION_ID
        };
      });
      
      console.log(`Converted ${nfts.length} NFTs from Aptos SDK format`);
      return nfts;
    } catch (apiError) {
      console.error("Aptos SDK API error:", apiError);
      console.log("Returning empty array due to API error");
      return [];
    }
  } catch (error) {
    console.error("Error fetching with Aptos SDK:", error);
    return [];
  }
};
