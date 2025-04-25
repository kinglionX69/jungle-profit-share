declare interface PetraWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  account: () => Promise<{ address: string }>;
}

declare interface MartianWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  account: () => Promise<{ address: string }>;
}

declare interface PontemWallet {
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
}

declare interface RiseWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  account: () => Promise<{ address: string }>;
}

interface Window {
  petra?: PetraWallet;
  martian?: MartianWallet;
  pontem?: PontemWallet;
  rise?: RiseWallet;
  aptos?: PetraWallet; // Some wallets use the same interface as Petra
} 