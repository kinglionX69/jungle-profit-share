
/**
 * Constants for Aptos API interactions
 */

// Aptos API endpoints
export const APTOS_MAINNET_API = "https://fullnode.mainnet.aptoslabs.com/v1";
export const APTOS_TESTNET_API = "https://fullnode.testnet.aptoslabs.com/v1";
export const APTOS_INDEXER_API = "https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql";

// Use testnet endpoints
export const APTOS_API = APTOS_TESTNET_API;
export const IS_TESTNET = true;

// Collection information - Updated to match explorers
export const NFT_COLLECTION_ID = "0x9951fc9827da09d5170248afd9a39a7f0d1e9a63fc15d1eba4ab9182dccd9cb7";
export const NFT_COLLECTION_NAME = "Proud Lion";
export const CREATOR_ADDRESS = "0x004be579ff825b21ef1620a50ed856f711f37bc4b7f1433b9c48742f69e541ed";

// Testnet specific constants
export const TOKEN_STORE_ADDRESS = "0x3::token::TokenStore"; // Used for resource lookup
export const APTOS_TOKEN_ADDRESS = "0x1::aptos_coin::AptosCoin"; // Used for token transfers

// Demo mode - set to true to see demo NFTs when none are found
export const USE_DEMO_MODE = true;
