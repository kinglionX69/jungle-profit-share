
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet } from "./WalletContext";
import { toast } from "sonner";

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
    // In a real implementation, this would fetch from your backend
    // For this demo, we'll use mock data
    
    // Simulate loading
    setLoadingNfts(true);
    setLoadingClaimHistory(true);
    
    // Mock email and verification status
    // In production, get this from your backend
    setEmail(localStorage.getItem(`user_${address}_email`));
    setIsVerified(localStorage.getItem(`user_${address}_verified`) === 'true');
    
    try {
      // Fetch NFTs - in production, you'd call your backend
      // which would query the blockchain
      setTimeout(() => {
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
            unlockDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
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
            unlockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
          }
        ];
        
        setNfts(mockNfts);
        
        // Calculate claimable amount (2 APT per eligible NFT)
        const eligibleCount = mockNfts.filter(nft => nft.isEligible).length;
        setClaimableAmount(eligibleCount * 2); // 2 APT per NFT
        
        setLoadingNfts(false);
      }, 1500);
      
      // Fetch claim history - in production, get from your backend
      setTimeout(() => {
        const mockHistory: ClaimHistory[] = [
          {
            id: "claim1",
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            amount: 4,
            tokenName: "APT",
            nfts: ["Proud Lion #1", "Proud Lion #3"]
          },
          {
            id: "claim2",
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            amount: 6,
            tokenName: "APT",
            nfts: ["Proud Lion #1", "Proud Lion #2", "Proud Lion #4"]
          }
        ];
        
        setClaimHistory(mockHistory);
        setLoadingClaimHistory(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
      setLoadingNfts(false);
      setLoadingClaimHistory(false);
    }
  };
  
  const verifyEmail = async (otp: string): Promise<boolean> => {
    // In a real implementation, send OTP to your backend for verification
    // For this demo, we'll accept any 6-digit OTP
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      setIsVerified(true);
      
      // Store in localStorage for demo purposes
      if (address) {
        localStorage.setItem(`user_${address}_verified`, 'true');
      }
      
      toast.success("Email verified successfully!");
      return true;
    } else {
      toast.error("Invalid OTP code");
      return false;
    }
  };
  
  const claim = async () => {
    if (!isVerified) {
      toast.error("Please verify your email before claiming");
      return;
    }
    
    try {
      // In production, this would call your backend which would handle the token transfer
      // For this demo, we'll simulate success
      
      toast.loading("Processing your claim...");
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
        nfts: nfts.filter(nft => nft.isEligible).map(nft => nft.name)
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
