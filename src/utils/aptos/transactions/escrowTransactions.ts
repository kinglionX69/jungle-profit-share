import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from "../constants";
import { getAptosClient } from "../client";
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
    
    // For browser environment, we need to call the Edge Function instead of using Deno directly
    const escrowNetwork = IS_TESTNET ? 'testnet' : 'mainnet';
    const adminWalletAddress = "admin"; // This is just for logging purposes
    
    const response = await fetch('/api/withdraw-from-escrow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenType,
        amount,
        recipientAddress,
        network: escrowNetwork,
        adminWalletAddress
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from escrow endpoint:", errorData);
      return {
        success: false,
        error: errorData.error || `Failed with status: ${response.status}`
      };
    }
    
    const result = await response.json();
    console.log("Withdrawal transaction result:", result);
    
    return {
      success: true,
      transactionHash: result.transactionHash
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
