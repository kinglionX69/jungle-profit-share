
import { toast } from "sonner";
import { TransactionResult } from "../types";
import { IS_TESTNET, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET, SUPPORTED_TOKENS } from "../constants";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { registerCoinStoreIfNeeded } from "./coinStoreRegistration";

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

    // First, ensure user has a coin store registered for APT
    const coinRegistrationResult = await registerCoinStoreIfNeeded(
      walletAddress,
      SUPPORTED_TOKENS.APT,
      signTransaction
    );

    if (!coinRegistrationResult.success) {
      throw new Error("Failed to register coin store for APT");
    }

    // Set up the Aptos client
    const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);
    
    // Calculate amount in octas (smallest units)
    const amountInOctas = Math.floor(totalAmount * 100000000);
    
    // Get escrow wallet based on network
    const escrowWalletAddress = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    
    // Create the transaction payload for transferring APT
    const payload = {
      function: "0x1::coin::transfer",
      type_arguments: [SUPPORTED_TOKENS.APT],
      arguments: [
        walletAddress, // recipient address
        amountInOctas.toString() // amount in smallest units
      ]
    };
    
    console.log("Submitting transfer transaction with payload:", payload);
    
    // Sign and submit the transaction
    const result = await signTransaction(payload);
    
    if (!result || !result.hash) {
      throw new Error("Transaction failed - no hash returned");
    }
    
    console.log("Transaction successful with hash:", result.hash);
    
    return {
      success: true,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Error submitting claim transaction:", error);
    throw error;
  }
};
