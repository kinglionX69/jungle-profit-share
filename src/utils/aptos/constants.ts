
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

// Collection information
export const NFT_COLLECTION_ID = "0x2a0e0f7b75185900a4fd7fdf8a071df70cde2d531ac961678656b1d56af104a0";
export const NFT_COLLECTION_NAME = "Proud Lion";
export const CREATOR_ADDRESS = "0x4be579ff825b21ef1620a50ed856f711f37bc4b7f1433b9c48742f69e541ed";

// Testnet specific constants
export const TOKEN_STORE_ADDRESS = "0x3::token::TokenStore"; // Used for resource lookup
export const APTOS_TOKEN_ADDRESS = "0x1::aptos_coin::AptosCoin"; // Used for token transfers

// Escrow wallet addresses (update these with actual addresses)
export const TESTNET_ESCROW_WALLET = "0x7ef9e398211e761bb4a2807a69f10de051a64fb97305b894c81e60c4c514135d"; // For testnet
export const MAINNET_ESCROW_WALLET = "0x7ef9e398211e761bb4a2807a69f10de051a64fb97305b894c81e60c4c514135d"; // For mainnet (update this)

// Mainnet specific constants
export const EMOJICOIN_TOKEN_ADDRESS = "0x173fcd3fda2c89d4702e3d307d4dcc8358b03d9f36189179d2bddd9585e96e27::coin_factory::Emojicoin";

// Supported token types
export const SUPPORTED_TOKENS = {
  APT: "0x1::aptos_coin::AptosCoin",
  EMOJICOIN: "0x173fcd3fda2c89d4702e3d307d4dcc8358b03d9f36189179d2bddd9585e96e27::coin_factory::Emojicoin"
};

// Demo mode - set to false for production
export const USE_DEMO_MODE = false;

// Image URL base for Proud Lions Club NFTs
export const NFT_IMAGE_BASE_URL = "https://api.proudlionsclub.com/tokenids/";

// Sample NFT for testing
export const SAMPLE_NFT_ID = "0xd32323cfa849688d7728db226d838bd5fd63663eec9fa0065425d65f733d0888";
