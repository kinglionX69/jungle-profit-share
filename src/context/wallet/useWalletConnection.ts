import { useState, useEffect } from 'react';
import { handleSuccessfulConnection, updateSupabaseHeaders } from './walletUtils';
import { checkIsAdmin } from '@/api/adminApi';
import { WalletName } from './types';

/**
 * Custom hook for managing wallet connection state and operations.
 * Handles connection status, address, admin status, and wallet type.
 */
export const useWalletConnection = () => {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletType, setWalletType] = useState<WalletName | null>(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // UI state
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  /**
   * Checks if a wallet is already connected on component mount.
   * Supports both new and legacy Petra wallet APIs.
   */
  useEffect(() => {
    const checkConnection = async () => {
      // If we already tried to connect or are already connected, don't try again
      if (connectionAttempted || connected || connecting) return;
      
      setConnectionAttempted(true);
      
      try {
        // Check for Petra wallet (new API)
        if (window.petra) {
          try {
            const isConnected = await window.petra.isConnected();
            if (isConnected) {
              const account = await window.petra.account();
              if (account && account.address) {
                console.log("Found connected Petra wallet (new API):", account.address);
                setAddress(account.address);
                setConnected(true);
                setWalletType('petra');
                
                // Check admin status
                const adminStatus = await checkIsAdmin(account.address);
                setIsAdmin(adminStatus);
              }
            }
          } catch (error) {
            console.error("Error checking Petra connection (new API):", error);
          }
        }
        // Check for Petra wallet (legacy API)
        else if (window.aptos) {
          try {
            const isConnected = await window.aptos.isConnected();
            if (isConnected) {
              const { address } = await window.aptos.account();
              if (address) {
                console.log("Found connected Petra wallet (legacy API):", address);
                setAddress(address);
                setConnected(true);
                setWalletType('petra');
                
                // Check admin status
                const adminStatus = await checkIsAdmin(address);
                setIsAdmin(adminStatus);
              }
            }
          } catch (error) {
            console.error("Error checking Petra connection (legacy API):", error);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    
    checkConnection();
  }, [connectionAttempted, connected, connecting]);
  
  /**
   * Updates Supabase headers when the wallet address changes
   */
  useEffect(() => {
    updateSupabaseHeaders(address);
  }, [address]);
  
  return {
    // Connection state
    connected,
    setConnected,
    connecting,
    setConnecting,
    address,
    setAddress,
    isAdmin,
    setIsAdmin,
    walletType,
    setWalletType,
    
    // UI state
    showWalletSelector,
    setShowWalletSelector
  };
};
