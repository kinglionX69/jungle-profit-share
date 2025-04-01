
import { toast } from "sonner";
import { testnetClient } from "../client";
import { APTOS_TOKEN_ADDRESS } from "../constants";
import { TransactionResult } from "../types";
import { toStructTag } from "../helpers";

/**
 * Check if a coin store exists for a given wallet
 * @param walletAddress The wallet address to check
 * @param coinType The coin type to check for
 * @returns Whether the coin store exists
 */
export const checkCoinStoreExists = async (
  walletAddress: string,
  coinType: string
): Promise<boolean> => {
  try {
    console.log(`Checking if coin store exists for ${walletAddress} with type ${coinType}`);
    
    // Format the coin store type for exact matching
    const formattedCoinType = toStructTag(coinType);
    const coinStoreType = `0x1::coin::CoinStore<${formattedCoinType}>`;
    
    // Get all the resources for the account
    const accountResources = await testnetClient.getAccountResources(
      walletAddress
    );
    
    console.log(`Found ${accountResources.length} resources for account ${walletAddress}`);
    
    // Check if the coin store exists in the resources
    const coinStore = accountResources.find((resource) => resource.type === coinStoreType);
    
    const exists = !!coinStore;
    console.log(`Coin store for ${formattedCoinType} ${exists ? "exists" : "does not exist"}`);
    
    return exists;
  } catch (error) {
    console.error("Error checking coin store:", error);
    return false;
  }
};

/**
 * Register a coin store for a wallet if it doesn't already exist
 * @param walletAddress The wallet address to register for
 * @param coinType The coin type to register (defaults to AptosCoin)
 * @param signTransaction Function to sign and submit transaction
 * @returns Result of the registration transaction
 */
export const registerCoinStoreIfNeeded = async (
  walletAddress: string,
  coinType: string = APTOS_TOKEN_ADDRESS,
  signTransaction: (payload: any) => Promise<{ hash: string }>
): Promise<TransactionResult> => {
  try {
    // Check if the coin store already exists
    const coinStoreExists = await checkCoinStoreExists(walletAddress, coinType);
    
    if (coinStoreExists) {
      console.log(`Coin store for ${coinType} already exists for ${walletAddress}`);
      return { success: true, transactionHash: null };
    }
    
    console.log(`Registering coin store for ${coinType}`);
    
    // Create the transaction payload
    const registerPayload = {
      function: "0x1::managed_coin::register",
      type_arguments: [toStructTag(coinType)],
      arguments: [],
    };
    
    // Sign and submit the transaction
    const { hash } = await signTransaction(registerPayload);
    
    console.log(`Coin store registration transaction submitted: ${hash}`);
    toast.success("Coin store registration successful");
    
    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error) {
    console.error("Error registering coin store:", error);
    toast.error("Failed to register coin store");
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
