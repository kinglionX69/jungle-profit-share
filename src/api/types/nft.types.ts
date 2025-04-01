/**
 * Type definitions for NFT-related functionality
 */

export interface NFT {
  tokenId: string;
  name: string;
  imageUrl: string;
  isEligible: boolean;
  isLocked: boolean;
  standard?: string;
  creator?: string;
  properties?: any;
  unlockDate?: Date;
}

export interface ClaimHistory {
  id: string;
  date: Date;
  amount: number;
  tokenName: string;
  nfts: string[];
}
