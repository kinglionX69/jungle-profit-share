
import { Network } from '@aptos-labs/ts-sdk';

export type WalletName = 'petra' | 'martian' | 'pontem' | 'rise';

export interface WalletContextType {
  connected: boolean;
  address: string | null;
  network: string;
  walletType: WalletName | null;
  connecting: boolean;
  disconnecting: boolean;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectWallet: (walletName: WalletName) => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  isAdmin: boolean;
  aptosClient: any;
}

export { Network };
