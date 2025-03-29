/**
 * Type definitions for Aptos interactions
 */

// Define types for NFT data returned from blockchain
export interface BlockchainNFT {
  tokenId: string;
  name: string;
  imageUrl: string;
  creator?: string;
  standard?: string;
  properties?: string;
}

// Define types for transaction results
export interface TransactionResult {
  success: boolean;
  transactionHash: string | null;
}
