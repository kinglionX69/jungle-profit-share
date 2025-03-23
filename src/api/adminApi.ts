
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
  token: string;
  symbol: string;
  amount: number;
  value: number;
}

/**
 * Checks if a wallet address is an admin
 * @param walletAddress The wallet address to check
 */
export const checkIsAdmin = async (walletAddress: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin', { wallet_address: walletAddress });
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
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
    // Check if wallet is admin
    const isAdmin = await checkIsAdmin(walletAddress);
    if (!isAdmin) {
      toast.error("Only admins can set token payouts");
      return false;
    }
    
    const { error } = await supabase
      .from('token_payouts')
      .insert({
        token_name: tokenName,
        payout_per_nft: payoutPerNft,
        created_by: walletAddress
      });
    
    if (error) {
      console.error("Error creating token payout:", error);
      toast.error("Failed to create token payout");
      return false;
    }
    
    toast.success(`Successfully set ${tokenName} payout to ${payoutPerNft} per NFT`);
    return true;
  } catch (error) {
    console.error("Error creating token payout:", error);
    toast.error("Failed to create token payout");
    return false;
  }
};

/**
 * Gets mock wallet balances for the admin view
 * In a real implementation, this would fetch from the blockchain
 */
export const getEscrowWalletBalances = async (): Promise<WalletBalance[]> => {
  // This is a mock implementation - in a real app, we would fetch from blockchain
  return [
    {
      token: 'Aptos',
      symbol: 'APT',
      amount: 450,
      value: 18000,
    },
    {
      token: 'USD Coin',
      symbol: 'USDC',
      amount: 2250,
      value: 2250,
    },
    {
      token: 'Aptos Proto Token',
      symbol: 'PROT',
      amount: 1500,
      value: 150,
    },
  ];
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
 * In a real implementation, this would call the blockchain
 */
export const depositToEscrowWallet = async (
  tokenName: string,
  amount: number,
  payoutPerNft: number
): Promise<boolean> => {
  try {
    // In a real implementation, this would call the blockchain
    // Here we just simulate success and update the token payout
    
    // Update the token payout configuration
    const { error } = await supabase
      .from('token_payouts')
      .insert({
        token_name: tokenName.toUpperCase(),
        payout_per_nft: payoutPerNft,
        created_by: supabase.headers?.['wallet-address'] || 'unknown'
      });
    
    if (error) {
      console.error("Error updating token payout:", error);
      toast.error("Failed to update token payout configuration");
      return false;
    }
    
    toast.success(`Successfully deposited ${amount} ${tokenName.toUpperCase()} to the escrow wallet`);
    return true;
  } catch (error) {
    console.error("Error depositing to escrow wallet:", error);
    toast.error("Failed to deposit to escrow wallet");
    return false;
  }
};
