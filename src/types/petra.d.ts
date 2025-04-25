interface PetraWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
}

declare global {
  interface Window {
    petra?: PetraWallet;
  }
}

export {}; 