
import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { useWalletConnection } from "./useWalletConnection";
import { handleSuccessfulConnection, signTransaction, updateSupabaseHeaders } from "./walletUtils";
import { WalletContextType } from "./types";

// Create the context with undefined as default value
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

// Props for the WalletProvider component
interface WalletProviderProps {
  children: ReactNode;
}

// The WalletProvider component that will wrap our application
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const {
    connected,
    setConnected,
    connecting,
    setConnecting,
    address,
    setAddress,
    isAdmin,
    setIsAdmin,
    showWalletSelector,
    setShowWalletSelector,
    walletType,
    setWalletType
  } = useWalletConnection();
  
  // Connect to a specific wallet
  const connectWallet = async (walletName: string) => {
    setConnecting(true);
    
    try {
      if (walletName === 'petra' && window.aptos) {
        console.log("Connecting to Petra wallet...");
        try {
          const { address } = await window.aptos.connect();
          console.log("Petra wallet connected with address:", address);
          const { adminStatus } = await handleSuccessfulConnection(address, "Petra");
          setAddress(address);
          setConnected(true);
          setIsAdmin(adminStatus);
          setWalletType('petra');
          toast.success("Petra wallet connected!");
        } catch (error) {
          console.error("Petra wallet connection error:", error);
          toast.error("Failed to connect Petra wallet");
          throw error;
        }
      } else if (walletName === 'martian' && window.martian) {
        const response = await window.martian.connect();
        const { adminStatus } = await handleSuccessfulConnection(response.address, "Martian");
        setAddress(response.address);
        setConnected(true);
        setIsAdmin(adminStatus);
        setWalletType('martian');
      } else if (walletName === 'pontem' && window.pontem) {
        const address = await window.pontem.connect();
        const { adminStatus } = await handleSuccessfulConnection(address, "Pontem");
        setAddress(address);
        setConnected(true);
        setIsAdmin(adminStatus);
        setWalletType('pontem');
      } else if (walletName === 'rise' && window.rise) {
        const response = await window.rise.connect();
        const { adminStatus } = await handleSuccessfulConnection(response.address, "Rise");
        setAddress(response.address);
        setConnected(true);
        setIsAdmin(adminStatus);
        setWalletType('rise');
      } else {
        throw new Error(`${walletName} wallet not installed`);
      }
      
      // Hide the wallet selector after successful connection
      setShowWalletSelector(false);
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };
  
  // Main connect function to show wallet selector
  const connect = async () => {
    // Check if Petra wallet is installed first
    if (window.aptos) {
      // For this app, prioritize Petra wallet
      try {
        toast.loading("Connecting to Petra wallet...");
        await connectWallet('petra');
        toast.dismiss();
      } catch (error) {
        console.error("Petra auto-connect error:", error);
        toast.dismiss();
        // Show wallet selector if Petra auto-connect fails
        setShowWalletSelector(true);
      }
    } else {
      // No Petra wallet, show selector with other options
      setShowWalletSelector(true);
      toast.info("Petra wallet not detected. Please install it or choose another wallet.");
    }
  };
  
  const disconnect = () => {
    try {
      if (window.aptos) {
        window.aptos.disconnect();
      } else if (window.martian) {
        window.martian.disconnect();
      } else if (window.pontem) {
        window.pontem.disconnect();
      } else if (window.rise) {
        window.rise.disconnect();
      }
      
      setAddress(null);
      setConnected(false);
      setIsAdmin(false);
      setWalletType(null);
      
      // Clear Supabase headers
      updateSupabaseHeaders(null);
      
      toast.info("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };
  
  const handleSignTransaction = async (transaction: any): Promise<any> => {
    return signTransaction(transaction, address, connected);
  };
  
  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        address,
        connect,
        connectWallet,
        disconnect,
        isAdmin,
        signTransaction: handleSignTransaction,
        showWalletSelector,
        setShowWalletSelector,
        walletType
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
