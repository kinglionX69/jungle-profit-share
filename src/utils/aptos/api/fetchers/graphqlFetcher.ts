
// Fix the indexer property issue by using a different approach to query data
import { getAptosConfig } from '../../client';
import { IS_TESTNET } from '../../constants/network';
import { NFT } from '@/api/types/nft.types';
import { AccountAddress, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Use the GraphQL endpoint directly
const INDEXER_ENDPOINT = IS_TESTNET 
  ? "https://indexer-testnet.aptoslabs.com/v1/graphql" 
  : "https://indexer.mainnet.aptoslabs.com/v1/graphql";

/**
 * Fetch NFTs using the GraphQL API
 */
export const fetchNFTsWithGraphQL = async (
  walletAddress: string,
  collectionName: string
): Promise<NFT[]> => {
  try {
    // Instead of using the SDK's indexer property that doesn't exist,
    // make a direct fetch request to the GraphQL endpoint
    const response = await fetch(INDEXER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetCurrentTokenOwnershipsWithDataByOwner($owner_address: String!, $collection_name: String!) {
            current_token_ownerships_v2(
              where: {
                owner_address: { _eq: $owner_address },
                current_token_data: { collection_name: { _eq: $collection_name } }
              }
            ) {
              token_standard
              token_properties_mutated_v1
              token_data_id
              table_type_v1
              storage_id
              property_version_v1
              owner_address
              last_transaction_version
              last_transaction_timestamp
              is_soulbound_v2
              is_fungible_v2
              amount
              current_token_data {
                token_name
                token_data_id
                token_uri
                token_properties
                collection_name
                description
                current_collection {
                  collection_name
                  creator_address
                  description
                  uri
                }
              }
            }
          }
        `,
        variables: {
          owner_address: walletAddress,
          collection_name: collectionName,
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return [];
    }

    const tokens = data.data.current_token_ownerships_v2;
    
    // Transform the response into our NFT model
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id,
      name: token.current_token_data.token_name,
      description: token.current_token_data.description || '',
      imageUri: token.current_token_data.token_uri,
      collectionName: token.current_token_data.collection_name,
      attributes: token.current_token_data.token_properties,
      lastTxTimestamp: token.last_transaction_timestamp,
      owner: token.owner_address,
    }));
  } catch (error) {
    console.error("Error fetching NFTs with GraphQL:", error);
    return [];
  }
};
