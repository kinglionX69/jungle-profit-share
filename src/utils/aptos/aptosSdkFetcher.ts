
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
      // Initialize collection name and creator address
      let collectionName = '';
      let creatorAddress = '';
      
      // Safely extract collection name
      if (token.current_token_data && typeof token.current_token_data === 'object') {
        if ('collection_id' in token.current_token_data) {
          collectionName = String(token.current_token_data.collection_id || '');
        }
      }
      
      // Check token_data_id if collection_name is still empty
      if (!collectionName && token.token_data_id && typeof token.token_data_id === 'object') {
        if ('collection_id' in token.token_data_id) {
          collectionName = String(token.token_data_id.collection_id || '');
        }
      }
      
      // Safely extract creator address
      if (typeof token === 'object' && token) {
        // Try to get creator from current_collection if it exists
        if ('current_collection' in token && 
            token.current_collection && 
            typeof token.current_collection === 'object') {
          const collection = token.current_collection as Record<string, unknown>;
          if ('creator_address' in collection) {
            creatorAddress = String(collection.creator_address || '');
          }
        }
        
        // Try to get creator from token_properties if it exists
        if (!creatorAddress && 
            'token_properties_mutated_v1' in token && 
            token.token_properties_mutated_v1 && 
            typeof token.token_properties_mutated_v1 === 'object') {
          const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
          if ('creator' in properties) {
            creatorAddress = String(properties.creator || '');
          }
        }
      }
      
      return (
        (collectionName && collectionName.includes(NFT_COLLECTION_NAME)) &&
        (creatorAddress === CREATOR_ADDRESS)
      );
    });
    
    console.log(`After filtering, found ${filtered.length} tokens matching collection and creator`);
    
    // Convert to our BlockchainNFT format
    const nfts: BlockchainNFT[] = filtered.map(token => {
      // Initialize default values
      let name = `${NFT_COLLECTION_NAME} #Unknown`;
      let description = '';
      let imageUrl = '';
      
      // Safely extract token ID
      const tokenId = typeof token.token_data_id === 'string' 
        ? token.token_data_id 
        : JSON.stringify(token.token_data_id || {});
      
      // Try to extract name from token data
      if (token.token_data_id && typeof token.token_data_id === 'object') {
        const tokenDataId = token.token_data_id as Record<string, unknown>;
        if ('name' in tokenDataId) {
          name = String(tokenDataId.name || name);
        }
      }
      
      // Try to extract name from token properties if available
      if (token.token_properties_mutated_v1 && 
          typeof token.token_properties_mutated_v1 === 'object') {
        const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
        if ('name' in properties) {
          name = String(properties.name || name);
        }
      }
      
      // Try to extract description
      if (token.current_token_data && 
          typeof token.current_token_data === 'object') {
        const tokenData = token.current_token_data as Record<string, unknown>;
        if ('description' in tokenData) {
          description = String(tokenData.description || '');
        }
      }
      
      // Try to get description from token properties if not found
      if (!description && 
          token.token_properties_mutated_v1 && 
          typeof token.token_properties_mutated_v1 === 'object') {
        const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
        if ('description' in properties) {
          description = String(properties.description || '');
        }
      }
      
      // Try to extract image URL
      if (token.token_properties_mutated_v1 && 
          typeof token.token_properties_mutated_v1 === 'object') {
        const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
        if ('uri' in properties) {
          imageUrl = String(properties.uri || '');
        }
      }
      
      // Try to get URI from token data if not found
      if (!imageUrl && 
          token.current_token_data && 
          typeof token.current_token_data === 'object') {
        const tokenData = token.current_token_data as Record<string, unknown>;
        if ('uri' in tokenData) {
          imageUrl = String(tokenData.uri || '');
        }
      }
      
      // Build properties object
      const properties: Record<string, unknown> = {
        amount: token.amount,
        property_version_v1: token.property_version_v1
      };
      
      // Add token properties if available
      if (token.token_properties_mutated_v1) {
        properties.token_properties = token.token_properties_mutated_v1;
      }
      
      return {
        tokenId: tokenId,
        name: name,
        collectionName: NFT_COLLECTION_NAME,
        description: description,
        imageUrl: imageUrl,
        creator: CREATOR_ADDRESS,
        properties: JSON.stringify(properties),
        standard: token.token_standard || 'v2'
      };
    });
    
    return nfts;
  } catch (error) {
    console.error("Error fetching with Aptos SDK:", error);
    return [];
  }
};
