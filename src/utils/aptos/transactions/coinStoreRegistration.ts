import { TransactionResult } from "../types";
import { getAptosClient } from "../client";
import { toast } from "sonner";

export const registerCoinStoreIfNeeded = async (
  walletAddress: string,
  coinType: string,
  signTransaction: (payload: any) => Promise<{ hash: string }>
): Promise<TransactionResult> => {
  try {
    console.log(`Checking coin store registration for ${walletAddress} with coin type ${coinType}`);
    
    // Get client
    const aptos = getAptosClient();
    
    // Check if coin store is already registered
    const accountResources = await aptos.getAccountResources({
      accountAddress: walletAddress
    });
    
    const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;
    const coinStoreResource = accountResources.find(
      (r) => r.type === coinStoreType
    );
    
    if (coinStoreResource) {
      console.log("Coin store already registered");
      return { success: true };
    }
    
    console.log("Coin store not found, registering now...");
    toast.loading("Registering coin store...");
    
    // Prepare transaction to register coin store
    const payload = {
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [
        walletAddress,
        "0" // Amount of 0 to register the coin store
      ]
    };
    
    // Sign and submit transaction
    const result = await signTransaction(payload);
    console.log("Coin store registration result:", result);
    toast.dismiss();
    
    if (!result.hash) {
      return { 
        success: false, 
        error: "Failed to register coin store - no transaction hash returned" 
      };
    }
    
    toast.success("Coin store registered successfully");
    
    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error) {
    console.error("Error registering coin store:", error);
    toast.dismiss();
    toast.error("Failed to register coin store");
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error registering coin store"
    };
  }
};
