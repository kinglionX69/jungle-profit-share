
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet } from "./WalletContext";
import { toast } from "sonner";
import { 
  verifyEmail as verifyEmailApi, 
  getUserData 
} from "@/api/userApi";
import {
  NFT,
  ClaimHistory,
  fetchNFTs,
  fetchClaimHistory,
  calculateClaimableAmount,
  submitClaim
} from "@/api/nftApi";

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
  // Get wallet information from WalletContext
  const { connected, address, signTransaction } = useWallet();
  
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
      // Fetch user data
      const userData = await getUserData(address);
      
      if (userData) {
        setEmail(userData.email);
        setIsVerified(userData.email_verified);
      }
      
      // Fetch NFTs and calculate claimable amount
      const userNfts = await fetchNFTs(address);
      setNfts(userNfts);
      
      const claimable = await calculateClaimableAmount(userNfts);
      setClaimableAmount(claimable);
      
      setLoadingNfts(false);
      
      // Fetch claim history
      const history = await fetchClaimHistory(address);
      setClaimHistory(history);
      
      setLoadingClaimHistory(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
      setLoadingNfts(false);
      setLoadingClaimHistory(false);
    }
  };
  
  const handleVerifyEmail = async (otp: string): Promise<boolean> => {
    if (!address || !email) return false;
    
    const success = await verifyEmailApi(address, email, otp);
    if (success) {
      setIsVerified(true);
    }
    
    return success;
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
      
      if (eligibleNfts.length === 0) {
        toast.error("No eligible NFTs to claim");
        return;
      }
      
      toast.loading("Processing your claim...");
      
      // Submit the claim using the wallet's sign transaction function
      const success = await submitClaim(address, eligibleNfts, signTransaction);
      
      if (success) {
        // Refresh data
        await fetchUserData();
        toast.success("Claim processed successfully!");
      } else {
        toast.error("Failed to process claim");
      }
      
      toast.dismiss();
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
        verifyEmail: handleVerifyEmail,
        loadingNfts,
        loadingClaimHistory,
        claim
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
