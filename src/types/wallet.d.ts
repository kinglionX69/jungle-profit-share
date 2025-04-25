declare interface PetraWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (payload: any) => Promise<any>;
  account: () => Promise<{ address: string }>;
}

interface Window {
  petra?: PetraWallet;
  aptos?: PetraWallet; // Some wallets use the same interface as Petra
} 