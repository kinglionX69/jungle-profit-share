
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET } from "../constants";
import { Aptos, AccountAddress, TransactionPayload } from "@aptos-labs/ts-sdk";
import { aptosClient } from "../client";

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
    const client = IS_TESTNET 
      ? aptosClient('testnet')
      : aptosClient('mainnet');
    
    // For testnet, we use a different module address
    const moduleAddress = IS_TESTNET ? "0x3" : "0x3"; // Same for now, but can be changed if testnet uses different modules
    
    // Create the transaction payload using the SDK's builder pattern
    const payload = {
      function: `${moduleAddress}::nft_rewards::claim`,
      type_arguments: [],
      arguments: [nftIds]
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
