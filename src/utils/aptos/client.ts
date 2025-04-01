import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const aptosClient = (network?: string) => {
  if (network === Network.DEVNET.toLowerCase()) {
    return devnetClient;
  } else if (network === Network.TESTNET.toLowerCase()) {
    return testnetClient;
  } else if (network === Network.MAINNET.toLowerCase()) {
    throw new Error("Please use devnet or testnet for testing");
  } else {
    throw new Error(`Unknown network: ${network}`);
  }
};
const DEVNET_CONFIG = new AptosConfig({ network: Network.DEVNET });
const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });

export const devnetClient = new Aptos(DEVNET_CONFIG);
export const testnetClient = new Aptos(TESTNET_CONFIG);

export const isSendableNetwork = (
  connected: boolean,
  network?: string
): boolean => {
  return (
    connected &&
    (network?.toLowerCase() === Network.DEVNET.toLowerCase() ||
      network?.toLowerCase() === Network.TESTNET.toLowerCase())
  );
};
