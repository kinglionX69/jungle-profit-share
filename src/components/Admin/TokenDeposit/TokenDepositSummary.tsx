
import React from 'react';

interface TokenDepositSummaryProps {
  amount: string;
  tokenName: string;
  payoutPerNft: number;
  isTestnet: boolean;
}

const TokenDepositSummary: React.FC<TokenDepositSummaryProps> = ({
  amount,
  tokenName,
  payoutPerNft,
  isTestnet
}) => {
  return (
    <div className="bg-muted rounded-md p-4 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Deposit amount:</span>
        <span className="font-medium">{amount || '0'} {isTestnet ? 'APT' : tokenName.toUpperCase()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Payout per NFT:</span>
        <span className="font-medium">{payoutPerNft} {isTestnet ? 'APT' : tokenName.toUpperCase()}</span>
      </div>
      <div className="flex justify-between border-t pt-2 mt-2">
        <span className="text-muted-foreground">Expected claims:</span>
        <span className="font-medium">
          {amount && Number(amount) > 0
            ? Math.floor(Number(amount) / payoutPerNft)
            : '0'} NFTs
        </span>
      </div>
    </div>
  );
};

export default TokenDepositSummary;
