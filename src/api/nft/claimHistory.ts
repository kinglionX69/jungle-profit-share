
import { supabase } from "@/integrations/supabase/client";
import { ClaimHistory } from "../types/nft.types";

/**
 * Fetches claim history for a wallet
 * @param walletAddress The wallet address to check claim history for
 */
export const fetchClaimHistory = async (walletAddress: string): Promise<ClaimHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('claim_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('claim_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching claim history:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      date: new Date(item.claim_date),
      amount: Number(item.amount),
      tokenName: item.token_name,
      nfts: item.token_ids
    }));
  } catch (error) {
    console.error("Error fetching claim history:", error);
    return [];
  }
};
