
import { useEffect, useState } from 'react';
import { handleSuccessfulConnection, updateSupabaseHeaders } from './walletUtils';

export const useWalletConnection = () => {
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
              const { adminStatus } = await handleSuccessfulConnection(address, "Petra");
              setAddress(address);
              setConnected(true);
              setIsAdmin(adminStatus);
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
              const { adminStatus } = await handleSuccessfulConnection(address, "Martian");
              setAddress(address);
              setConnected(true);
              setIsAdmin(adminStatus);
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
    updateSupabaseHeaders(address);
  }, [address]);
  
  return {
    connected,
    setConnected,
    connecting,
    setConnecting,
    address,
    setAddress,
    isAdmin,
    setIsAdmin,
    showWalletSelector,
    setShowWalletSelector
  };
};
