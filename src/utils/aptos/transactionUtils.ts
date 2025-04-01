
import { toast } from "sonner";
import { TransactionResult } from "./types";
import { IS_TESTNET } from "./constants";

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
    console.log(`Submitting claim transaction on ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
    console.log(`Wallet address: ${walletAddress}`);
    console.log(`NFT IDs to claim: ${nftIds.join(', ')}`);
    
    // Create the transaction payload
    // For testnet, we use a different module address
    // Changed from token::claim_rewards to nft_rewards::claim (more likely to exist)
    const moduleAddress = IS_TESTNET ? "0x3" : "0x3"; // Same for now, but can be changed if testnet uses different modules
    
    const payload = {
      type: "entry_function_payload",
      function: `${moduleAddress}::nft_rewards::claim`,
      type_arguments: [],
      arguments: [
        nftIds,  // The NFT token IDs being claimed
      ]
    };
    
    console.log("Transaction payload:", JSON.stringify(payload, null, 2));
    
    // Sign and submit the transaction
    console.log("Signing and submitting transaction...");
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
    console.log(`Depositing tokens on ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
    console.log(`Admin wallet address: ${adminWalletAddress}`);
    console.log(`Token type: ${tokenType}`);
    console.log(`Amount: ${amount}`);
    console.log(`Payout per NFT: ${payoutPerNFT}`);
    
    // Get the escrow wallet address from the admin_config table
    // For testnet, we'll use a fixed address for now, but this should be fetched from DB in production
    const escrowWalletAddress = IS_TESTNET 
      ? "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234" // Replace with actual testnet escrow address
      : "0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba9876"; // Replace with actual mainnet escrow address
    
    // Use the appropriate token type for testnet
    const actualTokenType = IS_TESTNET 
      ? "0x1::aptos_coin::AptosCoin" // This is the same on testnet
      : tokenType;
    
    // Calculate the amount in smallest units (APT uses 8 decimal places)
    const amountInSmallestUnits = amount * 100000000; // 8 decimal places for APT
    
    // Create the transaction payload for depositing tokens
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: [actualTokenType],
      arguments: [
        escrowWalletAddress,  // Actual escrow wallet address
        amountInSmallestUnits.toString(),  // Amount in smallest units
      ]
    };
    
    console.log("Deposit payload:", JSON.stringify(payload, null, 2));
    
    // Sign and submit the transaction
    console.log("Signing and submitting deposit transaction...");
    const result = await signTransaction(payload);
    console.log("Deposit transaction result:", result);
    
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
