import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { AptosClient } from "aptos";
import { PetraWallet } from "./wallets/petra";
import { MartianWallet } from "./wallets/martian";
import { FewchaWallet } from "./wallets/fewcha";
import { PontemWallet } from "./wallets/pontem";
import { TokenPocketWallet } from "./wallets/token-pocket";
import { RiseWallet } from "./wallets/rise";
import { স্পেসগেটWallet } from "./wallets/spacegate";
import { HyperPayWallet } from "./wallets/hyperpay";
import { OKXWallet } from "./wallets/okx";
import { BitKeepWallet } from "./wallets/bitkeep";
import { Coin98Wallet } from "./wallets/coin98";
import { NightlyWallet } from "./wallets/nightly";
import { BloctoWallet } from "./wallets/blocto";
import { OneKeyWallet } from "./wallets/onekey";
import { TrustWallet } from "./wallets/trust";
import { SafeWallet } from "./wallets/safe";
import { toast } from "sonner";
import { Network, WalletName } from "./types";
import { APTOS_NODE_URL, IS_TESTNET } from "@/utils/aptos/constants";
import { upsertUser } from "@/api/userApi";

interface WalletContextType {
  connected: boolean;
  address: string | null;
  network: Network;
  walletType: WalletName | null;
  connecting: boolean;
  disconnecting: boolean;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  connect: () => void;
  disconnect: () => void;
  connectWallet: (walletName: WalletName) => Promise<void>;
  signTransaction: (
    payload: any
  ) => Promise<any>;
}

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
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>(
    IS_TESTNET ? "Testnet" : "Mainnet"
  );
  const [walletType, setWalletType] = useState<WalletName | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);

  const client = new AptosClient(APTOS_NODE_URL);

  useEffect(() => {
    const checkConnected = async () => {
      if (
        sessionStorage.getItem("connected") === "true" &&
        sessionStorage.getItem("address") &&
        sessionStorage.getItem("walletType")
      ) {
        setConnected(true);
        setAddress(sessionStorage.getItem("address"));
        setWalletType(sessionStorage.getItem("walletType") as WalletName);
      } else {
        await disconnectWallet();
      }
    };

    checkConnected();
  }, []);

  const connectWallet = async (walletName: WalletName) => {
    setConnecting(true);
    try {
      let account;
      switch (walletName) {
        case "petra":
          account = await PetraWallet.connect();
          break;
        case "martian":
          account = await MartianWallet.connect();
          break;
        case "fewcha":
          account = await FewchaWallet.connect();
          break;
        case "pontem":
          account = await PontemWallet.connect();
          break;
        case "token-pocket":
          account = await TokenPocketWallet.connect();
          break;
        case "rise":
          account = await RiseWallet.connect();
          break;
        case "spacegate":
          account = await স্পেসগেটWallet.connect();
          break;
        case "hyperpay":
          account = await HyperPayWallet.connect();
          break;
        case "okx":
          account = await OKXWallet.connect();
          break;
        case "bitkeep":
          account = await BitKeepWallet.connect();
          break;
        case "coin98":
          account = await Coin98Wallet.connect();
          break;
        case "nightly":
          account = await NightlyWallet.connect();
          break;
        case "blocto":
          account = await BloctoWallet.connect();
          break;
        case "onekey":
          account = await OneKeyWallet.connect();
          break;
        case "trust":
          account = await TrustWallet.connect();
          break;
        case "safe":
          account = await SafeWallet.connect();
          break;
        default:
          throw new Error(`Wallet "${walletName}" is not supported`);
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

  const connect = () => {
    setShowWalletSelector(true);
  };

  const disconnectWallet = async () => {
    setDisconnecting(true);
    try {
      setConnected(false);
      setAddress(null);
      setWalletType(null);
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
            response = await PetraWallet.signTransaction(payload);
            break;
          case "martian":
            response = await MartianWallet.signTransaction(payload);
            break;
          case "fewcha":
            response = await FewchaWallet.signTransaction(payload);
            break;
          case "pontem":
            response = await PontemWallet.signTransaction(payload);
            break;
          case "token-pocket":
            response = await TokenPocketWallet.signTransaction(payload);
            break;
          case "rise":
            response = await RiseWallet.signTransaction(payload);
            break;
          case "spacegate":
            response = await স্পেসগেটWallet.signTransaction(payload);
            break;
          case "hyperpay":
            response = await HyperPayWallet.signTransaction(payload);
            break;
          case "okx":
            response = await OKXWallet.signTransaction(payload);
            break;
          case "bitkeep":
            response = await BitKeepWallet.signTransaction(payload);
            break;
          case "coin98":
            response = await Coin98Wallet.signTransaction(payload);
            break;
          case "nightly":
            response = await NightlyWallet.signTransaction(payload);
            break;
          case "blocto":
            response = await BloctoWallet.signTransaction(payload);
            break;
          case "onekey":
            response = await OneKeyWallet.signTransaction(payload);
            break;
          case "trust":
            response = await TrustWallet.signTransaction(payload);
            break;
          case "safe":
            response = await SafeWallet.signTransaction(payload);
            break;
          default:
            throw new Error(`Wallet "${walletType}" is not supported`);
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
