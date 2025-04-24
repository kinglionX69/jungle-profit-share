
import { Aptos, AptosConfig, Network, AccountAddress } from '@aptos-labs/ts-sdk';
import { TransactionResult } from '../types';
import { IS_TESTNET } from '../constants/network';
import { toStructTag } from '../helpers';

export const registerCoinStoreIfNeeded = async (
  walletAddress: string,
  coinType: string,
  signTransaction: (payload: any) => Promise<{ hash: string }>
): Promise<TransactionResult> => {
  try {
    // Set up Aptos client
    const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);
    
    // Check if coin store exists
    const accountAddress = AccountAddress.fromString(walletAddress);
    const resources = await aptos.getAccountResources({ accountAddress });
    
    const coinTypeStr = toStructTag(coinType);
    const coinStoreType = `0x1::coin::CoinStore<${coinTypeStr}>`;
    
    if (resources.find(r => r.type === coinStoreType)) {
      return { success: true };
    }
    
    // Register coin store
    const payload = {
      function: "0x1::managed_coin::register",
      type_arguments: [coinTypeStr],
      arguments: [],
    };
    
    const result = await signTransaction(payload);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Error registering coin store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
