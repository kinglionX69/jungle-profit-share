
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from "../constants/network";
import { SUPPORTED_TOKENS } from "../constants/tokens";
import { toStructTag } from "../helpers";
import { registerCoinStoreIfNeeded } from "./coinStoreRegistration";

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
    
    // Validate token type based on network
    if (IS_TESTNET) {
      // On testnet, only APT is supported
      if (tokenType !== SUPPORTED_TOKENS.APT) {
        const error = "Only APT tokens are supported on testnet";
        console.error(error);
        return { success: false, error };
      }
    } else {
      // On mainnet, only APT and EMOJICOIN are supported
      if (tokenType !== SUPPORTED_TOKENS.APT && tokenType !== SUPPORTED_TOKENS.EMOJICOIN) {
        const error = "Only APT and EMOJICOIN tokens are supported";
        console.error(error);
        return { success: false, error };
      }
    }
    
    // Get the correct escrow wallet address based on network
    const escrowWalletAddress = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    console.log(`Using escrow wallet: ${escrowWalletAddress}`);
    
    // Always register the coin store for the token type, even for APT
    // This ensures the user has the coin store registered
    toast.loading("Checking coin registration...");
    
    try {
      // Register coin store for admin wallet
      console.log(`Registering token ${tokenType} for admin wallet ${adminWalletAddress}...`);
      const adminRegistrationResult = await registerCoinStoreIfNeeded(
        adminWalletAddress,
        tokenType,
        signTransaction
      );
      
      if (!adminRegistrationResult.success) {
        toast.dismiss();
        toast.error("Failed to register token store for your wallet");
        return adminRegistrationResult;
      }
    } catch (error) {
      console.error("Error during coin registration:", error);
      toast.dismiss();
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during coin registration" 
      };
    }
    
    toast.dismiss();
    toast.loading("Processing deposit...");
    
    // Calculate the amount in smallest units (APT uses 8 decimal places)
    const amountInSmallestUnits = Math.floor(amount * 100000000); // 8 decimal places for APT, ensure integer
    
    // Prepare the tokenType in the format expected by the TypeScript SDK
    const formattedTokenType = toStructTag(tokenType);
    
    // Create the transaction payload using the simpler object format
    const payload = {
      function: "0x1::coin::transfer",
      type_arguments: [formattedTokenType],
      arguments: [
        escrowWalletAddress, // Recipient address
        amountInSmallestUnits.toString(), // Amount in smallest units
      ]
    };
    
    console.log("Deposit payload:", payload);
    
    // Sign and submit the transaction
    console.log("Signing and submitting deposit transaction...");
    const result = await signTransaction(payload);
    toast.dismiss();
    console.log("Deposit transaction result:", result);
    
    if (!result.hash) {
      return {
        success: false,
        transactionHash: null,
        error: "Transaction failed with no hash returned"
      };
    }
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Error depositing tokens:", error);
    toast.dismiss();
    
    // Provide more helpful error messages
    let errorMessage = "Failed to deposit tokens";
    if (error instanceof Error) {
      if (error.message.includes("Account hasn't registered") || 
          error.message.includes("CoinStore")) {
        errorMessage = "Token registration required. Please try again.";
      } else if (error.message.includes("insufficient balance")) {
        errorMessage = "Insufficient balance to complete the transaction";
      } else if (error.message.includes("rejected")) {
        errorMessage = "Transaction rejected by wallet";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Withdraw tokens from the escrow wallet (admin only)
 * @param adminWalletAddress The admin wallet address with withdrawal privileges
 * @param tokenType The token type to withdraw
 * @param amount The amount to withdraw
 * @param recipientAddress The address to send tokens to (defaults to admin wallet)
 * @param signTransaction Function to sign and submit the transaction
 * @returns Transaction result with success status and hash
 */
export const withdrawTokensTransaction = async (
  adminWalletAddress: string,
  tokenType: string,
  amount: number,
  recipientAddress: string = adminWalletAddress,
  signTransaction: (txn: any) => Promise<any>
): Promise<TransactionResult> => {
  try {
    console.log(`Withdrawing tokens on ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
    console.log(`Admin wallet address: ${adminWalletAddress}`);
    console.log(`Token type: ${tokenType}`);
    console.log(`Amount: ${amount}`);
    console.log(`Recipient address: ${recipientAddress}`);
    
    // Validate token type based on network
    if (IS_TESTNET) {
      // On testnet, only APT is supported
      if (tokenType !== SUPPORTED_TOKENS.APT) {
        const error = "Only APT tokens are supported on testnet";
        console.error(error);
        return { success: false, error };
      }
    } else {
      // On mainnet, only APT and EMOJICOIN are supported
      if (tokenType !== SUPPORTED_TOKENS.APT && tokenType !== SUPPORTED_TOKENS.EMOJICOIN) {
        const error = "Only APT and EMOJICOIN tokens are supported";
        console.error(error);
        return { success: false, error };
      }
    }
    
    // Calculate the amount in smallest units (APT uses 8 decimal places)
    const amountInSmallestUnits = Math.floor(amount * 100000000); // 8 decimal places for APT
    
    // Prepare the tokenType in the format expected by the TypeScript SDK
    const formattedTokenType = toStructTag(tokenType);
    
    // Create the transaction payload using the simpler object format
    const payload = {
      function: "0x1::managed_coin::transfer",
      type_arguments: [formattedTokenType],
      arguments: [
        recipientAddress, // Recipient address  
        amountInSmallestUnits.toString(), // Amount in smallest units
      ]
    };
    
    console.log("Withdrawal payload:", payload);
    
    // Sign and submit the transaction
    console.log("Signing and submitting withdrawal transaction...");
    toast.loading("Processing withdrawal transaction...");
    const result = await signTransaction(payload);
    toast.dismiss();
    console.log("Withdrawal transaction result:", result);
    
    if (!result.hash) {
      return {
        success: false,
        transactionHash: null,
        error: "Transaction failed with no hash returned"
      };
    }
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Error withdrawing tokens:", error);
    toast.dismiss();
    
    let errorMessage = "Failed to withdraw tokens";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
