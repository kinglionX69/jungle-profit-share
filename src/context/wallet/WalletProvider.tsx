
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { Network, WalletName, WalletContextType } from "./types";
import { IS_TESTNET } from "@/utils/aptos/constants";
import { upsertUser } from "@/api/userApi";
import { checkIsAdmin } from "@/api/adminApi";
import { useWalletConnection } from "./useWalletConnection";
import { Aptos, AptosConfig, Network as AptosNetwork, TransactionOptions } from "@aptos-labs/ts-sdk";

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
}) => {
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
  
  const [network] = useState<Network>(
    IS_TESTNET ? "Testnet" : "Mainnet"
  );
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  
  // Create Aptos client instance for the appropriate network
  const [aptosClient] = useState(() => {
    const config = new AptosConfig({ 
      network: IS_TESTNET ? AptosNetwork.TESTNET : AptosNetwork.MAINNET
    });
    return new Aptos(config);
  });

  const connectWallet = async (walletName: WalletName) => {
    setConnecting(true);
    try {
      let account;
      
      switch (walletName) {
        case "petra":
          if (window.petra) {
            account = await window.petra.connect();
          } else if (window.aptos) {
            account = await window.aptos.connect();
          } else {
            throw new Error("Petra wallet not installed");
          }
          break;
        case "martian":
          if (!window.martian) throw new Error("Martian wallet not installed");
          account = await window.martian.connect();
          break;
        case "pontem":
          if (!window.pontem) throw new Error("Pontem wallet not installed");
          const address = await window.pontem.connect();
          account = { address };
          break;
        case "rise":
          if (!window.rise) throw new Error("Rise wallet not installed");
          account = await window.rise.connect();
          break;
        default:
          throw new Error(`Wallet "${walletName}" is not supported or not installed`);
      }

      if (account?.address) {
        setAddress(account.address);
        setConnected(true);
        setWalletType(walletName);
        sessionStorage.setItem("connected", "true");
        sessionStorage.setItem("address", account.address);
        sessionStorage.setItem("walletType", walletName);
        toast.success(`${walletName} Wallet connected!`);
        
        console.log("Creating user record for newly connected wallet");
        await upsertUser(account.address);
        
        // Check admin status and log the result
        console.log("Checking if wallet is admin:", account.address);
        const adminStatus = await checkIsAdmin(account.address);
        console.log("Admin status result:", adminStatus);
        setIsAdmin(adminStatus);
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast.error(`Failed to connect wallet: ${error.message}`);
      await disconnectWallet();
    } finally {
      setConnecting(false);
      setShowWalletSelector(false);
    }
  };

  // Fix: Update connect function to return a Promise<void> to match the type definition
  const connect = async (): Promise<void> => {
    setShowWalletSelector(true);
    // Return a resolved promise to match the Promise<void> return type
    return Promise.resolve();
  };

  const disconnectWallet = async () => {
    setDisconnecting(true);
    try {
      setConnected(false);
      setAddress(null);
      setWalletType(null);
      setIsAdmin(false);
      sessionStorage.removeItem("connected");
      sessionStorage.removeItem("address");
      sessionStorage.removeItem("walletType");
      toast.success("Wallet disconnected!");
    } catch (error: any) {
      console.error("Failed to disconnect wallet:", error);
      toast.error(`Failed to disconnect wallet: ${error.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
  };

  const signTransaction = useCallback(
    async (payload: any) => {
      if (!walletType) {
        throw new Error("No wallet connected");
      }

      try {
        let response;
        switch (walletType) {
          case "petra":
            if (window.petra) {
              response = await window.petra.signAndSubmitTransaction(payload);
            } else if (window.aptos) {
              response = await window.aptos.signAndSubmitTransaction(payload);
            } else {
              throw new Error("Petra wallet not installed");
            }
            break;
          case "martian":
            if (!window.martian) throw new Error("Martian wallet not installed");
            response = await window.martian.signAndSubmitTransaction(payload);
            break;
          case "pontem":
            if (!window.pontem) throw new Error("Pontem wallet not installed");
            response = await window.pontem.signAndSubmitTransaction(payload);
            break;
          case "rise":
            if (!window.rise) throw new Error("Rise wallet not installed");
            response = await window.rise.signAndSubmitTransaction(payload);
            break;
          default:
            throw new Error(`Wallet "${walletType}" is not supported or not installed`);
        }
        return response;
      } catch (error: any) {
        console.error("Failed to sign transaction:", error);
        toast.error(`Failed to sign transaction: ${error.message}`);
        throw error;
      }
    },
    [walletType]
  );

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        network,
        walletType,
        connecting,
        disconnecting,
        showWalletSelector,
        setShowWalletSelector,
        connect,
        disconnect,
        connectWallet,
        signTransaction,
        isAdmin,
        aptosClient
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
