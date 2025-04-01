
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { IS_TESTNET } from "./constants";

// Create configurations for different networks
const DEVNET_CONFIG = new AptosConfig({ network: Network.DEVNET });
const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const MAINNET_CONFIG = new AptosConfig({ network: Network.MAINNET });

// Initialize clients
export const devnetClient = new Aptos(DEVNET_CONFIG);
export const testnetClient = new Aptos(TESTNET_CONFIG);
export const mainnetClient = new Aptos(MAINNET_CONFIG);

/**
 * Get the appropriate Aptos client based on network name
 * @param network The network name ('devnet', 'testnet', 'mainnet')
 * @returns The Aptos client for the specified network
 */
export const aptosClient = (network?: string): Aptos => {
  // If no network specified, use the default based on IS_TESTNET
  if (!network) {
    return IS_TESTNET ? testnetClient : mainnetClient;
  }
  
  // Return the appropriate client based on network name
  const networkLower = network.toLowerCase();
  if (networkLower === Network.DEVNET.toLowerCase()) {
    return devnetClient;
  } else if (networkLower === Network.TESTNET.toLowerCase()) {
    return testnetClient;
  } else if (networkLower === Network.MAINNET.toLowerCase()) {
    if (IS_TESTNET) {
      console.warn("Attempting to use mainnet client in testnet mode; using testnet client instead");
      return testnetClient;
    }
    return mainnetClient;
  } else {
    throw new Error(`Unknown network: ${network}`);
  }
};

/**
 * Check if a network can be used for sending transactions
 */
export const isSendableNetwork = (
  connected: boolean,
  network?: string
): boolean => {
  return (
    connected &&
    (network?.toLowerCase() === Network.DEVNET.toLowerCase() ||
      network?.toLowerCase() === Network.TESTNET.toLowerCase() ||
      network?.toLowerCase() === Network.MAINNET.toLowerCase())
  );
};

/**
 * Get the coin balance of a wallet address
 * @param walletAddress The wallet address to check
 * @param tokenType The token type to check balance for
 * @param network The network to check on
 * @returns The balance in standard units (e.g., 1 APT instead of 100000000 octas)
 */
export const getCoinBalance = async (
  walletAddress: string,
  tokenType: string = "0x1::aptos_coin::AptosCoin",
  network?: string
): Promise<number> => {
  try {
    const client = aptosClient(network);
    
    // Properly cast the tokenType to the required format for type safety
    // We're explicitly asserting this is in the correct format required by the SDK
    const formattedTokenType = tokenType as `${string}::${string}::${string}`;
    
    // Construct the resource type for the coin store
    const resourceType = `0x1::coin::CoinStore<${formattedTokenType}>`;
    
    // Get the coin store resource
    const resource = await client.getAccountResource({
      accountAddress: walletAddress,
      resourceType: resourceType,
    });
    
    // Extract the balance from the resource
    const balance = (resource.data as any)?.coin?.value || '0';
    
    // Convert from smallest units (e.g., octas for APT) to standard units (e.g., APT)
    return parseInt(balance) / 100000000; // 8 decimal places
  } catch (error) {
    console.error(`Error fetching balance for ${walletAddress}:`, error);
    return 0; // Return 0 if there's an error
  }
};

/**
 * Check if an account has a coin registered
 * @param walletAddress The wallet address to check
 * @param tokenType The token type to check
 * @param network The network to check on
 * @returns Whether the coin is registered
 */
export const hasCoinRegistered = async (
  walletAddress: string,
  tokenType: string,
  network?: string
): Promise<boolean> => {
  try {
    const client = aptosClient(network);
    
    // Properly cast the tokenType to the required format for type safety
    // We're explicitly asserting this is in the correct format required by the SDK
    const formattedTokenType = tokenType as `${string}::${string}::${string}`;
    
    // Construct the resource type for the coin store
    const resourceType = `0x1::coin::CoinStore<${formattedTokenType}>`;
    
    // Try to get the resource
    await client.getAccountResource({
      accountAddress: walletAddress,
      resourceType: resourceType,
    });
    
    // If we get here, the resource exists
    return true;
  } catch (error) {
    // If we get a 404, the resource doesn't exist
    return false;
  }
};
