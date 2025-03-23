
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NFT {
  tokenId: string;
  name: string;
  imageUrl: string;
  isEligible: boolean;
  isLocked: boolean;
  unlockDate?: Date;
}

export interface ClaimHistory {
  id: string;
  date: Date;
  amount: number;
  tokenName: string;
  nfts: string[];
}

/**
 * Fetches NFTs for a wallet and determines eligibility
 * @param walletAddress The wallet address to check NFTs for
 */
export const fetchNFTs = async (walletAddress: string): Promise<NFT[]> => {
  try {
    // For demo, let's use mock NFTs
    // In a real implementation, this would call a blockchain API
    const mockNfts: NFT[] = [
      {
        tokenId: "1",
        name: "Proud Lion #1",
        imageUrl: "https://picsum.photos/seed/lion1/300/300",
        isEligible: true,
        isLocked: false
      },
      {
        tokenId: "2",
        name: "Proud Lion #2",
        imageUrl: "https://picsum.photos/seed/lion2/300/300",
        isEligible: true,
        isLocked: false
      },
      {
        tokenId: "3",
        name: "Proud Lion #3",
        imageUrl: "https://picsum.photos/seed/lion3/300/300",
        isEligible: true,
        isLocked: false
      },
      {
        tokenId: "4",
        name: "Proud Lion #4",
        imageUrl: "https://picsum.photos/seed/lion4/300/300",
        isEligible: true,
        isLocked: false
      }
    ];
    
    // Fetch NFT claims from Supabase to determine what's locked
    const { data: nftClaimsData, error: nftClaimsError } = await supabase
      .from('nft_claims')
      .select('*')
      .eq('wallet_address', walletAddress);
    
    if (nftClaimsError) {
      console.error("Error fetching NFT claims:", nftClaimsError);
      throw nftClaimsError;
    }
    
    // If we have NFT claim data, update the mock NFTs to reflect locked status
    if (nftClaimsData && nftClaimsData.length > 0) {
      nftClaimsData.forEach(claim => {
        const nftIndex = mockNfts.findIndex(nft => nft.tokenId === claim.token_id);
        if (nftIndex !== -1) {
          mockNfts[nftIndex].isLocked = true;
          mockNfts[nftIndex].isEligible = false;
          mockNfts[nftIndex].unlockDate = new Date(claim.unlock_date);
        }
      });
    }
    
    return mockNfts;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return [];
  }
};

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

/**
 * Calculates the claimable amount based on eligible NFTs
 * @param nfts The NFTs to calculate claims for
 */
export const calculateClaimableAmount = async (nfts: NFT[]): Promise<number> => {
  try {
    // Get the token payout amount from the database
    const { data, error } = await supabase
      .from('token_payouts')
      .select('payout_per_nft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching token payout:", error);
      // Default to 2 APT per NFT if we can't get the payout amount
      const eligibleCount = nfts.filter(nft => nft.isEligible).length;
      return eligibleCount * 2;
    }
    
    const payoutPerNft = data?.payout_per_nft || 2; // Default to 2 if no payout is configured
    const eligibleCount = nfts.filter(nft => nft.isEligible).length;
    return eligibleCount * Number(payoutPerNft);
  } catch (error) {
    console.error("Error calculating claimable amount:", error);
    // Default to 2 APT per NFT if we encounter an error
    const eligibleCount = nfts.filter(nft => nft.isEligible).length;
    return eligibleCount * 2;
  }
};

/**
 * Submits a claim for eligible NFTs
 * @param walletAddress The wallet address to claim for
 * @param eligibleNfts The eligible NFTs to claim
 */
export const submitClaim = async (
  walletAddress: string,
  eligibleNfts: NFT[]
): Promise<boolean> => {
  try {
    if (eligibleNfts.length === 0) {
      toast.error("No eligible NFTs to claim");
      return false;
    }
    
    // Get payout amount per NFT
    const { data: payoutData, error: payoutError } = await supabase
      .from('token_payouts')
      .select('payout_per_nft, token_name')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (payoutError) {
      console.error("Error fetching token payout:", payoutError);
      // Continue with default values
    }
    
    const payoutPerNft = payoutData?.payout_per_nft || 2; // Default to 2 if no payout is configured
    const tokenName = payoutData?.token_name || "APT"; // Default to APT if no token is configured
    const totalAmount = eligibleNfts.length * Number(payoutPerNft);
    
    // Simulate blockchain transaction
    const transactionHash = `0x${Math.random().toString(16).substring(2, 62)}`;
    
    // Insert into nft_claims for each NFT
    for (const nft of eligibleNfts) {
      const { error: claimError } = await supabase
        .from('nft_claims')
        .insert({
          wallet_address: walletAddress,
          token_id: nft.tokenId,
          amount: payoutPerNft,
          transaction_hash: transactionHash
        });
      
      if (claimError) {
        console.error("Error inserting claim:", claimError);
        toast.error("Failed to process claim. Please try again.");
        return false;
      }
    }
    
    // Insert into claim_history
    const { error: historyError } = await supabase
      .from('claim_history')
      .insert({
        wallet_address: walletAddress,
        token_name: tokenName,
        token_ids: eligibleNfts.map(nft => nft.name),
        amount: totalAmount,
        transaction_hash: transactionHash
      });
    
    if (historyError) {
      console.error("Error inserting history:", historyError);
      toast.error("Claim processed but history not updated. Please refresh.");
      return false;
    }
    
    toast.success(`Successfully claimed ${totalAmount} ${tokenName}!`);
    return true;
  } catch (error) {
    console.error("Error submitting claim:", error);
    toast.error("Failed to process claim. Please try again.");
    return false;
  }
};
