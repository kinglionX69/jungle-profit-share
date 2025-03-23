
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/api/adminApi";
import { upsertUser } from "@/api/userApi";

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isAdmin: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      // Check if window.aptos is available (Petra wallet)
      if (window.aptos) {
        try {
          const { address } = await window.aptos.account();
          if (address) {
            setAddress(address);
            setConnected(true);
            
            // Insert user in database
            await upsertUser(address);
            
            // Check if the wallet is an admin
            const adminStatus = await checkIsAdmin(address);
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
  }, []);
  
  // When address changes, update Supabase headers
  useEffect(() => {
    if (address) {
      // Set the wallet address in Supabase headers for RLS policies
      supabase.realtime.setAuth(address);
      
      // Configure custom headers for RLS policies
      (supabase as any).headers = {
        'wallet-address': address
      };
    }
  }, [address]);
  
  const connect = async () => {
    setConnecting(true);
    
    try {
      // Check for different wallet providers
      if (window.aptos) {
        // Petra wallet
        const { address } = await window.aptos.connect();
        setAddress(address);
        setConnected(true);
        
        // Insert user in database
        await upsertUser(address);
        
        // Check if the wallet is an admin
        const adminStatus = await checkIsAdmin(address);
        setIsAdmin(adminStatus);
        
        toast.success("Wallet connected!");
      } else if (window.martian) {
        // Martian wallet
        const response = await window.martian.connect();
        setAddress(response.address);
        setConnected(true);
        
        // Insert user in database
        await upsertUser(response.address);
        
        // Check if the wallet is an admin
        const adminStatus = await checkIsAdmin(response.address);
        setIsAdmin(adminStatus);
        
        toast.success("Wallet connected!");
      } else {
        toast.error("No Aptos wallet found. Please install Petra, Martian, or another Aptos wallet");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };
  
  const disconnect = () => {
    if (window.aptos) {
      window.aptos.disconnect();
    } else if (window.martian) {
      window.martian.disconnect();
    }
    
    setAddress(null);
    setConnected(false);
    setIsAdmin(false);
    toast.info("Wallet disconnected");
  };
  
  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        address,
        connect,
        disconnect,
        isAdmin,
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
  }
}
