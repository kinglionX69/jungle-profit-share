
// Type definitions for Aptos wallet browser extensions
interface AptosWallet {
  connect: () => Promise<{ address: string }>;
  account: () => Promise<{ address: string }>;
  isConnected: () => Promise<boolean>;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
  network?: () => Promise<string>;
  chainId?: () => Promise<number>;
  disconnect?: () => Promise<void>;
}

interface MartianWallet {
  connect: () => Promise<{ address: string }>;
  getAccount: () => Promise<{ address: string }>;
  isConnected: () => Promise<boolean>;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
  network?: () => Promise<string>;
  chainId?: () => Promise<number>;
  disconnect?: () => Promise<void>;
}

interface PontemWallet {
  connect: () => Promise<string>;
  isConnected: () => Promise<boolean>;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
  network?: () => Promise<string>;
  disconnect?: () => Promise<void>;
}

interface RiseWallet {
  connect: () => Promise<{ address: string }>;
  getAccount: () => Promise<{ address: string }>;
  isConnected: () => Promise<boolean>;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
  network?: () => Promise<string>;
  disconnect?: () => Promise<void>;
}

interface Window {
  petra?: AptosWallet;
  aptos?: AptosWallet;
  martian?: MartianWallet;
  pontem?: PontemWallet;
  rise?: RiseWallet;
}
