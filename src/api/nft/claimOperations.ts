
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { submitClaimTransaction } from "@/utils/aptos";
import { NFT } from "../types/nft.types";
import { NFT_COLLECTION_NAME } from "@/utils/aptos/constants";

// Fixed payout amount per NFT
const FIXED_PAYOUT_PER_NFT = 0.1;

/**
 * Calculates the claimable amount based on eligible NFTs
 * @param nfts The NFTs to calculate claims for
 */
export const calculateClaimableAmount = async (nfts: NFT[]): Promise<number> => {
  try {
    // Get the token type from the database (we still need this for the token type)
    const { data, error } = await supabase
      .from('token_payouts')
      .select('token_name')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching token type:", error);
    }
    
    // Count eligible NFTs and multiply by fixed payout
    const eligibleCount = nfts.filter(nft => nft.isEligible).length;
    return parseFloat((eligibleCount * FIXED_PAYOUT_PER_NFT).toFixed(2));
  } catch (error) {
    console.error("Error calculating claimable amount:", error);
    // Default to 0 if we encounter an error
    return 0;
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
    
    // Get token type from the database
    const { data: payoutData, error: payoutError } = await supabase
      .from('token_payouts')
      .select('token_name')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (payoutError) {
      console.error("Error fetching token info:", payoutError);
      toast.error("Could not retrieve token information");
      return false;
    }
    
    // If no token configuration exists, show error
    if (!payoutData) {
      toast.error("No token configuration found");
      return false;
    }
    
    const tokenName = payoutData?.token_name || "APT";
    const totalAmount = parseFloat((eligibleNfts.length * FIXED_PAYOUT_PER_NFT).toFixed(2));
    
    // Explain to user that we're simulating the claim transaction
    toast.info("Processing claim transaction...");
    
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
    
    // Get current date for the claim
    const currentDate = new Date();
    
    // Insert into nft_claims for each NFT (the unlock_date will be set automatically by the trigger)
    for (const nft of eligibleNfts) {
      const { error: claimError } = await supabase
        .from('nft_claims')
        .insert({
          wallet_address: walletAddress,
          token_id: nft.tokenId,
          amount: Number(FIXED_PAYOUT_PER_NFT.toFixed(2)), // Convert to number explicitly
          transaction_hash: transactionHash,
          claim_date: currentDate.toISOString()
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
        token_ids: eligibleNfts.map(nft => nft.tokenId),
        amount: totalAmount,
        transaction_hash: transactionHash,
        claim_date: currentDate.toISOString()
      });
    
    if (historyError) {
      console.error("Error inserting history:", historyError);
      toast.error("Claim processed but history not updated. Please refresh.");
      return false;
    }
    
    toast.success(`Successfully claimed ${totalAmount.toFixed(2)} ${tokenName}!`);
    return true;
  } catch (error) {
    console.error("Error submitting claim:", error);
    toast.error("Failed to process claim. Please try again.");
    return false;
  }
};
