
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET, SUPPORTED_TOKENS } from "../constants";
import { AptosClient, Types } from "aptos";

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
    
    // The amount to claim is 0.1 APT per NFT
    const amountPerNft = 0.1;
    const totalAmount = nftIds.length * amountPerNft;
    console.log(`Total amount to claim: ${totalAmount.toFixed(2)} APT`);
    
    // We need to call the withdraw-from-escrow edge function
    // This function will transfer APT from the escrow wallet to the user's wallet
    const escrowNetwork = IS_TESTNET ? 'testnet' : 'mainnet';
    
    // Log the request details for debugging
    console.log(`Sending withdraw request to escrow function with:`);
    console.log(`- Network: ${escrowNetwork}`);
    console.log(`- Token: ${SUPPORTED_TOKENS.APT}`);
    console.log(`- Amount: ${totalAmount}`);
    console.log(`- Recipient: ${walletAddress}`);
    
    // Use direct URL to the Supabase Edge Function instead of relative URL
    // When an app is served from a subfolder, relative URLs can cause issues
    try {
      // Get the base URL from window.location to ensure we're using the right path
      const baseUrl = new URL(window.location.href).origin;
      const apiUrl = `${baseUrl}/api/withdraw-from-escrow`;

      console.log(`Calling API at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenType: SUPPORTED_TOKENS.APT,
          amount: totalAmount,
          recipientAddress: walletAddress,
          network: escrowNetwork,
          adminWalletAddress: "claim" // This is just for logging purposes
        })
      });
      
      // Check if response is JSON by looking at Content-Type header
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, get text and log it for debugging
        const textResponse = await response.text();
        console.error("Received non-JSON response:", textResponse);
        throw new Error("API returned non-JSON response. Please check server logs.");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error from escrow endpoint:", errorData);
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Withdrawal transaction result:", result);
      
      if (!result.success) {
        throw new Error(result.error || "Unknown error processing claim");
      }
      
      return {
        success: true,
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error("API request error:", error);
      
      // Provide more context about the error
      if (error instanceof SyntaxError) {
        throw new Error("API returned invalid JSON. The server might be misconfigured.");
      }
      
      // Re-throw the error with better context
      throw error;
    }
  } catch (error) {
    console.error("Error submitting claim transaction:", error);
    toast.error("Failed to submit blockchain transaction");
    throw error;
  }
};
