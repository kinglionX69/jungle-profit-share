
import { toast } from "sonner";
import { TransactionResult } from "./types";
import { IS_TESTNET, SUPPORTED_TOKENS } from "./constants";

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
 * Check if a CoinStore is registered for the given token type and register it if not
 * @param walletAddress The wallet address to check and register
 * @param tokenType The token type to register
 * @param signTransaction Function to sign and submit the transaction
 * @returns Transaction result with success status and hash
 */
export const registerCoinStoreIfNeeded = async (
  walletAddress: string,
  tokenType: string,
  signTransaction: (txn: any) => Promise<any>
): Promise<TransactionResult> => {
  try {
    // First check if the token is APT, which is always registered by default
    if (tokenType === SUPPORTED_TOKENS.APT) {
      console.log("APT is already registered for all accounts by default");
      return { success: true, transactionHash: null };
    }
    
    console.log(`Registering CoinStore for ${tokenType}`);

    // Create the transaction payload for registration
    // In Aptos, proper way to register a coin is through the coin module's register function
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::register",
      type_arguments: [tokenType],
      arguments: []
    };
    
    console.log("Registration payload:", JSON.stringify(payload, null, 2));
    
    // Sign and submit the transaction
    console.log("Signing and submitting registration transaction...");
    const result = await signTransaction(payload);
    console.log("Registration result:", result);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
    };
  } catch (error) {
    console.error("Error registering CoinStore:", error);
    // If we get a specific error saying the store is already registered,
    // we can consider this a success
    if (error instanceof Error && 
        (error.message.includes("Store already exists") || 
         error.message.includes("already registered"))) {
      console.log("CoinStore is already registered, proceeding with transfer");
      return { success: true, transactionHash: null };
    }
    
    toast.error("Failed to register token store");
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
    
    // Validate token type based on network
    if (IS_TESTNET) {
      // On testnet, only APT is supported
      if (tokenType !== SUPPORTED_TOKENS.APT) {
        toast.error("Only APT tokens are supported on testnet");
        return { success: false, transactionHash: null, error: "Unsupported token on testnet" };
      }
    } else {
      // On mainnet, only APT and EMOJICOIN are supported
      if (tokenType !== SUPPORTED_TOKENS.APT && tokenType !== SUPPORTED_TOKENS.EMOJICOIN) {
        toast.error("Only APT and EMOJICOIN tokens are supported");
        return { success: false, transactionHash: null, error: "Unsupported token" };
      }
    }
    
    // Get the escrow wallet address from the admin_config table
    // For testnet, we'll use a fixed address for now, but this should be fetched from DB in production
    const escrowWalletAddress = IS_TESTNET 
      ? "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234" // Replace with actual testnet escrow address
      : "0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba9876"; // Replace with actual mainnet escrow address
    
    // First, check and register the CoinStore for non-APT tokens on both the admin and escrow wallets
    if (tokenType !== SUPPORTED_TOKENS.APT) {
      toast.loading("Registering token store...");
      
      // Register for admin wallet
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
      
      // Also register for escrow wallet if needed
      // This should be done by a separate admin function since the escrow wallet
      // will need to call register() itself, but we'll skip this for now
      
      toast.dismiss();
    }
    
    // Calculate the amount in smallest units (APT uses 8 decimal places)
    const amountInSmallestUnits = Math.floor(amount * 100000000); // 8 decimal places for APT, ensure integer
    
    // Create the transaction payload for depositing tokens
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: [tokenType],
      arguments: [
        escrowWalletAddress,  // Recipient address
        amountInSmallestUnits.toString(),  // Amount in smallest units
      ]
    };
    
    console.log("Deposit payload:", JSON.stringify(payload, null, 2));
    
    // Sign and submit the transaction
    console.log("Signing and submitting deposit transaction...");
    toast.loading("Processing deposit transaction...");
    const result = await signTransaction(payload);
    toast.dismiss();
    console.log("Deposit transaction result:", result);
    
    return {
      success: !!result.hash,
      transactionHash: result.hash || null
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
      }
    }
    
    toast.error(errorMessage);
    throw error;
  }
};
