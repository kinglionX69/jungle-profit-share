
import React, { useState, useEffect, useMemo } from 'react';
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
import { IS_TESTNET, SUPPORTED_TOKENS } from '@/utils/aptos/constants';
import { supabase } from '@/integrations/supabase/client';
import { getCoinBalance } from '@/utils/aptos/client';

const TokenWithdrawal: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payoutPerNft, setPayoutPerNft] = useState<number | null>(null);
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { address, isAdmin } = useWallet();
  
  // Fetch current payout configuration and escrow balance
  useEffect(() => {
    const fetchPayoutAndBalance = async () => {
      setIsLoadingData(true);
      try {
        // Fetch latest token payout configuration
        const { data: payoutData, error: payoutError } = await supabase
          .from('token_payouts')
          .select('*')
          .eq('token_name', selectedToken.toUpperCase())
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (payoutError) {
          console.error("Error fetching token payout:", payoutError);
        } else if (payoutData && payoutData.length > 0) {
          const payout = Number(payoutData[0].payout_per_nft);
          setPayoutPerNft(payout);
          console.log(`Current payout for ${selectedToken.toUpperCase()}: ${payout} per NFT`);
        } else {
          setPayoutPerNft(null);
          console.log(`No payout configuration found for ${selectedToken.toUpperCase()}`);
        }
        
        // Fetch current balance
        const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
        const network = IS_TESTNET ? 'testnet' : 'mainnet';
        
        // Get the escrow address from Supabase
        const { data: adminConfig, error: adminError } = await supabase
          .from('admin_config')
          .select('escrow_wallet_address')
          .single();
          
        if (adminError) {
          console.error("Error fetching escrow wallet address:", adminError);
          return;
        }
        
        if (adminConfig && adminConfig.escrow_wallet_address) {
          const balance = await getCoinBalance(
            adminConfig.escrow_wallet_address,
            tokenType,
            network
          );
          
          setEscrowBalance(balance);
          console.log(`Current escrow balance for ${selectedToken.toUpperCase()}: ${balance}`);
        }
      } catch (error) {
        console.error("Error fetching payout and balance:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchPayoutAndBalance();
  }, [selectedToken]);
  
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
    
    // Balance validation
    if (escrowBalance !== null && Number(amount) > escrowBalance) {
      toast.error(`Insufficient balance in escrow wallet. Available: ${escrowBalance.toFixed(4)} ${selectedToken.toUpperCase()}`);
      return;
    }
    
    setProcessing(true);
    
    try {
      // Get the correct token type
      const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
      const amountValue = Number(amount);
      const recipient = recipientAddress || address; // Default to own address if no recipient specified
      
      console.log(`Withdrawing ${amountValue} ${selectedToken.toUpperCase()} to ${recipient}`);
      
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('withdraw-from-escrow', {
        body: {
          tokenType,
          amount: amountValue,
          recipientAddress: recipient,
          network: IS_TESTNET ? 'testnet' : 'mainnet',
          adminWalletAddress: address
        }
      });
      
      if (error) {
        console.error("Error calling withdraw-from-escrow function:", error);
        throw new Error(error.message || "Failed to execute withdrawal");
      }
      
      if (data.success) {
        toast.success(`Tokens withdrawn successfully!${data.transactionHash ? ` Transaction: ${data.transactionHash}` : ''}`);
        setAmount('');
        setRecipientAddress('');
        
        // Refresh balance after withdrawal
        setTimeout(() => {
          const fetchUpdatedBalance = async () => {
            try {
              const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
              const network = IS_TESTNET ? 'testnet' : 'mainnet';
              
              // Get the escrow address from Supabase
              const { data: adminConfig } = await supabase
                .from('admin_config')
                .select('escrow_wallet_address')
                .single();
                
              if (adminConfig && adminConfig.escrow_wallet_address) {
                const balance = await getCoinBalance(
                  adminConfig.escrow_wallet_address,
                  tokenType,
                  network
                );
                
                setEscrowBalance(balance);
              }
            } catch (error) {
              console.error("Error refreshing balance:", error);
            }
          };
          
          fetchUpdatedBalance();
        }, 2000);
      } else {
        toast.error(data.error || "Transaction failed");
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
  
  // Calculate maximum NFTs that can be claimed
  const maxClaimableNfts = useMemo(() => {
    if (escrowBalance !== null && payoutPerNft !== null && payoutPerNft > 0) {
      return Math.floor(escrowBalance / payoutPerNft);
    }
    return 0;
  }, [escrowBalance, payoutPerNft]);
  
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
        
        <div className="bg-muted rounded-md p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available balance:</span>
            {isLoadingData ? (
              <div className="h-4 w-20 bg-muted-foreground/20 animate-pulse rounded"></div>
            ) : (
              <span className="font-medium">
                {escrowBalance !== null ? `${escrowBalance.toFixed(4)} ${IS_TESTNET ? 'APT' : selectedToken.toUpperCase()}` : 'Not available'}
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current payout per NFT:</span>
            {isLoadingData ? (
              <div className="h-4 w-20 bg-muted-foreground/20 animate-pulse rounded"></div>
            ) : (
              <span className="font-medium">
                {payoutPerNft !== null ? `${payoutPerNft} ${IS_TESTNET ? 'APT' : selectedToken.toUpperCase()}` : 'Not configured'}
              </span>
            )}
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-muted-foreground">Max claimable NFTs:</span>
            {isLoadingData ? (
              <div className="h-4 w-20 bg-muted-foreground/20 animate-pulse rounded"></div>
            ) : (
              <span className="font-medium">
                {maxClaimableNfts} NFTs
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleWithdraw} 
          className="w-full"
          variant="outline"
          disabled={!amount || processing || !address || !isAdmin}
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
