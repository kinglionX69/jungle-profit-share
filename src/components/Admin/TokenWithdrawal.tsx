
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
import { Download, Loader } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useWallet } from '@/context/WalletContext';
import { withdrawFromEscrowWallet } from '@/utils/aptos/transactionUtils';
import { IS_TESTNET, SUPPORTED_TOKENS } from '@/utils/aptos/constants';

const TokenWithdrawal: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const { address, isAdmin } = useWallet();
  
  const handleTokenChange = (value: string) => {
    if (IS_TESTNET && value !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    setSelectedToken(value);
  };
  
  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only admins can withdraw tokens");
      return;
    }
    
    if (recipientAddress && !recipientAddress.startsWith('0x')) {
      toast.error("Invalid recipient address");
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
      const recipient = recipientAddress || address; // Default to own address if no recipient specified
      
      console.log(`Withdrawing ${amountValue} ${selectedToken.toUpperCase()} to ${recipient}`);
      
      // Execute the blockchain transaction using the escrow private key
      const txResult = await withdrawFromEscrowWallet(
        tokenType,
        amountValue,
        recipient
      );
      
      if (txResult.success) {
        toast.success(`Tokens withdrawn successfully!${txResult.transactionHash ? ` Transaction: ${txResult.transactionHash}` : ''}`);
        setAmount('');
        setRecipientAddress('');
      } else {
        toast.error(txResult.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      let errorMessage = "Failed to withdraw tokens";
      
      if (error instanceof Error) {
        errorMessage = error.message;
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
          <Download className="h-5 w-5" />
          Withdraw Tokens
        </CardTitle>
        <CardDescription>
          Withdraw tokens from the escrow wallet (admin only)
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
                  <RadioGroupItem value="apt" id="withdraw-apt" />
                  <Label htmlFor="withdraw-apt" className="cursor-pointer">APT</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="emojicoin" id="withdraw-emojicoin" />
                  <Label htmlFor="withdraw-emojicoin" className="cursor-pointer">EMOJICOIN</Label>
                </div>
              </RadioGroup>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="recipient-address">
            Recipient Address (optional)
          </Label>
          <Input
            id="recipient-address"
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x... (leave empty to send to your wallet)"
            className="flex-1"
          />
          <p className="text-xs text-muted-foreground">
            If left empty, tokens will be sent to your wallet
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleWithdraw} 
          className="w-full"
          variant="outline"
          disabled={!amount || processing}
        >
          {processing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing Withdrawal...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Withdraw from Escrow Wallet
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TokenWithdrawal;
