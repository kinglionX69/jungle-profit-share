import React, { createContext, useContext, useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { IS_TESTNET } from '@/utils/aptos/constants';
import { WalletContextType, WalletName } from './wallet/types';
import { handleSuccessfulConnection } from './wallet/walletUtils';
import { toast } from 'sonner';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletType, setWalletType] = useState<WalletName | null>('petra');
  const [isWalletReady, setIsWalletReady] = useState(false);

  // Initialize Aptos client
  const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
  const config = new AptosConfig({ network });
  const aptosClient = new Aptos(config);

  // Check for Petra wallet availability
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined') {
        if (window.petra) {
          setIsWalletReady(true);
        } else {
          const checkInterval = setInterval(() => {
            if (window.petra) {
              setIsWalletReady(true);
              clearInterval(checkInterval);
            }
          }, 200);

          // Clear interval after 5 seconds if wallet is not found
          setTimeout(() => clearInterval(checkInterval), 5000);
        }
      }
    };

    checkWallet();
  }, []);

  // Check initial connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (isWalletReady && window.petra) {
        try {
          const isConnected = await window.petra.isConnected();
          if (isConnected) {
            const { address } = await window.petra.account();
            const { adminStatus } = await handleSuccessfulConnection(address, 'petra');
            setAddress(address);
            setConnected(true);
            setWalletType('petra');
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();
  }, [isWalletReady]);

  const connect = async () => {
    try {
      setConnecting(true);
      
      if (!isWalletReady || !window.petra) {
        throw new Error('Petra wallet not found. Please install Petra wallet.');
      }

      const { address } = await window.petra.connect();
      
      // Handle successful connection
      const { adminStatus } = await handleSuccessfulConnection(address, 'petra');
      setIsAdmin(adminStatus);
      
      setAddress(address);
      setConnected(true);
      setWalletType('petra');
      setConnecting(false);
      toast.success('Wallet connected successfully');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setConnecting(false);
      toast.error(error.message || 'Failed to connect wallet');
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      setDisconnecting(true);
      
      if (!isWalletReady || !window.petra) {
        throw new Error('Petra wallet not found');
      }

      await window.petra.disconnect();
      
      setAddress(null);
      setConnected(false);
      setWalletType(null);
      setIsAdmin(false);
      setDisconnecting(false);
      toast.success('Wallet disconnected');
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      setDisconnecting(false);
      toast.error(error.message || 'Failed to disconnect wallet');
      throw error;
    }
  };

  const signTransaction = async (payload: any) => {
    if (!isWalletReady || !window.petra) {
      throw new Error('Petra wallet not found');
    }

    return window.petra.signAndSubmitTransaction(payload);
  };

  const connectWallet = async (walletName: WalletName) => {
    if (walletName !== 'petra') {
      throw new Error('Only Petra wallet is supported');
    }
    await connect();
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        network: IS_TESTNET ? 'Testnet' : 'Mainnet',
        walletType: walletType || 'petra',
        connecting,
        disconnecting,
        isAdmin,
        connect,
        disconnect,
        connectWallet,
        signTransaction,
        aptosClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
