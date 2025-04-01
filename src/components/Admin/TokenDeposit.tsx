
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

// Token types
const TOKEN_TYPES = {
  apt: "0x1::aptos_coin::AptosCoin",
  usdc: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
};

const TokenDeposit: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [payoutAmount, setPayoutAmount] = useState('2');
  const [processing, setProcessing] = useState(false);
  const { address, signTransaction } = useWallet();
  
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
    
    setProcessing(true);
    
    try {
      // First, execute the blockchain transaction
      const tokenType = TOKEN_TYPES[selectedToken as keyof typeof TOKEN_TYPES];
      const amountValue = Number(amount);
      const payoutValue = Number(payoutAmount);
      
      console.log(`Depositing ${amountValue} ${selectedToken.toUpperCase()} with payout ${payoutValue} per NFT`);
      
      // Execute the blockchain transaction with the updated function that handles CoinStore registration
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
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error depositing tokens:", error);
      let errorMessage = "Failed to deposit tokens";
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Account hasn't registered")) {
          errorMessage = "Your account needs to register for this token type first. Please try again.";
        } else if (error.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to complete the transaction";
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
            <RadioGroup 
              defaultValue="apt" 
              value={selectedToken}
              onValueChange={setSelectedToken}
              className="flex gap-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="apt" id="apt" />
                <Label htmlFor="apt" className="cursor-pointer">APT</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="usdc" id="usdc" />
                <Label htmlFor="usdc" className="cursor-pointer">USDC</Label>
              </div>
            </RadioGroup>
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
              {selectedToken.toUpperCase()} per NFT
            </span>
          </div>
        </div>
        
        <div className="bg-muted rounded-md p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit amount:</span>
            <span className="font-medium">{amount || '0'} {selectedToken.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout per NFT:</span>
            <span className="font-medium">{payoutAmount || '0'} {selectedToken.toUpperCase()}</span>
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
          disabled={!amount || !payoutAmount || processing}
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
