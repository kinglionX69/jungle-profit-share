
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
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from '@/utils/aptos/constants';
import { useWallet } from '@/context/WalletContext';
import { getCoinBalance, getAptosClient } from '@/utils/aptos/client';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
  const [payoutsInfo, setPayoutsInfo] = useState<{[key: string]: number}>({});
  const { address } = useWallet();
  
  const fetchEscrowWalletAddress = async () => {
    try {
      console.log("Fetching escrow wallet address from admin_config table");
      const { data, error } = await supabase
        .from('admin_config')
        .select('escrow_wallet_address')
        .single();
        
      if (error) {
        console.error("Error fetching escrow wallet address:", error);
        return IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
      }
      
      const address = data?.escrow_wallet_address || (IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET);
      console.log("Retrieved escrow wallet address:", address);
      return address;
    } catch (error) {
      console.error("Exception fetching escrow wallet address:", error);
      return IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    }
  };
  
  const fetchPayoutConfiguration = async () => {
    try {
      console.log("Fetching token payout configuration");
      const { data, error } = await supabase
        .from('token_payouts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching token payouts:", error);
        return;
      }
      
      const payouts: {[key: string]: number} = {};
      
      data.forEach(payout => {
        const tokenName = payout.token_name.toLowerCase();
        if (!payouts[tokenName]) {
          payouts[tokenName] = Number(payout.payout_per_nft);
        }
      });
      
      setPayoutsInfo(payouts);
      console.log("Payouts per NFT:", payouts);
    } catch (error) {
      console.error("Error fetching payout configuration:", error);
    }
  };
  
  const fetchBalances = async () => {
    setIsRefreshing(true);
    
    try {
      const escrowWalletAddress = await fetchEscrowWalletAddress();
      
      if (!escrowWalletAddress) {
        toast.error("Escrow wallet address not configured");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      console.log(`Using escrow wallet: ${escrowWalletAddress}`);
      
      await fetchPayoutConfiguration();
      
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
  }, []);
  
  const totalValue = balances.reduce((acc, item) => acc + item.value, 0);
  
  const getMaxClaimableNfts = (symbol: string, amount: number) => {
    const payoutKey = symbol.toLowerCase();
    const payout = payoutsInfo[payoutKey];
    
    if (payout && payout > 0) {
      return Math.floor(amount / payout);
    }
    
    return 'N/A';
  };
  
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
                    <div className="text-sm text-muted-foreground flex flex-col items-end">
                      <span>{totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0'}%</span>
                      {payoutsInfo[item.symbol.toLowerCase()] ? (
                        <span className="text-xs mt-1">
                          Max NFTs: {getMaxClaimableNfts(item.symbol, item.amount)}
                        </span>
                      ) : null}
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
          <div className="text-xs text-muted-foreground mt-2 flex flex-col space-y-1">
            {Object.entries(payoutsInfo).map(([token, payout]) => (
              <div key={token} className="flex justify-between">
                <span>Payout per NFT ({token.toUpperCase()}):</span>
                <span>{payout.toFixed(2)} {token.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
