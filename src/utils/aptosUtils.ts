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
    console.log(`Attempting to get NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    // First try using the indexer
    try {
      const nfts = await fetchFromIndexer(walletAddress, collectionName);
      
      if (nfts.length > 0) {
        console.log(`Found ${nfts.length} NFTs for wallet: ${walletAddress} from collection: ${collectionName}`);
        return nfts;
      }
    } catch (indexerError) {
      console.error("Error with indexer, trying fallback:", indexerError);
    }
    
    // If no NFTs found or indexer error, try the node API as fallback
    console.log(`No NFTs found from indexer, trying node API fallback for wallet: ${walletAddress}`);
    const nodeFetchResult = await fetchFromNodeAPI(walletAddress, collectionName);
    console.log(`Node API fallback result: ${nodeFetchResult.length} NFTs found`);
    return nodeFetchResult;
  } catch (error) {
    console.error("Error getting NFTs:", error);
    return [];
  }
};

// Fetch NFTs using the Aptos Indexer
const fetchFromIndexer = async (walletAddress: string, collectionName: string) => {
  try {
    console.log(`Querying Aptos Indexer for wallet: ${walletAddress}, collection: ${collectionName}`);
    
    // Use a simpler GraphQL query that's less likely to cause errors
    const query = {
      query: `
        query GetCurrentTokens($owner_address: String, $collection_name: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              collection_name: {_eq: $collection_name},
              amount: {_gt: "0"}
            }
          ) {
            name
            collection_name
            token_data_id_hash
            creator_address
            token_properties
            metadata_uri: token_uri
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: collectionName
      },
    };

    console.log("Sending GraphQL query to Aptos Indexer:", JSON.stringify(query.variables));
    
    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Indexer API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query errors");
    }
    
    console.log("Raw response from Indexer:", result);
    
    const tokens = result.data?.current_token_ownerships || [];
    console.log(`Indexer returned ${tokens.length} tokens`);
    
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.name || `Token #${token.token_data_id_hash.substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address
    }));
  } catch (error) {
    console.error("Error fetching from indexer:", error);
    throw error; // Re-throw to trigger fallback
  }
};

// Fallback method to fetch NFTs using the Aptos Node API
const fetchFromNodeAPI = async (walletAddress: string, collectionName: string) => {
  try {
    console.log(`Using Node API fallback for wallet: ${walletAddress} from collection: ${collectionName}`);
    
    // For demo purposes, we'll return mock data
    // In production, you would implement actual Node API calls here
    return [
      {
        tokenId: "mock-token-1",
        name: "Proud Lion #1",
        imageUrl: "https://picsum.photos/seed/lion1/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-2",
        name: "Proud Lion #2",
        imageUrl: "https://picsum.photos/seed/lion2/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-3",
        name: "Proud Lion #3",
        imageUrl: "https://picsum.photos/seed/lion3/300/300",
        creator: "0x1"
      },
      {
        tokenId: "mock-token-4",
        name: "Proud Lion #4",
        imageUrl: "https://picsum.photos/seed/lion4/300/300",
        creator: "0x1"
      }
    ];
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
