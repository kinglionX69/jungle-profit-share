import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { WalletName, WalletContextType } from "./types";
import { IS_TESTNET } from "@/utils/aptos/constants";
import { upsertUser } from "@/api/userApi";
import { checkIsAdmin } from "@/api/adminApi";
import { useWalletConnection } from "./useWalletConnection";
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk";
import { handleSuccessfulConnection } from "./walletUtils";

/**
 * Context for wallet state and operations
 */
const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Hook to access wallet context
 * @throws Error if used outside of WalletProvider
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Provider component for wallet context
 * Manages wallet connection state and provides wallet operations
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
}) => {
  // Get wallet connection state and setters
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
  
  // Network state
  const [network] = useState<string>(
    IS_TESTNET ? "Testnet" : "Mainnet"
  );
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  
  // Initialize Aptos client
  const [aptosClient] = useState(() => {
    const config = new AptosConfig({ 
      network: IS_TESTNET ? AptosNetwork.TESTNET : AptosNetwork.MAINNET
    });
    return new Aptos(config);
  });

  /**
   * Connects to a specific wallet
   * @param walletName - The name of the wallet to connect to
   */
  const connectWallet = async (walletName: WalletName) => {
    console.log(`Attempting to connect ${walletName} wallet...`);
    setConnecting(true);
    try {
      let account;
      
      if (window.petra) {
        console.log("Connecting with Petra wallet (new API)");
        account = await window.petra.connect();
      } else if (window.aptos) {
        console.log("Connecting with Petra wallet (legacy API)");
        account = await window.aptos.connect();
      } else {
        console.error("Petra wallet not detected in window object");
        throw new Error("Petra wallet not installed");
      }

      console.log("Wallet connection response:", account);
      
      if (account?.address) {
        setAddress(account.address);
        setConnected(true);
        setWalletType('petra');
        
        // Handle successful connection
        const { adminStatus } = await handleSuccessfulConnection(account.address, walletName);
        setIsAdmin(adminStatus);
        
        toast.success("Wallet connected successfully");
      } else {
        throw new Error("No address returned from wallet");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast.error(error.message || "Failed to connect wallet");
      setConnected(false);
      setAddress(null);
      setWalletType(null);
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Connects to Petra wallet
   */
  const connect = async (): Promise<void> => {
    await connectWallet('petra');
  };

  /**
   * Disconnects from the current wallet
   */
  const disconnectWallet = async () => {
    try {
      if (window.petra) {
        await window.petra.disconnect();
      } else if (window.aptos) {
        await window.aptos.disconnect();
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  };

  /**
   * Handles wallet disconnection and state cleanup
   */
  const disconnect = async () => {
    if (!connected) return;
    
    setDisconnecting(true);
    try {
      await disconnectWallet();
      setConnected(false);
      setAddress(null);
      setWalletType(null);
      setIsAdmin(false);
      toast.success("Wallet disconnected");
    } catch (error: any) {
      console.error("Error during disconnect:", error);
      toast.error(error.message || "Failed to disconnect wallet");
    } finally {
      setDisconnecting(false);
    }
  };

  /**
   * Signs and submits a transaction
   * @param payload - The transaction payload
   * @returns The signed transaction response
   */
  const signTransaction = async (payload: any) => {
    if (!connected || !address) {
      throw new Error("Wallet not connected");
    }
    
    try {
      if (window.petra) {
        return await window.petra.signAndSubmitTransaction(payload);
      } else if (window.aptos) {
        return await window.aptos.signAndSubmitTransaction(payload);
      } else {
        throw new Error("Petra wallet not installed");
      }
    } catch (error: any) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  // Context value
  const contextValue: WalletContextType = {
    // Connection state
    connected,
    address,
    network,
    walletType,
    connecting,
    disconnecting,
    isAdmin,
    
    // UI state
    showWalletSelector,
    setShowWalletSelector,
    
    // Wallet operations
    connect,
    disconnect,
    connectWallet,
    signTransaction,
    
    // Aptos client
    aptosClient,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
