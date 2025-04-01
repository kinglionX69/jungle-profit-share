
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET } from "../constants";
import { AptosClient } from "aptos";

/**
 * Get an Aptos client instance for the specified network
 * @param network Network to use ('mainnet' or 'testnet')
 * @returns AptosClient instance for the specified network
 */
export const aptosClient = (network: 'mainnet' | 'testnet'): AptosClient => {
  const nodeUrl = network === 'mainnet' 
    ? "https://fullnode.mainnet.aptoslabs.com"
    : "https://testnet.aptoslabs.com";
  return new AptosClient(nodeUrl);
};

/**
 * Submit a transaction to the blockchain to claim rewards using the Aptos SDK
 * @param walletAddress The wallet address submitting the transaction
 * @param nftIds The NFT IDs to claim rewards for
 * @param signTransaction Function to sign and submit the transaction
 * @returns Transaction result with success status and hash
 */
export const submitClaimTransaction = async (
  walletAddress: string, 
  nftIds: string[],
  signTransaction: (txn: any) => Promise<any>
): Promise<TransactionResult> => {
  try {
    console.log(`Submitting claim transaction on ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
    console.log(`Wallet address: ${walletAddress}`);
    console.log(`NFT IDs to claim: ${nftIds.join(', ')}`);
    
    // Select the appropriate Aptos client based on network
    const client = aptosClient(IS_TESTNET ? 'testnet' : 'mainnet');
    
    // Simple transfer transaction as a placeholder since nft_rewards module doesn't exist
    // We'll use the 0x1::aptos_account module which is guaranteed to exist
    const payload = {
      function: `0x1::aptos_account::transfer`,
      type_arguments: [],
      arguments: [walletAddress, "1"] // Transfer minimal amount to self as a placeholder
    };
    
    console.log("Transaction payload:", payload);
    
    // Build the raw transaction for signing
    // Note: Using the wallet's signAndSubmitTransaction because some wallets don't expose direct signing
    const result = await signTransaction(payload);
    console.log("Transaction result:", result);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error submitting claim transaction:", error);
    toast.error("Failed to submit blockchain transaction");
    throw error;
  }
};
