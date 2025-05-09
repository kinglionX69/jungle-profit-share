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
  
  // Debug logging for UserContext initialization
  console.log("UserContext initializing with wallet state:", { connected, address, walletType });
  
  // Load user data when wallet connects
  useEffect(() => {
    console.log("UserContext useEffect triggered - wallet connection state:", { connected, address });
    
    if (connected && address) {
      console.log(`Wallet connected (${walletType}), fetching user data...`);
      // Ensure the user record exists first
      upsertUser(address)
        .then(() => {
          console.log("User record created/updated successfully");
          return fetchUserData();
        })
        .catch(error => {
          console.error("Error creating user record:", error);
          toast.error("Failed to initialize user data");
        });
    } else {
      // Reset user data when disconnected
      console.log("Wallet not connected, resetting user data");
      setEmail(null);
      setIsVerified(false);
      setNfts([]);
      setClaimHistory([]);
      setClaimableAmount(0);
    }
  }, [connected, address, walletType]);
  
  const fetchUserData = async () => {
    console.log("Fetching user data for address:", address);
    
    if (!address) {
      console.error("Cannot fetch user data: No wallet address available");
      return;
    }
    
    try {
      // Fetch user data
      console.log("Fetching user profile data");
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
          console.log("Starting NFT fetch");
          const userNfts = await getUserNfts(address);
          console.log(`Fetched ${userNfts.length} NFTs`);
          setNfts(userNfts);
          
          console.log("Calculating claimable amount");
          const claimable = await calculateClaimableAmount(userNfts);
          // Ensure claimable amount is fixed to 2 decimal places
          setClaimableAmount(parseFloat(claimable.toFixed(2)));
          
          console.log(`Fetched ${userNfts.length} NFTs with ${claimable.toFixed(2)} claimable amount`);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
          toast.error("Failed to fetch NFTs");
        } finally {
          setLoadingNfts(false);
          console.log("NFT loading complete");
        }
      }, 1000);
      
      // Fetch claim history
      try {
        console.log("Fetching claim history");
        const history = await fetchClaimHistory(address);
        console.log(`Fetched ${history.length} claim history records`);
        setClaimHistory(history);
      } catch (error) {
        console.error("Error fetching claim history:", error);
      } finally {
        setLoadingClaimHistory(false);
      }
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
      try {
        const success = await submitClaim(address, eligibleNfts, signTransaction);
        
        if (success) {
          // Refresh data
          await fetchUserData();
          toast.success("Claim processed successfully!");
        } else {
          toast.error("Failed to process claim");
        }
      } catch (error) {
        console.error("Error during claim processing:", error);
        let errorMessage = "Failed to process claim. Please try again.";
        
        // Provide more helpful error messages based on error type
        if (error instanceof Error) {
          if (error.message.includes("API returned non-JSON")) {
            errorMessage = "Server error: Please contact support.";
          } else if (error.message.includes("user rejected")) {
            errorMessage = "Transaction was rejected in your wallet.";
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
      }
      
      toast.dismiss();
    } catch (error) {
      console.error("Claim error:", error);
      toast.dismiss();
      toast.error("Failed to process claim. Please try again.");
    }
  };
  
  // Debug the context values before providing them
  console.log("UserContext providing values:", {
    hasEmail: !!email,
    isVerified,
    nftCount: nfts.length,
    claimHistoryCount: claimHistory.length,
    claimableAmount,
    loadingNfts,
    loadingClaimHistory
  });
  
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
