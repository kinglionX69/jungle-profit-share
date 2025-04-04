
import { ReactNode } from 'react';
import { Aptos } from '@aptos-labs/ts-sdk';

export type Network = 'Mainnet' | 'Testnet';
export type WalletName = 'petra' | 'martian' | 'pontem' | 'rise';

export interface WalletContextType {
  connected: boolean;
  address: string | null;
  network: Network;
  walletType: string | null;
  connecting: boolean;
  disconnecting: boolean;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectWallet: (walletName: WalletName) => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  isAdmin: boolean;
  aptosClient: Aptos;
}
