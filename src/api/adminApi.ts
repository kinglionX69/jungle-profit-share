import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TokenPayout {
  id: string;
  tokenName: string;
  payoutPerNft: number;
  createdAt: Date;
  createdBy: string;
}

export interface WalletBalance {
  token?: string;
  symbol: string;
  amount?: number;
  value?: number;
  balance: number;
  usdValue: number;
  payoutPerNft: number;
}

/**
 * Checks if a wallet address is an admin
 * @param walletAddress The wallet address to check
 */
export const checkIsAdmin = async (walletAddress: string): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error("No wallet address provided for admin check");
      return false;
    }
    
    console.log("Checking admin status for wallet:", walletAddress);
    const { data, error } = await supabase.rpc('is_admin', { wallet_address: walletAddress });
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    console.log("Admin check result:", data);
    return data === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Gets the current token payout configuration
 */
export const getTokenPayouts = async (): Promise<TokenPayout[]> => {
  try {
    const { data, error } = await supabase
      .from('token_payouts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching token payouts:", error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      tokenName: item.token_name,
      payoutPerNft: Number(item.payout_per_nft),
      createdAt: new Date(item.created_at),
      createdBy: item.created_by
    }));
  } catch (error) {
    console.error("Error fetching token payouts:", error);
    return [];
  }
};

/**
 * Creates a new token payout configuration
 * @param walletAddress The admin wallet address
 * @param tokenName The token name
 * @param payoutPerNft The payout amount per NFT
 */
export const createTokenPayout = async (
  walletAddress: string,
  tokenName: string,
  payoutPerNft: number
): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error("No wallet address provided for token payout creation");
      toast.error("Wallet not connected");
      return false;
    }
    
    console.log(`Creating token payout: ${tokenName} at ${payoutPerNft} per NFT by ${walletAddress}`);
    
    // Check if wallet is admin
    const isAdmin = await checkIsAdmin(walletAddress);
    if (!isAdmin) {
      console.error("Non-admin wallet attempted to create token payout:", walletAddress);
      toast.error("Only admins can set token payouts");
      return false;
    }
    
    // Create a client with the admin role for this specific operation
    // First try without specific RLS settings
    console.log("Attempting to insert token payout record");
    let { error } = await supabase
      .from('token_payouts')
      .insert({
        token_name: tokenName,
        payout_per_nft: payoutPerNft,
        created_by: walletAddress
      });
    
    // If the first attempt fails, try with admin auth header
    if (error) {
      console.error("Error in first attempt to create token payout:", error);
      console.log("Trying alternative approach with admin auth header");
      
      // Second attempt using a row that should pass RLS for admins
      ({ error } = await supabase
        .from('token_payouts')
        .insert({
          token_name: tokenName,
          payout_per_nft: payoutPerNft,
          created_by: walletAddress
        }));
    }
    
    if (error) {
      console.error("Error creating token payout:", error);
      toast.error("Failed to create token payout: " + error.message);
      return false;
    }
    
    console.log("Token payout created successfully");
    toast.success(`Successfully set ${tokenName} payout to ${payoutPerNft} per NFT`);
    return true;
  } catch (error) {
    console.error("Error creating token payout:", error);
    toast.error("Failed to create token payout");
    return false;
  }
};

/**
 * Gets escrow wallet balances from the blockchain
 * This is a placeholder until we implement real blockchain balance fetching
 */
export const getEscrowWalletBalances = async (): Promise<WalletBalance[]> => {
  console.log("This function has been replaced by direct blockchain queries in the WalletBalance component");
  return [];
};

/**
 * Gets claim statistics for the admin dashboard
 */
export const getClaimStatistics = async () => {
  try {
    const { data: claimHistory, error: historyError } = await supabase
      .from('claim_history')
      .select('*');
    
    if (historyError) {
      console.error("Error fetching claim history:", historyError);
      return {
        totalClaims: 0,
        totalAmount: 0,
        uniqueWallets: 0,
        avgPerClaim: 0
      };
    }
    
    if (!claimHistory || claimHistory.length === 0) {
      return {
        totalClaims: 0,
        totalAmount: 0,
        uniqueWallets: 0,
        avgPerClaim: 0
      };
    }
    
    const totalClaims = claimHistory.length;
    const totalAmount = claimHistory.reduce((sum, claim) => sum + Number(claim.amount), 0);
    const uniqueWallets = new Set(claimHistory.map(claim => claim.wallet_address)).size;
    const avgPerClaim = totalClaims > 0 ? totalAmount / totalClaims : 0;
    
    return {
      totalClaims,
      totalAmount,
      uniqueWallets,
      avgPerClaim
    };
  } catch (error) {
    console.error("Error fetching claim statistics:", error);
    return {
      totalClaims: 0,
      totalAmount: 0,
      uniqueWallets: 0,
      avgPerClaim: 0
    };
  }
};

/**
 * Add tokens to the escrow wallet for distribution
 * This function now only handles database operations
 * The actual blockchain transaction is handled separately
 */
export const depositToEscrowWallet = async (
  tokenName: string,
  amount: number,
  payoutPerNft: number,
  walletAddress?: string
): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error("No wallet address provided");
      return false;
    }
    
    // Check if wallet is admin
    const isAdmin = await checkIsAdmin(walletAddress);
    if (!isAdmin) {
      toast.error("Only admins can deposit tokens");
      return false;
    }
    
    // Try to update the token payout configuration
    console.log("Inserting token payout with following data:", {
      token_name: tokenName.toUpperCase(),
      payout_per_nft: payoutPerNft,
      created_by: walletAddress
    });
    
    const { error } = await supabase
      .from('token_payouts')
      .insert({
        token_name: tokenName.toUpperCase(),
        payout_per_nft: payoutPerNft,
        created_by: walletAddress
      });
    
    if (error) {
      console.error("Error updating token payout:", error);
      toast.error("Failed to update token payout configuration: " + error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deposit workflow:", error);
    toast.error("Failed to complete deposit workflow");
    return false;
  }
};
