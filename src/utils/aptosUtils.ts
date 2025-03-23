
import { toast } from "sonner";

// Aptos API endpoints
const APTOS_MAINNET_API = "https://fullnode.mainnet.aptoslabs.com/v1";
const APTOS_INDEXER_API = "https://indexer.mainnet.aptoslabs.com/v1/graphql";

/**
 * Utility functions for interacting with the Aptos blockchain
 */

// Check if the user has NFTs from the specified collection
export const getNFTsInWallet = async (walletAddress: string, collectionName: string = "Proud Lions Club") => {
  try {
    // First try using the indexer
    const nfts = await fetchFromIndexer(walletAddress, collectionName);
    
    if (nfts.length > 0) {
      console.log(`Found ${nfts.length} NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
      return nfts;
    }
    
    // If no NFTs found, try the node API as fallback
    return await fetchFromNodeAPI(walletAddress, collectionName);
  } catch (error) {
    console.error("Error getting NFTs:", error);
    return [];
  }
};

// Fetch NFTs using the Aptos Indexer
const fetchFromIndexer = async (walletAddress: string, collectionName: string) => {
  try {
    const query = {
      query: `
        query CurrentTokens($owner_address: String, $collection_name: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              collection_name: {_eq: $collection_name}
            }
          ) {
            token_data_id_hash
            name
            collection_name
            property_version
            amount
            token_properties
            creator_address
            collection_data_id_hash
            table_type
            token_data {
              metadata_uri
              token_name
            }
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: collectionName
      },
    };

    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return [];
    }
    
    return result.data.current_token_ownerships.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.token_data?.token_name || token.name,
      imageUrl: token.token_data?.metadata_uri || "",
      creator: token.creator_address
    }));
  } catch (error) {
    console.error("Error fetching from indexer:", error);
    return [];
  }
};

// Fallback method to fetch NFTs using the Aptos Node API
const fetchFromNodeAPI = async (walletAddress: string, collectionName: string) => {
  try {
    // For demonstration, we'll return mock data since direct NFT querying via Node API is complex
    // In a real implementation, you would need to:
    // 1. Get all token resources for the address
    // 2. Filter for the collection name
    // 3. Fetch metadata for each NFT
    
    console.log(`Fallback to Node API for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    // This is a simplification - in production, implement full NFT lookup
    return [];
  } catch (error) {
    console.error("Error fetching from node API:", error);
    return [];
  }
};

// Check if an NFT is locked (has been used for a claim in the last 30 days)
export const checkNFTLockStatus = async (tokenId: string, walletAddress: string) => {
  try {
    // Query our database to check if this NFT has been claimed recently
    const { data, error } = await fetch(`/api/check-lock-status?tokenId=${tokenId}&walletAddress=${walletAddress}`)
      .then(res => res.json());
    
    if (error) {
      console.error("Error checking lock status:", error);
      return { isLocked: false, unlockDate: null };
    }
    
    return {
      isLocked: data?.isLocked || false,
      unlockDate: data?.unlockDate ? new Date(data.unlockDate) : null
    };
  } catch (error) {
    console.error("Error checking NFT lock status:", error);
    return { isLocked: false, unlockDate: null };
  }
};

// Submit a transaction to the blockchain to claim rewards
export const submitClaimTransaction = async (
  walletAddress: string, 
  nftIds: string[],
  signTransaction: (txn: any) => Promise<any>
) => {
  try {
    // Create the transaction payload
    // This is a simplified example - you would need to create the actual transaction
    // based on your smart contract's requirements
    const payload = {
      type: "entry_function_payload",
      function: "0x1::aptos_token::claim_rewards",  // Replace with your actual module and function
      type_arguments: [],
      arguments: [
        nftIds,  // The NFT token IDs being claimed
      ]
    };
    
    // Sign and submit the transaction
    const result = await signTransaction(payload);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error submitting claim transaction:", error);
    toast.error("Failed to submit blockchain transaction");
    throw error;
  }
};

// Deposit tokens to the escrow wallet (admin only)
export const depositTokensTransaction = async (
  adminWalletAddress: string, 
  tokenType: string, 
  amount: number, 
  payoutPerNFT: number,
  signTransaction: (txn: any) => Promise<any>
) => {
  try {
    // Create the transaction payload for depositing tokens
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",  // Replace with your actual module and function
      type_arguments: [tokenType],  // e.g., "0x1::aptos_coin::AptosCoin"
      arguments: [
        "ESCROW_WALLET_ADDRESS",  // Replace with actual escrow wallet address
        amount.toString(),  // Amount in smallest units
      ]
    };
    
    // Sign and submit the transaction
    const result = await signTransaction(payload);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error depositing tokens:", error);
    toast.error("Failed to deposit tokens");
    throw error;
  }
};
