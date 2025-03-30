
/**
 * Constants for Aptos API interactions
 */

// Aptos API endpoints
export const APTOS_MAINNET_API = "https://fullnode.mainnet.aptoslabs.com/v1";
export const APTOS_TESTNET_API = "https://fullnode.testnet.aptoslabs.com/v1";
export const APTOS_INDEXER_API = "https://indexer.mainnet.aptoslabs.com/v1/graphql";

// Use mainnet endpoints
export const APTOS_API = APTOS_MAINNET_API;
export const IS_TESTNET = false;

// Collection information - Updated for Proud Lions Club on mainnet
export const NFT_COLLECTION_ID = "0xdcf9ff44365801355b818bf1e59f309d335bc80821c032df0b7e6a0cabfd3d25";
export const NFT_COLLECTION_NAME = "Proud Lions Club";
export const CREATOR_ADDRESS = "0xdc18e1cff11938c507e01431515d8e303b88d57370d3a875e15a10a4a8a67f81";

// Mainnet specific constants
export const TOKEN_STORE_ADDRESS = "0x3::token::TokenStore"; // Used for resource lookup
export const APTOS_TOKEN_ADDRESS = "0x1::aptos_coin::AptosCoin"; // Used for token transfers

// Demo mode - set to false to use real NFTs only
export const USE_DEMO_MODE = false;

// Image URL base for Proud Lions Club NFTs
export const NFT_IMAGE_BASE_URL = "https://api.proudlionsclub.com/tokenids/";

// Sample NFT for testing
export const SAMPLE_NFT_ID = "0xd32323cfa849688d7728db226d838bd5fd63663eec9fa0065425d65f733d0888";
