
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet } from "./WalletContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NFT {
  tokenId: string;
  name: string;
  imageUrl: string;
  isEligible: boolean;
  isLocked: boolean;
  unlockDate?: Date;
}

interface ClaimHistory {
  id: string;
  date: Date;
  amount: number;
  tokenName: string;
  nfts: string[];
}

interface UserContextType {
  email: string | null;
  isVerified: boolean;
  nfts: NFT[];
  claimHistory: ClaimHistory[];
  claimableAmount: number;
  setEmail: (email: string) => void;
  verifyEmail: (otp: string) => Promise<boolean>;
  loadingNfts: boolean;
  loadingClaimHistory: boolean;
  claim: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { connected, address } = useWallet();
  
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [loadingClaimHistory, setLoadingClaimHistory] = useState(false);
  const [claimableAmount, setClaimableAmount] = useState(0);
  
  // Load user data when wallet connects
  useEffect(() => {
    if (connected && address) {
      fetchUserData();
    } else {
      // Reset user data when disconnected
      setEmail(null);
      setIsVerified(false);
      setNfts([]);
      setClaimHistory([]);
    }
  }, [connected, address]);
  
  const fetchUserData = async () => {
    if (!address) return;
    
    setLoadingNfts(true);
    setLoadingClaimHistory(true);
    
    try {
      // Fetch user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error("Error fetching user data:", userError);
      }
      
      if (userData) {
        setEmail(userData.email);
        setIsVerified(userData.email_verified);
      }
      
      // Fetch NFT claim data to determine what's locked
      const { data: nftClaimsData, error: nftClaimsError } = await supabase
        .from('nft_claims')
        .select('*')
        .eq('wallet_address', address);
      
      if (nftClaimsError) {
        console.error("Error fetching NFT claims:", nftClaimsError);
      }
      
      // For demo purposes, we'll still use mock NFTs
      // but now we'll mark them as locked based on the database
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
          isEligible: false,
          isLocked: true,
          unlockDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
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
          isEligible: false,
          isLocked: true,
          unlockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      ];
      
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
      
      setNfts(mockNfts);
      
      // Calculate claimable amount (2 APT per eligible NFT)
      const eligibleCount = mockNfts.filter(nft => nft.isEligible).length;
      setClaimableAmount(eligibleCount * 2); // 2 APT per NFT
      
      setLoadingNfts(false);
      
      // Fetch claim history from Supabase
      const { data: historyData, error: historyError } = await supabase
        .from('claim_history')
        .select('*')
        .eq('wallet_address', address)
        .order('claim_date', { ascending: false });
      
      if (historyError) {
        console.error("Error fetching claim history:", historyError);
      }
      
      if (historyData) {
        const formattedHistory: ClaimHistory[] = historyData.map(item => ({
          id: item.id,
          date: new Date(item.claim_date),
          amount: Number(item.amount),
          tokenName: item.token_name,
          nfts: item.token_ids
        }));
        
        setClaimHistory(formattedHistory);
      }
      
      setLoadingClaimHistory(false);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
      setLoadingNfts(false);
      setLoadingClaimHistory(false);
    }
  };
  
  const verifyEmail = async (otp: string): Promise<boolean> => {
    if (!address) return false;
    
    // In a real implementation, send OTP to your backend for verification
    // For this demo, we'll accept any 6-digit OTP
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      try {
        // Update user in Supabase
        const { error } = await supabase
          .from('users')
          .upsert({ 
            wallet_address: address,
            email: email,
            email_verified: true,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error("Error updating user:", error);
          toast.error("Failed to verify email");
          return false;
        }
        
        setIsVerified(true);
        toast.success("Email verified successfully!");
        return true;
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Failed to verify email");
        return false;
      }
    } else {
      toast.error("Invalid OTP code");
      return false;
    }
  };
  
  const claim = async () => {
    if (!address) return;
    
    if (!isVerified) {
      toast.error("Please verify your email before claiming");
      return;
    }
    
    try {
      // Get eligible NFTs
      const eligibleNfts = nfts.filter(nft => nft.isEligible);
      const eligibleTokenIds = eligibleNfts.map(nft => nft.tokenId);
      
      if (eligibleTokenIds.length === 0) {
        toast.error("No eligible NFTs to claim");
        return;
      }
      
      toast.loading("Processing your claim...");
      
      // In a real application, this would call your backend which would handle the token transfer
      // For this demo, we'll simulate success and update Supabase
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Insert into nft_claims
      for (const tokenId of eligibleTokenIds) {
        const { error: claimError } = await supabase
          .from('nft_claims')
          .insert({
            wallet_address: address,
            token_id: tokenId,
            amount: 2, // 2 APT per NFT
            transaction_hash: `0x${Math.random().toString(16).substring(2, 62)}`
          });
        
        if (claimError) {
          console.error("Error inserting claim:", claimError);
          toast.dismiss();
          toast.error("Failed to process claim. Please try again.");
          return;
        }
      }
      
      // Insert into claim_history
      const { error: historyError } = await supabase
        .from('claim_history')
        .insert({
          wallet_address: address,
          token_name: "APT",
          token_ids: eligibleNfts.map(nft => nft.name),
          amount: eligibleTokenIds.length * 2, // 2 APT per NFT
          transaction_hash: `0x${Math.random().toString(16).substring(2, 62)}`
        });
      
      if (historyError) {
        console.error("Error inserting history:", historyError);
        toast.dismiss();
        toast.error("Claim processed but history not updated. Please refresh.");
        return;
      }
      
      // Update NFTs to mark claimed ones as locked
      const updatedNfts = nfts.map(nft => {
        if (nft.isEligible) {
          return {
            ...nft,
            isEligible: false,
            isLocked: true,
            unlockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          };
        }
        return nft;
      });
      
      // Add to claim history
      const newClaim: ClaimHistory = {
        id: `claim${Date.now()}`,
        date: new Date(),
        amount: claimableAmount,
        tokenName: "APT",
        nfts: eligibleNfts.map(nft => nft.name)
      };
      
      setNfts(updatedNfts);
      setClaimHistory([newClaim, ...claimHistory]);
      setClaimableAmount(0);
      
      toast.dismiss();
      toast.success(`Successfully claimed ${newClaim.amount} APT!`);
    } catch (error) {
      console.error("Claim error:", error);
      toast.dismiss();
      toast.error("Failed to process claim. Please try again.");
    }
  };
  
  return (
    <UserContext.Provider
      value={{
        email,
        isVerified,
        nfts,
        claimHistory,
        claimableAmount,
        setEmail,
        verifyEmail,
        loadingNfts,
        loadingClaimHistory,
        claim
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
