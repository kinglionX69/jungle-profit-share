
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
      // Navigate the token structure carefully with optional chaining
      const tokenDataId = token.token_data_id || {};
      const currentTokenData = token.current_token_data || {};
      
      // Try to extract collection name from different possible paths
      let collectionName = '';
      if (currentTokenData.collection_id) {
        collectionName = currentTokenData.collection_id;
      } else if (typeof tokenDataId === 'object' && 'collection_id' in tokenDataId) {
        collectionName = tokenDataId.collection_id;
      }
      
      // Try to extract creator address from current token data
      let creatorAddress = '';
      if (token.current_collection && token.current_collection.creator_address) {
        creatorAddress = token.current_collection.creator_address;
      } else if (token.token_properties && token.token_properties.creator) {
        creatorAddress = token.token_properties.creator;
      }
      
      return (
        (collectionName && collectionName.includes(NFT_COLLECTION_NAME)) &&
        (creatorAddress === CREATOR_ADDRESS)
      );
    });
    
    console.log(`After filtering, found ${filtered.length} tokens matching collection and creator`);
    
    // Convert to our BlockchainNFT format
    const nfts: BlockchainNFT[] = filtered.map(token => {
      // Safely extract data
      const tokenDataId = token.token_data_id || {};
      const currentTokenData = token.current_token_data || {};
      const properties = token.token_properties || {};
      
      // Build name from token identification data
      let name = `${NFT_COLLECTION_NAME} #Unknown`;
      if (properties.name) {
        name = properties.name as string;
      } else if (typeof tokenDataId === 'object' && 'name' in tokenDataId) {
        name = tokenDataId.name as string;
      }
      
      // Extract description
      let description = '';
      if (currentTokenData.description) {
        description = currentTokenData.description;
      } else if (properties.description) {
        description = properties.description as string;
      }
      
      // Extract image URL
      let imageUrl = '';
      if (properties.uri) {
        imageUrl = properties.uri as string;
      } else if (currentTokenData.uri) {
        imageUrl = currentTokenData.uri;
      }
      
      return {
        tokenId: typeof tokenDataId === 'string' ? tokenDataId : JSON.stringify(tokenDataId),
        name: name,
        collectionName: NFT_COLLECTION_NAME,
        description: description,
        imageUrl: imageUrl,
        creator: CREATOR_ADDRESS,
        properties: JSON.stringify({
          amount: token.amount,
          property_version_v1: token.property_version_v1,
          token_properties: token.token_properties
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
