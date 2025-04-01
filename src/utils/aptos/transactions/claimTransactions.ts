
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from "../constants";
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
    
    // The amount to claim is 0.1 APT per NFT
    const amountPerNft = 0.1;
    const totalAmount = nftIds.length * amountPerNft;
    console.log(`Total amount to claim: ${totalAmount.toFixed(2)} APT`);
    
    // We need to call the withdraw-from-escrow edge function
    // This function will transfer APT from the escrow wallet to the user's wallet
    const escrowNetwork = IS_TESTNET ? 'testnet' : 'mainnet';
    const response = await fetch('/api/withdraw-from-escrow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenType: "0x1::aptos_coin::AptosCoin",
        amount: totalAmount,
        recipientAddress: walletAddress,
        network: escrowNetwork,
        adminWalletAddress: "claim" // This is just for logging purposes
      })
    });
    
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
    console.error("Error submitting claim transaction:", error);
    toast.error("Failed to submit blockchain transaction");
    throw error;
  }
};
