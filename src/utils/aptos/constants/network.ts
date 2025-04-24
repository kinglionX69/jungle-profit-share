
export const APTOS_MAINNET_API = "https://fullnode.mainnet.aptoslabs.com/v1";
export const APTOS_TESTNET_API = "https://fullnode.testnet.aptoslabs.com/v1";

export const IS_TESTNET = true;
export const APTOS_API = IS_TESTNET ? APTOS_TESTNET_API : APTOS_MAINNET_API;
export const APTOS_TOKEN_ADDRESS = "0x1::aptos_coin::AptosCoin";

// Escrow wallet addresses
export const TESTNET_ESCROW_WALLET = "0x5af503b5c379bd69f32dac9bcbae33f5a8941a4bb98d6f7341bb6fbdcb496d69";
export const MAINNET_ESCROW_WALLET = "0x9a5d795152a50243398329387026ef55886ee6c10f3bfa7c454e8487fe62c5e2";
