import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WalletBalance as WalletBalanceType } from '@/api/adminApi';
import { toast } from 'sonner';
import { IS_TESTNET, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET, SUPPORTED_TOKENS } from '@/utils/aptos/constants';
import { useWallet } from '@/context/WalletContext';
import { getCoinBalance, aptosClient } from '@/utils/aptos/client';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getAptosPrice = async (): Promise<number> => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd");
    const data = await response.json();
    return data?.aptos?.usd || 40;
  } catch (error) {
    console.error("Error fetching APT price:", error);
    return 40;
  }
};

const WalletBalance: React.FC = () => {
  const [balances, setBalances] = useState<WalletBalanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address } = useWallet();
  
  const escrowWalletAddress = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
  
  const fetchBalances = async () => {
    if (!escrowWalletAddress) {
      toast.error("Escrow wallet address not configured");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      const aptPrice = await getAptosPrice();
      console.log(`Current APT price: $${aptPrice}`);
      
      const aptBalance = await getCoinBalance(
        escrowWalletAddress,
        SUPPORTED_TOKENS.APT,
        IS_TESTNET ? 'testnet' : 'mainnet'
      );
      console.log(`APT balance: ${aptBalance}`);
      
      const balancesData: WalletBalanceType[] = [
        {
          token: 'Aptos',
          symbol: 'APT',
          amount: aptBalance,
          value: aptBalance * aptPrice,
        }
      ];
      
      if (!IS_TESTNET) {
        try {
          const emojiCoinBalance = await getCoinBalance(
            escrowWalletAddress,
            SUPPORTED_TOKENS.EMOJICOIN,
            'mainnet'
          );
          
          if (emojiCoinBalance > 0) {
            balancesData.push({
              token: 'EmojiCoin',
              symbol: 'EMOJI',
              amount: emojiCoinBalance,
              value: emojiCoinBalance,
            });
          }
        } catch (emojiError) {
          console.log("EMOJICOIN not available or not registered");
        }
      }
      
      setBalances(balancesData);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch wallet balances");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchBalances();
  }, [escrowWalletAddress]);
  
  const totalValue = balances.reduce((acc, item) => acc + item.value, 0);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Escrow Wallet Balance</CardTitle>
          <CardDescription>Current token balances available for payouts</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchBalances}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded"></div>
            <div className="h-12 bg-muted animate-pulse rounded"></div>
            <div className="h-12 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No tokens found in escrow wallet
              </div>
            ) : (
              balances.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-xs font-semibold text-primary">{item.symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.token}</div>
                      <div className="text-sm text-muted-foreground">{item.amount.toFixed(4)} {item.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Value</span>
            <span className="text-xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Escrow Address: {escrowWalletAddress?.slice(0, 6)}...{escrowWalletAddress?.slice(-4)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
