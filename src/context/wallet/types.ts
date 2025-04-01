
// Define wallet-related types
export interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  connectWallet: (walletName: string) => Promise<void>;
  disconnect: () => void;
  isAdmin: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  walletType: string | null;
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
