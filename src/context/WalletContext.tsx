import React, { createContext, useContext, useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { IS_TESTNET } from '@/utils/aptos/constants';
import { WalletContextType } from './wallet/types';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Aptos client
  const network = IS_TESTNET ? Network.TESTNET : Network.MAINNET;
  const config = new AptosConfig({ network });
  const aptosClient = new Aptos(config);

  const connect = async () => {
    try {
      setConnecting(true);
      
      if (!window.petra && !window.aptos) {
        throw new Error('Petra wallet not found. Please install Petra wallet.');
      }

      const wallet = window.petra || window.aptos;
      const { address } = await wallet.connect();
      
      setAddress(address);
      setConnected(true);
      setConnecting(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnecting(false);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      setDisconnecting(true);
      
      if (!window.petra && !window.aptos) {
        throw new Error('Petra wallet not found');
      }

      const wallet = window.petra || window.aptos;
      await wallet.disconnect();
      
      setAddress(null);
      setConnected(false);
      setDisconnecting(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setDisconnecting(false);
      throw error;
    }
  };

  const signTransaction = async (payload: any) => {
    if (!window.petra && !window.aptos) {
      throw new Error('Petra wallet not found');
    }

    const wallet = window.petra || window.aptos;
    return wallet.signTransaction(payload);
  };

  // Check admin status when address changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (address) {
        try {
          const response = await fetch(`/api/admin/check?address=${address}`);
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        network: IS_TESTNET ? 'Testnet' : 'Mainnet',
        walletType: 'petra',
        connecting,
        disconnecting,
        showWalletSelector: false,
        setShowWalletSelector: () => {},
        connect,
        disconnect,
        connectWallet: connect,
        signTransaction,
        isAdmin,
        aptosClient
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
