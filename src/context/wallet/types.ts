
// Define wallet-related types
export interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  disconnecting?: boolean;
  address: string | null;
  network: Network;
  walletType: string | null;
  connect: () => Promise<void>;
  connectWallet: (walletName: string) => Promise<void>;
  disconnect: () => void;
  isAdmin: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
}

// Add TypeScript definitions for the wallet providers
declare global {
  interface Window {
    // Legacy Petra API
    aptos?: {
      connect: () => Promise<{ address: string }>;
      disconnect: () => Promise<void>;
      account: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
    // New Petra API following Aptos Wallet Standard
    petra?: {
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
      getAccount: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
    };
  }
}

// Add the missing types
export type Network = "Mainnet" | "Testnet";
export type WalletName = "petra" | "martian" | "pontem" | "rise" | "fewcha" | "token-pocket" | 
  "spacegate" | "hyperpay" | "okx" | "bitkeep" | "coin98" | "nightly" | "blocto" | "onekey" | 
  "trust" | "safe";
