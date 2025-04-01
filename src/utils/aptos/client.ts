
import { toStructTag } from "./helpers";
// Note: We need to add a dependency for aptos
import { AptosClient, AptosAccount, FaucetClient } from "aptos";

// const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com";
const NODE_URL = process.env.APTOS_NODE_URL || "https://testnet.aptoslabs.com";
const FAUCET_URL = process.env.APTOS_FAUCET_URL || "https://faucet.testnet.aptoslabs.com";

export const aptosClient = new AptosClient(NODE_URL);
export const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/**
 * Creates a new Aptos account and funds it using the FaucetClient.
 * @returns The AptosAccount object representing the created account.
 */
export const createFundedAccount = async (): Promise<AptosAccount> => {
  const account = new AptosAccount();
  await faucetClient.fundAccount(account.address(), 100_000_000);
  return account;
};

/**
 * Converts a string to a Uint8Array.
 * @param str The string to convert.
 * @returns The Uint8Array representation of the string.
 */
export const stringToUint8Array = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

/**
 * Converts a Uint8Array to a string.
 * @param arr The Uint8Array to convert.
 * @returns The string representation of the Uint8Array.
 */
export const uint8ArrayToString = (arr: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
};

export const testnetClient = new AptosClient(
  "https://testnet.aptoslabs.com"
);

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
    const client = network === 'mainnet' 
      ? new AptosClient("https://fullnode.mainnet.aptoslabs.com") 
      : testnetClient;
      
    const resources = await client.getAccountResources({
      accountAddress: address,
    });
    
    const coinTypeStr = toStructTag(coinType);
    const coinStoreType = `0x1::coin::CoinStore<${coinTypeStr}>`;
    
    const resource = resources.find((r) => r.type === coinStoreType);
    
    if (!resource) {
      console.log(`No ${coinType} found for ${address}`);
      return 0;
    }
    
    // @ts-ignore - The structure is expected to have a coin.value field
    const balance = resource.data.coin?.value || "0";
    return parseInt(balance) / 100000000; // Convert from octas to APT
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
    
    // Check if token store is already registered
    const accountResources = await aptosClient.getAccountResources({
      accountAddress: walletAddress,
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
    
    // Check if coin store is already registered
    const accountResources = await aptosClient.getAccountResources({
      accountAddress: walletAddress,
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
