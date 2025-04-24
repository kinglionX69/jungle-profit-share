
import { BlockchainNFT } from "../../types";
import { 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_NAME, 
  NFT_COLLECTION_ID, 
  IS_TESTNET 
} from "../../constants";

export const fetchNFTsWithGraphQL = async (
  walletAddress: string,
  useMockData = false
): Promise<BlockchainNFT[]> => {
  try {
    if (useMockData) {
      console.log("Using mock data for indexer GraphQL");
      return Array(2).fill(null).map((_, i) => ({
        tokenId: `mock-graphql-${i}`,
        name: `Mock GraphQL NFT ${i + 1}`,
        imageUrl: `https://picsum.photos/seed/graphql${i}/300/300`,
        creator: CREATOR_ADDRESS,
        standard: "v2",
        properties: "{}",
        collectionName: NFT_COLLECTION_NAME,
        collectionId: NFT_COLLECTION_ID
      }));
    }
    
    const APTOS_INDEXER_API = IS_TESTNET
      ? "https://indexer-testnet.staging.aptoslabs.com/v1/graphql"
      : "https://indexer.mainnet.aptoslabs.com/v1/graphql";
    
    const query = {
      query: `
        query GetTokens($owner_address: String, $collection_name: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              collection_name: {_eq: $collection_name},
              amount: {_gt: "0"}
            }
          ) {
            token_data_id_hash
            name
            collection_name
            collection_id
            property_version
            token_properties
            metadata_uri: token_uri
            creator_address
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: NFT_COLLECTION_NAME
      }
    };
    
    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    
    const tokens = result.data?.current_token_ownerships || [];
    
    return tokens.map((token: any): BlockchainNFT => ({
      tokenId: token.token_data_id_hash || "",
      name: token.name || `NFT #${(token.token_data_id_hash || "").substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address || CREATOR_ADDRESS,
      standard: "v2",
      properties: token.token_properties || "{}",
      collectionName: token.collection_name || NFT_COLLECTION_NAME,
      collectionId: token.collection_id || NFT_COLLECTION_ID
    }));
  } catch (error) {
    console.error("Error fetching NFTs with GraphQL:", error);
    return [];
  }
};
