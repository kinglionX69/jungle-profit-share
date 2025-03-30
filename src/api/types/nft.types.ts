/**
 * Type definitions for NFT-related functionality
 */

export interface NFT {
  tokenId: string;
  name: string;
  imageUrl: string;
  isEligible: boolean;
  isLocked: boolean;
  unlockDate?: Date;
  standard?: string;  // Added to support NFTGrid component
  creator?: string;   // Added to support additional metadata
  properties?: string; // Added to support additional metadata
}

export interface ClaimHistory {
  id: string;
  date: Date;
  amount: number;
  tokenName: string;
  nfts: string[];
}
