
import { TransactionResult } from "../types";
import { getAptosClient } from "../client";

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
    
    // Prepare transaction to register coin store
    const payload = {
      function: "0x1::managed_coin::register",
      type_arguments: [coinType],
      arguments: [],
    };
    
    // Sign and submit transaction
    const result = await signTransaction(payload);
    console.log("Coin store registration result:", result);
    
    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error) {
    console.error("Error registering coin store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error registering coin store"
    };
  }
};
