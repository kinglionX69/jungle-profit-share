
import { Aptos, AptosConfig, Network, AccountAddress } from '@aptos-labs/ts-sdk';
import { BlockchainNFT } from './types';
import { 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_NAME, 
  IS_TESTNET, 
  NFT_COLLECTION_ID,
  NFT_IMAGE_BASE_URL
} from './constants/collection';

export const fetchWithAptosSdk = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Using Aptos SDK to fetch NFTs for wallet: ${walletAddress}`);
    
    // Set up the Aptos client with the appropriate network
    const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);
    
    console.log(`Configured Aptos SDK for ${network}`);
    
    try {
      const accountAddress = AccountAddress.fromString(walletAddress);
      const tokens = await aptos.getAccountOwnedTokens({ 
        accountAddress
      });
      
      console.log(`Found ${tokens.length} total tokens with Aptos SDK`);
      
      // Filter for relevant tokens
      const filtered = tokens.filter(token => {
        const collectionName = token.current_token_data?.current_collection?.collection_name;
        const matchesCollectionName = 
          collectionName === NFT_COLLECTION_NAME ||
          collectionName?.includes("Lion") ||
          collectionName?.includes("lion");
          
        const creatorAddress = token.current_token_data?.current_collection?.creator_address;
        const matchesCreator = creatorAddress === CREATOR_ADDRESS;
        
        return matchesCollectionName || matchesCreator;
      });
      
      // Convert to our BlockchainNFT format
      const nfts: BlockchainNFT[] = filtered.map(token => {
        const tokenId = token.token_data_id?.toString() || `unknown-${Math.random().toString(36).substring(2, 10)}`;
        const collectionData = token.current_token_data?.current_collection;
        const collectionName = collectionData?.collection_name || NFT_COLLECTION_NAME;
        const name = token.current_token_data?.token_name || `${collectionName} #${tokenId.substring(tokenId.length - 8)}`;
        const description = token.current_token_data?.token_properties?.description || '';
        const imageUrl = token.current_token_data?.token_uri || `${NFT_IMAGE_BASE_URL}${tokenId}`;
        const creator = collectionData?.creator_address || CREATOR_ADDRESS;
        const collectionId = token.current_token_data?.token_properties?.collection_id || NFT_COLLECTION_ID;
        
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
      
      return nfts;
    } catch (apiError) {
      console.error("Aptos SDK API error:", apiError);
      return [];
    }
  } catch (error) {
    console.error("Error fetching with Aptos SDK:", error);
    return [];
  }
};
