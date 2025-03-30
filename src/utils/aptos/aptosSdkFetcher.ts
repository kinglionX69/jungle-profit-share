
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
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
      // Fetch all tokens owned by the wallet
      const tokens = await aptos.getAccountOwnedTokens({ 
        accountAddress: walletAddress 
      });
      
      console.log(`Found ${tokens.length} total tokens with Aptos SDK`);
      
      // Filter by collection ID and creator
      const filtered = tokens.filter(token => {
        // Initialize collection ID and creator address
        let currentCollectionId = '';
        let creatorAddress = '';
        
        // Safely extract collection ID
        if (token.current_token_data && typeof token.current_token_data === 'object') {
          if ('collection_id' in token.current_token_data) {
            currentCollectionId = String(token.current_token_data.collection_id || '');
          }
        }
        
        // Check token_data_id if collection_id is still empty
        if (!currentCollectionId && token.token_data_id) {
          // Handle token_data_id as object
          if (typeof token.token_data_id === 'object') {
            const tokenDataId = token.token_data_id as Record<string, unknown>;
            if ('collection_id' in tokenDataId) {
              currentCollectionId = String(tokenDataId.collection_id || '');
            }
          } 
          // Handle token_data_id as string
          else if (typeof token.token_data_id === 'string') {
            if (token.token_data_id.includes(NFT_COLLECTION_ID)) {
              currentCollectionId = NFT_COLLECTION_ID;
            }
          }
        }
        
        // Safely extract creator address
        if (typeof token === 'object' && token) {
          // Try to get creator from token_properties if it exists
          if ('token_properties_mutated_v1' in token && 
              token.token_properties_mutated_v1 && 
              typeof token.token_properties_mutated_v1 === 'object') {
            const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
            if ('creator' in properties) {
              creatorAddress = String(properties.creator || '');
            }
          }
        }
        
        // For test logging - output what we're seeing for each token that might match
        if ((token.current_token_data && 
             typeof token.current_token_data === 'object' && 
             token.current_token_data.collection_id && 
             (token.current_token_data.collection_id.toString() === NFT_COLLECTION_ID || 
              token.current_token_data.collection_id.toString().includes("Lion") ||
              token.current_token_data.collection_id.toString().includes("lion"))) ||
            (currentCollectionId === NFT_COLLECTION_ID)) {
          console.log("Found potential match:", {
            name: token.current_token_data && typeof token.current_token_data === 'object' 
              ? token.current_token_data.description || 'No name' 
              : 'No token data',
            collectionId: currentCollectionId,
            creator: creatorAddress,
            tokenData: token.token_data_id
          });
        }
        
        // More relaxed matching to catch potential tokens - Matching by collection ID, or creator
        const matchesCollectionId = currentCollectionId && (
          currentCollectionId === NFT_COLLECTION_ID || 
          currentCollectionId.includes("Lion") ||
          currentCollectionId.includes("lion")
        );
          
        const matchesTokenData = token.current_token_data && 
          typeof token.current_token_data === 'object' &&
          token.current_token_data.collection_id && (
            token.current_token_data.collection_id.toString() === NFT_COLLECTION_ID ||
            token.current_token_data.collection_id.toString().includes("Lion") ||
            token.current_token_data.collection_id.toString().includes("lion")
          );
        
        const matchesCreator = creatorAddress === CREATOR_ADDRESS;
        
        // Additional check for collection name in token_properties_mutated_v1
        let matchesPropertiesCollectionName = false;
        if (token.token_properties_mutated_v1 && 
            typeof token.token_properties_mutated_v1 === 'object') {
          const props = token.token_properties_mutated_v1 as Record<string, unknown>;
          if ('collection_name' in props) {
            const collName = String(props.collection_name || '');
            matchesPropertiesCollectionName = 
              collName === NFT_COLLECTION_NAME ||
              collName.includes("Lion") ||
              collName.includes("lion") ||
              collName.includes("Proud");
          }
        }
        
        return matchesCollectionId || matchesTokenData || matchesCreator || matchesPropertiesCollectionName;
      });
      
      console.log(`After filtering, found ${filtered.length} tokens matching collection and creator`);
      
      // Convert to our BlockchainNFT format
      const nfts: BlockchainNFT[] = filtered.map(token => {
        // Initialize default values
        let name = `${NFT_COLLECTION_NAME} #Unknown`;
        let description = '';
        let imageUrl = '';
        let tokenCollectionId = '';
        let collectionName = NFT_COLLECTION_NAME;
        let tokenId = '';
        
        // Try to extract token ID
        if (!token.token_data_id) {
          // Generate a random token ID if null/undefined
          tokenId = `unknown-token-${Math.random().toString(36).substring(2, 10)}`;
          console.log(`Generated random token ID for missing token_data_id: ${tokenId}`);
        } else if (typeof token.token_data_id === 'string') {
          // Use the string directly
          tokenId = token.token_data_id;
        } else {
          // Stringify the object
          tokenId = JSON.stringify(token.token_data_id);
        }
        
        // Try to extract collection ID
        if (token.current_token_data && typeof token.current_token_data === 'object') {
          if (token.current_token_data.collection_id) {
            tokenCollectionId = String(token.current_token_data.collection_id);
          }
        }
        
        // Try to extract name from token properties
        if (token.token_properties_mutated_v1 && 
            typeof token.token_properties_mutated_v1 === 'object') {
          const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
          
          // Try to get collection name
          if ('collection_name' in properties) {
            collectionName = String(properties.collection_name || collectionName);
          }
          
          // Try to get name
          if ('name' in properties) {
            name = String(properties.name || name);
          }
          
          // Try to get token ID for image URL construction
          if ('token_id' in properties) {
            const propTokenId = String(properties.token_id || '');
            if (propTokenId) {
              // Use the base URL + token ID for image URL construction
              imageUrl = `${NFT_IMAGE_BASE_URL}${propTokenId}`;
            }
          }
        }
        
        // Try to extract name from current_token_data if still missing
        if (token.current_token_data && 
            typeof token.current_token_data === 'object') {
          // For the description field, which might contain the name
          if ('description' in token.current_token_data && token.current_token_data.description) {
            name = String(token.current_token_data.description);
          }
          
          // Look for a field called 'token_name' or similar in the token data
          // Since 'name' property doesn't exist according to the error
          if ('token_name' in token.current_token_data) {
            const tokenName = String(token.current_token_data.token_name || '');
            if (tokenName && !name.includes(NFT_COLLECTION_NAME)) {
              name = tokenName;
            }
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
        
        // Try to extract image URL if not already set
        if (!imageUrl) {
          // Try to get from uri in token properties
          if (token.token_properties_mutated_v1 && 
              typeof token.token_properties_mutated_v1 === 'object') {
            const properties = token.token_properties_mutated_v1 as Record<string, unknown>;
            if ('uri' in properties) {
              imageUrl = String(properties.uri || '');
            } else if ('image_uri' in properties) {
              imageUrl = String(properties.image_uri || '');
            } else if ('image' in properties) {
              imageUrl = String(properties.image || '');
            }
          }
          
          // If still no image URL, try to construct from token ID
          if (!imageUrl) {
            // Extract the token ID from the string if possible
            const idMatch = tokenId.match(/0x[a-fA-F0-9]+/);
            if (idMatch) {
              imageUrl = `${NFT_IMAGE_BASE_URL}${idMatch[0]}`;
            }
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
          collectionName: collectionName,
          description: description,
          imageUrl: imageUrl,
          creator: CREATOR_ADDRESS,
          properties: JSON.stringify(properties),
          standard: token.token_standard || 'v2',
          collectionId: tokenCollectionId || NFT_COLLECTION_ID
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
