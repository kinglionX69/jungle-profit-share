import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Coins, Loader } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createTokenPayout } from '@/api/adminApi';
import { useWallet } from '@/context/WalletContext';
import { depositTokensTransaction } from '@/utils/aptos/transactionUtils';
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from '@/utils/aptos/constants';

const TokenDeposit: React.FC = () => {
  // Force selectedToken to be 'apt' on testnet - no other options
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [payoutAmount, setPayoutAmount] = useState('2');
  const [processing, setProcessing] = useState(false);
  const { address, signTransaction, isAdmin } = useWallet();
  
  // Testnet only supports APT
  const handleTokenChange = (value: string) => {
    if (IS_TESTNET && value !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    setSelectedToken(value);
  };
  
  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!payoutAmount || isNaN(Number(payoutAmount)) || Number(payoutAmount) <= 0) {
      toast.error("Please enter a valid payout amount per NFT");
      return;
    }
    
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only admins can deposit tokens");
      return;
    }
    
    // Testnet validation
    if (IS_TESTNET && selectedToken !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Get the correct token type
      const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
      const amountValue = Number(amount);
      const payoutValue = Number(payoutAmount);
      
      console.log(`Depositing ${amountValue} ${selectedToken.toUpperCase()} with payout ${payoutValue} per NFT`);
      
      // Display the escrow wallet address being used
      const escrowWallet = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
      console.log(`Using escrow wallet: ${escrowWallet}`);
      
      // Execute the blockchain transaction
      if (!signTransaction) {
        throw new Error("Wallet signing function not available");
      }
      
      const txResult = await depositTokensTransaction(
        address,
        tokenType,
        amountValue,
        payoutValue,
        signTransaction
      );
      
      if (txResult.success) {
        toast.success(`Tokens deposited successfully!${txResult.transactionHash ? ` Transaction: ${txResult.transactionHash}` : ''}`);
        
        // After successful blockchain transaction, update the payout in the database
        console.log("Updating token payout in database");
        const dbResult = await createTokenPayout(
          address,
          selectedToken.toUpperCase(),
          payoutValue
        );
        
        if (dbResult) {
          toast.success(`Payout configuration updated to ${payoutValue} ${selectedToken.toUpperCase()} per NFT`);
          setAmount('');
        } else {
          toast.error("Failed to update payout configuration in database");
        }
      } else {
        toast.error(txResult.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error depositing tokens:", error);
      let errorMessage = "Failed to deposit tokens";
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Account hasn't registered")) {
          errorMessage = "Token registration required. Please try again.";
        } else if (error.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to complete the transaction";
        } else if (error.message.includes("rejected")) {
          errorMessage = "Transaction rejected by wallet";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
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
        <div className="space-y-2">
          <Label htmlFor="token-amount">Amount</Label>
          <div className="flex gap-2">
            <Input
              id="token-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="flex-1"
            />
            {/* On testnet, only show APT option - on mainnet, show both options */}
            {IS_TESTNET ? (
              <div className="flex items-center px-3 py-2 bg-muted rounded-md font-medium">
                APT
              </div>
            ) : (
              <RadioGroup 
                value={selectedToken}
                onValueChange={handleTokenChange}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="apt" id="apt" />
                  <Label htmlFor="apt" className="cursor-pointer">APT</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="emojicoin" id="emojicoin" />
                  <Label htmlFor="emojicoin" className="cursor-pointer">EMOJICOIN</Label>
                </div>
              </RadioGroup>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="payout-amount">Payout per NFT</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="payout-amount"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {IS_TESTNET ? 'APT' : selectedToken.toUpperCase()} per NFT
            </span>
          </div>
        </div>
        
        <div className="bg-muted rounded-md p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit amount:</span>
            <span className="font-medium">{amount || '0'} {IS_TESTNET ? 'APT' : selectedToken.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout per NFT:</span>
            <span className="font-medium">{payoutAmount || '0'} {IS_TESTNET ? 'APT' : selectedToken.toUpperCase()}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-muted-foreground">Expected claims:</span>
            <span className="font-medium">
              {amount && payoutAmount && Number(payoutAmount) > 0
                ? Math.floor(Number(amount) / Number(payoutAmount))
                : '0'} NFTs
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleDeposit} 
          className="w-full"
          disabled={!amount || !payoutAmount || processing || !address || !isAdmin}
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

export default TokenDeposit;
