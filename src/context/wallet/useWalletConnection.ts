
import { useState, useEffect } from 'react';
import { handleSuccessfulConnection, updateSupabaseHeaders } from './walletUtils';
import { checkIsAdmin } from '@/api/adminApi';
import { WalletName } from './types';

export const useWalletConnection = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [walletType, setWalletType] = useState<WalletName | null>(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // Check if wallet is already connected
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
        // Check for Martian wallet
        else if (window.martian) {
          try {
            const isConnected = await window.martian.isConnected();
            if (isConnected) {
              const { address } = await window.martian.getAccount();
              if (address) {
                console.log("Found connected Martian wallet:", address);
                setAddress(address);
                setConnected(true);
                setWalletType('martian');
                
                // Check admin status
                const adminStatus = await checkIsAdmin(address);
                setIsAdmin(adminStatus);
              }
            }
          } catch (error) {
            console.error("Error checking Martian connection:", error);
          }
        }
        // Check for Pontem wallet
        else if (window.pontem) {
          try {
            const isConnected = await window.pontem.isConnected();
            if (isConnected) {
              const address = await window.pontem.connect();
              if (address) {
                console.log("Found connected Pontem wallet:", address);
                setAddress(address);
                setConnected(true);
                setWalletType('pontem');
                
                // Check admin status
                const adminStatus = await checkIsAdmin(address);
                setIsAdmin(adminStatus);
              }
            }
          } catch (error) {
            console.error("Error checking Pontem connection:", error);
          }
        }
        // Check for Rise wallet
        else if (window.rise) {
          try {
            const isConnected = await window.rise.isConnected();
            if (isConnected) {
              const response = await window.rise.getAccount();
              if (response && response.address) {
                console.log("Found connected Rise wallet:", response.address);
                setAddress(response.address);
                setConnected(true);
                setWalletType('rise');
                
                // Check admin status
                const adminStatus = await checkIsAdmin(response.address);
                setIsAdmin(adminStatus);
              }
            }
          } catch (error) {
            console.error("Error checking Rise connection:", error);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connections:", error);
      }
    };
    
    checkConnection();
  }, [connected, connecting, connectionAttempted]);
  
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
    setShowWalletSelector,
    walletType,
    setWalletType
  };
};
