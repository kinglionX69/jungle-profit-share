
import { Aptos, AptosConfig, Network, AccountAddress, CoinClient } from '@aptos-labs/ts-sdk';
import { toStructTag } from "./helpers";

// Network configuration
export const getAptosConfig = (network: 'mainnet' | 'testnet' = 'testnet'): AptosConfig => {
  return new AptosConfig({ 
    network: network === 'mainnet' ? Network.MAINNET : Network.TESTNET 
  });
};

// Main Aptos client instance for the app
export const getAptosClient = (network: 'mainnet' | 'testnet' = 'testnet'): Aptos => {
  const config = getAptosConfig(network);
  return new Aptos(config);
};

// Coin client for easier coin operations
export const getCoinClient = (network: 'mainnet' | 'testnet' = 'testnet'): CoinClient => {
  const config = getAptosConfig(network);
  return new CoinClient(config);
};

/**
 * Get coin balance for a wallet address
 * @param address Wallet address to check balance for
 * @param coinType The type of coin to check balance for
 * @param network 'mainnet' or 'testnet'
 * @returns The balance as a number
 */
export const getCoinBalance = async (
  address: string,
  coinType: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<number> => {
  try {
    const aptos = getAptosClient(network);
    const coinClient = getCoinClient(network);
    
    const balance = await coinClient.checkBalance({
      accountAddress: AccountAddress.fromString(address),
      coinType: toStructTag(coinType)
    });
    
    // Convert from smallest units (octas) to APT
    return Number(balance) / 100000000;
  } catch (error) {
    console.error(`Error fetching ${coinType} balance:`, error);
    return 0;
  }
};

/**
 * Register a token store for a wallet if it doesn't already exist
 */
export const registerTokenStore = async (
  walletAddress: string,
  signTransaction: (payload: any) => Promise<{ hash: string }>
): Promise<{ success: boolean; hash?: string }> => {
  try {
    console.log(`Registering token store for ${walletAddress}`);
    
    // Get client
    const aptos = getAptosClient();
    
    // Check if token store is already registered
    const accountResources = await aptos.getAccountResources({
      accountAddress: walletAddress
    });
    
    const tokenStoreResource = accountResources.find(
      (r) => r.type === "0x3::token::TokenStore"
    );
    
    if (tokenStoreResource) {
      console.log("Token store already registered");
      return { success: true };
    }
    
    // Prepare transaction to register token store
    const payload = {
      function: "0x3::token::initialize_token_store",
      type_arguments: [],
      arguments: [],
    };
    
    // Sign and submit transaction
    const result = await signTransaction(payload);
    console.log("Token store registration result:", result);
    
    return {
      success: true,
      hash: result.hash,
    };
  } catch (error) {
    console.error("Error registering token store:", error);
    return {
      success: false,
    };
  }
};

/**
 * Register a coin store for a wallet if it doesn't already exist
 */
export const registerCoinStore = async (
  walletAddress: string,
  coinType: string,
  signTransaction: (payload: any) => Promise<{ hash: string }>
): Promise<{ success: boolean; hash?: string }> => {
  try {
    console.log(`Registering coin store for ${walletAddress} with coin type ${coinType}`);
    
    // Get client
    const aptos = getAptosClient();
    
    // Check if coin store is already registered
    const accountResources = await aptos.getAccountResources({
      accountAddress: walletAddress
    });
    
    const coinTypeStr = toStructTag(coinType);
    
    const coinStoreType = `0x1::coin::CoinStore<${coinTypeStr}>`;
    const coinStoreResource = accountResources.find(
      (r) => r.type === coinStoreType
    );
    
    if (coinStoreResource) {
      console.log("Coin store already registered");
      return { success: true };
    }
    
    // Prepare transaction to register coin store
    const payload = {
      function: "0x1::managed_coin::register",
      type_arguments: [coinTypeStr],
      arguments: [],
    };
    
    // Sign and submit transaction
    const result = await signTransaction(payload);
    console.log("Coin store registration result:", result);
    
    return {
      success: true,
      hash: result.hash,
    };
  } catch (error) {
    console.error("Error registering coin store:", error);
    return {
      success: false,
    };
  }
};
