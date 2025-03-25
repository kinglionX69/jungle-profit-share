
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { submitClaimTransaction } from "@/utils/aptosUtils";
import { NFT } from "../types/nft.types";

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
 * @param signTransaction Function to sign and submit blockchain transactions
 */
export const submitClaim = async (
  walletAddress: string,
  eligibleNfts: NFT[],
  signTransaction: (txn: any) => Promise<any>
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
    
    // Submit transaction to blockchain
    const { success, transactionHash } = await submitClaimTransaction(
      walletAddress, 
      eligibleNfts.map(nft => nft.tokenId),
      signTransaction
    );
    
    if (!success || !transactionHash) {
      toast.error("Blockchain transaction failed");
      return false;
    }
    
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
