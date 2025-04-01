
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, SUPPORTED_TOKENS } from "../constants";

/**
 * Check if a CoinStore is registered for the given token type and register it if not
 * @param walletAddress The wallet address to check and register
 * @param tokenType The token type to register
 * @param signTransaction Function to sign and submit the transaction
 * @returns Transaction result with success status and hash
 */
export const registerCoinStoreIfNeeded = async (
  walletAddress: string,
  tokenType: string,
  signTransaction: (txn: any) => Promise<any>
): Promise<TransactionResult> => {
  try {
    // First check if the token is APT, which is always registered by default
    if (tokenType === SUPPORTED_TOKENS.APT) {
      console.log("APT is already registered for all accounts by default");
      return { success: true, transactionHash: null };
    }
    
    // Testnet only supports APT
    if (IS_TESTNET && tokenType !== SUPPORTED_TOKENS.APT) {
      console.error("Only APT tokens are supported on testnet");
      return { 
        success: false, 
        transactionHash: null,
        error: "Only APT tokens are supported on testnet"
      };
    }
    
    console.log(`Registering CoinStore for ${tokenType}`);

    // Create the transaction payload for registration
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::register",
      type_arguments: [tokenType],
      arguments: []
    };
    
    console.log("Registration payload:", JSON.stringify(payload, null, 2));
    
    // Sign and submit the transaction
    console.log("Signing and submitting registration transaction...");
    const result = await signTransaction(payload);
    console.log("Registration result:", result);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error registering CoinStore:", error);
    // If we get a specific error saying the store is already registered,
    // we can consider this a success
    if (error instanceof Error && 
        (error.message.includes("Store already exists") || 
         error.message.includes("already registered"))) {
      console.log("CoinStore is already registered, proceeding with transfer");
      return { success: true, transactionHash: null };
    }
    
    toast.error("Failed to register token store");
    throw error;
  }
};
