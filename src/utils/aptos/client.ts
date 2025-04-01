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
    
    // Import the toStructTag function to ensure type safety
    import { toStructTag } from "./helpers";
    
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
