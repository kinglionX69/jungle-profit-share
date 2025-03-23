
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getNFTsInWallet, submitClaimTransaction } from "@/utils/aptosUtils";

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
 * Fetches NFTs for a wallet from the blockchain and determines eligibility
 * @param walletAddress The wallet address to check NFTs for
 */
export const fetchNFTs = async (walletAddress: string): Promise<NFT[]> => {
  try {
    // Get NFTs from blockchain
    const blockchainNfts = await getNFTsInWallet(walletAddress);
    
    // If no NFTs found on blockchain, return empty array
    if (!blockchainNfts || blockchainNfts.length === 0) {
      return [];
    }
    
    // Convert blockchain NFTs to our application format
    const nfts: NFT[] = blockchainNfts.map(nft => ({
      tokenId: nft.tokenId,
      name: nft.name,
      imageUrl: nft.imageUrl || "https://picsum.photos/seed/lion1/300/300", // Fallback image
      isEligible: true, // Default to eligible, we'll check locks below
      isLocked: false
    }));
    
    // Fetch NFT claims from Supabase to determine what's locked
    const { data: nftClaimsData, error: nftClaimsError } = await supabase
      .from('nft_claims')
      .select('*')
      .eq('wallet_address', walletAddress);
    
    if (nftClaimsError) {
      console.error("Error fetching NFT claims:", nftClaimsError);
      throw nftClaimsError;
    }
    
    // If we have NFT claim data, update the NFTs to reflect locked status
    if (nftClaimsData && nftClaimsData.length > 0) {
      nftClaimsData.forEach(claim => {
        const nftIndex = nfts.findIndex(nft => nft.tokenId === claim.token_id);
        if (nftIndex !== -1) {
          nfts[nftIndex].isLocked = true;
          nfts[nftIndex].isEligible = false;
          nfts[nftIndex].unlockDate = new Date(claim.unlock_date);
        }
      });
    }
    
    return nfts;
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
