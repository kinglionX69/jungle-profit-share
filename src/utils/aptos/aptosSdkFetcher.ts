
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { BlockchainNFT } from './types';
import { CREATOR_ADDRESS, NFT_COLLECTION_NAME, IS_TESTNET } from './constants';

/**
 * Fetch NFTs using the official Aptos SDK
 * @param walletAddress The wallet address to fetch NFTs for
 * @returns Array of NFTs from the Aptos SDK
 */
export const fetchWithAptosSdk = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Aptos SDK to fetch NFTs for wallet: ${walletAddress}`);
    
    // Set up the Aptos client with the appropriate network
    const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);
    
    console.log(`Configured Aptos SDK for ${network}`);
    
    // Fetch all tokens owned by the wallet
    const tokens = await aptos.getAccountOwnedTokens({ 
      accountAddress: walletAddress 
    });
    
    console.log(`Found ${tokens.length} total tokens with Aptos SDK`);
    
    // Filter by collection name and creator
    const filtered = tokens.filter(token => {
      // Get the collection name from token data or related fields
      const collectionName = token.current_token_data?.collection_name || 
                            token.token_data_id?.collection_name || 
                            '';
                            
      // Get the creator address from token data or related fields
      const creatorAddress = token.current_token_data?.creator || 
                            token.token_data_id?.creator || 
                            '';
      
      return (
        (collectionName.includes(NFT_COLLECTION_NAME) || collectionName === NFT_COLLECTION_NAME) &&
        (creatorAddress === CREATOR_ADDRESS)
      );
    });
    
    console.log(`After filtering, found ${filtered.length} tokens matching collection and creator`);
    
    // Convert to our BlockchainNFT format
    const nfts: BlockchainNFT[] = filtered.map(token => {
      const tokenData = token.current_token_data || {};
      
      // Access token fields safely with optional chaining and fallbacks
      return {
        tokenId: token.token_data_id || '',
        name: tokenData.token_name || `${NFT_COLLECTION_NAME} #Unknown`,
        collectionName: NFT_COLLECTION_NAME,
        description: tokenData.description || '',
        imageUrl: tokenData.metadata_uri || '',
        creator: CREATOR_ADDRESS,
        properties: JSON.stringify({
          amount: token.amount,
          property_version_v1: token.property_version_v1,
          token_properties_mutated_v1: token.token_properties_mutated_v1,
        }),
        standard: token.token_standard || 'v2'
      };
    });
    
    return nfts;
  } catch (error) {
    console.error("Error fetching with Aptos SDK:", error);
    return [];
  }
};
