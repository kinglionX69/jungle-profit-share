
/**
 * Main export file for Aptos utilities
 */

// Export constants
export { APTOS_MAINNET_API, APTOS_INDEXER_API } from './constants';

// Export types
export type { BlockchainNFT, TransactionResult } from './types';

// Export NFT utilities
export { getNFTsInWallet, checkNFTLockStatus } from './nftUtils';
export { isMockNFTData } from './mockNFTUtils';
export { resolveImageUrl } from './nftImageResolver';

// Export transaction utilities
export { submitClaimTransaction, depositTokensTransaction } from './transactionUtils';
