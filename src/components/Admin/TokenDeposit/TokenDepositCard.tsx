
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Coins, Loader, Upload } from 'lucide-react';
import { IS_TESTNET } from '@/utils/aptos/constants';
import TokenDepositForm from './TokenDepositForm';
import TokenDepositSummary from './TokenDepositSummary';
import { useTokenDeposit } from '@/hooks/useTokenDeposit';
import { useWallet } from '@/context/WalletContext';

const TokenDepositCard: React.FC = () => {
  const { 
    amount, 
    setAmount, 
    selectedToken, 
    handleTokenChange, 
    processing, 
    handleDeposit,
    FIXED_PAYOUT_PER_NFT
  } = useTokenDeposit();
  const { address, isAdmin } = useWallet();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Deposit Tokens
        </CardTitle>
        <CardDescription>
          Add tokens to the escrow wallet for NFT holder rewards
          {IS_TESTNET && <span className="text-amber-500 ml-1">(Testnet mode: only APT supported)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TokenDepositForm
          amount={amount}
          setAmount={setAmount}
          selectedToken={selectedToken}
          handleTokenChange={handleTokenChange}
        />
        
        <TokenDepositSummary
          amount={amount}
          tokenName={selectedToken}
          payoutPerNft={FIXED_PAYOUT_PER_NFT}
          isTestnet={IS_TESTNET}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleDeposit} 
          className="w-full"
          disabled={!amount || processing || !address || !isAdmin}
        >
          {processing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing Deposit...
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Deposit to Escrow Wallet
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TokenDepositCard;
