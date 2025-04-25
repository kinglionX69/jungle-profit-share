import { Network } from '@aptos-labs/ts-sdk';

/**
 * Represents the supported wallet types in the application.
 * Currently only Petra wallet is supported.
 */
export type WalletName = 'petra';

/**
 * Interface representing the wallet context state and methods.
 * This provides access to wallet connection status, address, and operations.
 */
export interface WalletContextType {
  // Connection state
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  address: string | null;
  network: string;
  walletType: WalletName | null;
  isAdmin: boolean;

  // Wallet operations
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectWallet: (walletName: WalletName) => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;

  // Aptos client instance
  aptosClient: any;
}

// Re-export Network type from Aptos SDK
export { Network };
