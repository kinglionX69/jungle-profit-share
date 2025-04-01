/**
 * Types for Aptos blockchain interactions
 */

/**
 * Common NFT representation from the blockchain
 */
export interface BlockchainNFT {
  tokenId: string;
  name?: string;
  imageUrl: string;
  uri?: string;
  token_uri?: string;
  creator?: string;
  standard?: string;
  properties?: string;
  collectionName?: string;
  collectionId?: string;
}

/**
 * Token balance representation
 */
export interface TokenBalance {
  amount: string;
  decimals: number;
  name: string;
  symbol: string;
}

/**
 * Result of a token transfer operation
 */
export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Result of a claim transaction
 */
export interface ClaimResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Result of a transaction operation 
 */
export interface TransactionResult {
  success: boolean;
  transactionHash?: string | null;
  error?: string;
}
