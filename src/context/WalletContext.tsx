
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/api/adminApi";
import { upsertUser } from "@/api/userApi";

// Define the shape of our wallet context
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  connectWallet: (walletName: string) => Promise<void>;
  disconnect: () => void;
  isAdmin: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
}

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
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      // Check for Petra wallet
      if (window.aptos) {
        try {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const { address } = await window.aptos.account();
            if (address) {
              console.log("Found connected Petra wallet:", address);
              await handleSuccessfulConnection(address, "Petra");
            }
          }
        } catch (error) {
          console.error("Error checking Petra connection:", error);
        }
      } 
      // Check for Martian wallet
      else if (window.martian) {
        try {
          const isConnected = await window.martian.isConnected();
          if (isConnected) {
            const { address } = await window.martian.getAccount();
            if (address) {
              console.log("Found connected Martian wallet:", address);
              await handleSuccessfulConnection(address, "Martian");
            }
          }
        } catch (error) {
          console.error("Error checking Martian connection:", error);
        }
      }
      // Add checks for other wallets as needed
    };
    
    checkConnection();
  }, []);
  
  // When address changes, update Supabase headers
  useEffect(() => {
    if (address) {
      // Set the wallet address in Supabase headers for RLS policies
      supabase.realtime.setAuth(address);
    }
  }, [address]);
  
  // Handler for successful wallet connections
  const handleSuccessfulConnection = async (walletAddress: string, walletName: string) => {
    setAddress(walletAddress);
    setConnected(true);
    
    // Insert user in database
    await upsertUser(walletAddress);
    
    // Check if the wallet is an admin
    const adminStatus = await checkIsAdmin(walletAddress);
    setIsAdmin(adminStatus);
    
    toast.success(`${walletName} wallet connected!`);
  };
  
  // Connect to a specific wallet
  const connectWallet = async (walletName: string) => {
    setConnecting(true);
    
    try {
      if (walletName === 'petra' && window.aptos) {
        const { address } = await window.aptos.connect();
        await handleSuccessfulConnection(address, "Petra");
      } else if (walletName === 'martian' && window.martian) {
        const response = await window.martian.connect();
        await handleSuccessfulConnection(response.address, "Martian");
      } else if (walletName === 'pontem' && window.pontem) {
        const address = await window.pontem.connect();
        await handleSuccessfulConnection(address, "Pontem");
      } else if (walletName === 'rise' && window.rise) {
        const response = await window.rise.connect();
        await handleSuccessfulConnection(response.address, "Rise");
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
    setShowWalletSelector(true);
  };
  
  const disconnect = () => {
    if (window.aptos) {
      window.aptos.disconnect();
    } else if (window.martian) {
      window.martian.disconnect();
    }
    // Add disconnect for other wallets as needed
    
    setAddress(null);
    setConnected(false);
    setIsAdmin(false);
    toast.info("Wallet disconnected");
  };
  
  const signTransaction = async (transaction: any): Promise<any> => {
    if (!connected || !address) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    
    try {
      if (window.aptos) {
        return await window.aptos.signAndSubmitTransaction(transaction);
      } else if (window.martian) {
        return await window.martian.signAndSubmitTransaction(transaction);
      } else {
        throw new Error("No wallet provider available");
      }
    } catch (error: any) {
      console.error("Transaction signing error:", error);
      toast.error(error.message || "Failed to sign transaction");
      throw error;
    }
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
        signTransaction,
        showWalletSelector,
        setShowWalletSelector
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Add TypeScript definitions for the wallet providers
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>;
      disconnect: () => Promise<void>;
      account: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
    martian?: {
      connect: () => Promise<{ address: string }>;
      disconnect: () => Promise<void>;
      getAccount: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
    pontem?: {
      connect: () => Promise<string>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
    rise?: {
      connect: () => Promise<{ address: string }>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
  }
}
