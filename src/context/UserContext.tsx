
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet } from "./WalletContext";
import { toast } from "sonner";
import { 
  updateUserEmail,
  getUserData,
  upsertUser
} from "@/api/userApi";
import {
  NFT,
  ClaimHistory,
  fetchNFTs,
  fetchClaimHistory,
  calculateClaimableAmount,
  submitClaim
} from "@/api/nftApi";
import { getUserNfts } from "@/api/nft/fetchNFTs";

interface UserContextType {
  email: string | null;
  isVerified: boolean;
  nfts: NFT[];
  claimHistory: ClaimHistory[];
  claimableAmount: number;
  setEmail: (email: string) => void;
  setIsVerified: (verified: boolean) => void;
  loadingNfts: boolean;
  loadingClaimHistory: boolean;
  claim: () => Promise<void>;
  fetchUserData: () => Promise<void>;
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
  const { connected, address, walletType, signTransaction } = useWallet();
  
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
      console.log(`Wallet connected (${walletType}), fetching user data...`);
      // Ensure the user record exists first
      upsertUser(address).then(() => {
        fetchUserData();
      });
    } else {
      // Reset user data when disconnected
      setEmail(null);
      setIsVerified(false);
      setNfts([]);
      setClaimHistory([]);
    }
  }, [connected, address, walletType]);
  
  const fetchUserData = async () => {
    if (!address) {
      console.error("Cannot fetch user data: No wallet address available");
      return;
    }
    
    try {
      // Fetch user data
      const userData = await getUserData(address);
      
      if (userData) {
        console.log("Setting user data from fetch:", userData);
        setEmail(userData.email);
        setIsVerified(userData.email_verified);
      } else {
        console.log("No user data found, creating initial record");
        await upsertUser(address);
      }
      
      // Fetch NFTs and claim history
      setLoadingNfts(true);
      setLoadingClaimHistory(true);
      
      // Fetch NFTs and calculate claimable amount
      console.log("Fetching NFTs for address:", address);
      
      // Set a timeout to show loading state for at least 1 second
      setTimeout(async () => {
        try {
          const userNfts = await getUserNfts(address);
          setNfts(userNfts);
          
          const claimable = await calculateClaimableAmount(userNfts);
          setClaimableAmount(claimable);
          
          console.log(`Fetched ${userNfts.length} NFTs with ${claimable} claimable amount`);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
          toast.error("Failed to fetch NFTs");
        } finally {
          setLoadingNfts(false);
        }
      }, 1000);
      
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
  
  const claim = async () => {
    if (!address) return;
    
    if (!isVerified) {
      toast.error("Please add your email before claiming");
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
        setIsVerified,
        loadingNfts,
        loadingClaimHistory,
        claim,
        fetchUserData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
