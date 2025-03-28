
import { toast } from "sonner";
import { TransactionResult } from "./types";

/**
 * Submit a transaction to the blockchain to claim rewards
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
    // Create the transaction payload
    // This is a simplified example - you would need to create the actual transaction
    // based on your smart contract's requirements
    const payload = {
      type: "entry_function_payload",
      function: "0x3::token::claim_rewards",  // Updated from 0x1::aptos_token to 0x3::token
      type_arguments: [],
      arguments: [
        nftIds,  // The NFT token IDs being claimed
      ]
    };
    
    // Sign and submit the transaction
    const result = await signTransaction(payload);
    
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

/**
 * Deposit tokens to the escrow wallet (admin only)
 * @param adminWalletAddress The admin wallet address
 * @param tokenType The token type to deposit
 * @param amount The amount to deposit
 * @param payoutPerNFT The payout per NFT to set
 * @param signTransaction Function to sign and submit the transaction
 * @returns Transaction result with success status and hash
 */
export const depositTokensTransaction = async (
  adminWalletAddress: string, 
  tokenType: string, 
  amount: number, 
  payoutPerNFT: number,
  signTransaction: (txn: any) => Promise<any>
): Promise<TransactionResult> => {
  try {
    // Create the transaction payload for depositing tokens
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",  // This is correct, the coin module is at 0x1
      type_arguments: [tokenType],  // e.g., "0x1::aptos_coin::AptosCoin"
      arguments: [
        "ESCROW_WALLET_ADDRESS",  // Replace with actual escrow wallet address
        amount.toString(),  // Amount in smallest units
      ]
    };
    
    // Sign and submit the transaction
    const result = await signTransaction(payload);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error depositing tokens:", error);
    toast.error("Failed to deposit tokens");
    throw error;
  }
};
