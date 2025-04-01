
import { AptosAccount } from "aptos";
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from "../constants";
import { aptosClient } from "../client";
import { toStructTag } from "../helpers";

/**
 * Withdraw tokens from the escrow wallet using the escrow private key
 * Only admins can execute this function
 * @param tokenType The token type to withdraw
 * @param amount The amount to withdraw
 * @param recipientAddress The address to send tokens to
 * @returns Transaction result with success status and hash
 */
export const withdrawFromEscrowWallet = async (
  tokenType: string, 
  amount: number, 
  recipientAddress: string
): Promise<TransactionResult> => {
  try {
    console.log(`Withdrawing tokens from escrow on ${IS_TESTNET ? 'testnet' : 'mainnet'}`);
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
    
    // Get the escrow wallet address based on network
    const escrowWalletAddress = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    console.log(`Using escrow wallet: ${escrowWalletAddress}`);
    
    // Fetch private key from environment
    const privateKeyHex = Deno?.env?.get ? Deno.env.get("ESCROW_PRIVATE_KEY") : null;
    
    if (!privateKeyHex) {
      const error = "Escrow private key not found in environment";
      console.error(error);
      return { success: false, error };
    }
    
    // Convert hex private key to Uint8Array and create account
    const privateKeyBytes = hexToUint8Array(privateKeyHex);
    const escrowAccount = new AptosAccount(privateKeyBytes);
    
    // Verify the account address matches the expected escrow wallet
    if (escrowAccount.address().toString() !== escrowWalletAddress) {
      const error = "Escrow private key does not match configured escrow wallet address";
      console.error(error);
      return { success: false, error };
    }
    
    // Calculate the amount in smallest units (APT uses 8 decimal places)
    const amountInSmallestUnits = Math.floor(amount * 100000000); // 8 decimal places for APT
    
    // Prepare the tokenType in the format expected by the TypeScript SDK
    const formattedTokenType = toStructTag(tokenType);
    
    // Create the transaction payload
    const payload = {
      function: "0x1::coin::transfer",
      type_arguments: [formattedTokenType],
      arguments: [
        recipientAddress, // Recipient address
        amountInSmallestUnits.toString(), // Amount in smallest units
      ]
    };
    
    console.log("Withdrawal payload:", payload);
    
    // Create and sign the transaction
    toast.loading("Processing withdrawal transaction...");
    
    const txnRequest = await aptosClient.generateTransaction(
      escrowAccount.address(),
      payload
    );
    
    const signedTxn = await aptosClient.signTransaction(
      escrowAccount,
      txnRequest
    );
    
    const result = await aptosClient.submitTransaction(signedTxn);
    await aptosClient.waitForTransaction(result.hash);
    
    toast.dismiss();
    console.log("Withdrawal transaction result:", result);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Error withdrawing tokens from escrow:", error);
    toast.dismiss();
    
    let errorMessage = "Failed to withdraw tokens from escrow";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Helper function to convert hex string to Uint8Array
 * @param hexString The hex string to convert
 * @returns Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  // Remove 0x prefix if present
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }
  
  // Ensure even length
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  
  const bytes = new Uint8Array(hexString.length / 2);
  
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i/2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  
  return bytes;
}
