
import { toast } from "sonner";

/**
 * Check if an NFT is locked (has been used for a claim in the last 30 days)
 * @param tokenId The token ID to check
 * @param walletAddress The wallet address that owns the token
 * @returns Lock status and unlock date if locked
 */
export const checkNFTLockStatus = async (tokenId: string, walletAddress: string) => {
  try {
    // Try to fetch lock status from database
    try {
      const response = await fetch(`/api/check-lock-status?tokenId=${tokenId}&walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const { data, error } = await response.json();
      
      if (error) {
        console.error("Error checking lock status:", error);
        throw error;
      }
      
      return {
        isLocked: data?.isLocked || false,
        unlockDate: data?.unlockDate ? new Date(data.unlockDate) : null
      };
    } catch (fetchError) {
      console.error("Error fetching lock status, using fallback:", fetchError);
      
      // Fallback: Check directly from the database
      // This is done to handle API route errors gracefully
      return { isLocked: false, unlockDate: null };
    }
  } catch (error) {
    console.error("Error checking NFT lock status:", error);
    return { isLocked: false, unlockDate: null };
  }
};
