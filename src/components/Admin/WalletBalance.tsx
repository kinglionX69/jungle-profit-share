
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
import { IS_TESTNET } from '@/utils/aptos/constants';
import { useWallet } from '@/context/WalletContext';

// Fetch token balance from Aptos blockchain
const fetchTokenBalance = async (
  walletAddress: string,
  tokenType: string = "0x1::aptos_coin::AptosCoin"
): Promise<number> => {
  try {
    const nodeUrl = IS_TESTNET 
      ? "https://fullnode.testnet.aptoslabs.com/v1"
      : "https://fullnode.mainnet.aptoslabs.com/v1";
    
    console.log(`Fetching ${tokenType} balance for ${walletAddress}`);
    
    // Construct the resource type based on the token type
    const resourceType = `0x1::coin::CoinStore<${tokenType}>`;
    
    // Fetch resource from the blockchain
    const response = await fetch(`${nodeUrl}/accounts/${walletAddress}/resource/${resourceType}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      return 0;
    }
    
    const data = await response.json();
    console.log("Token balance data:", data);
    
    // Extract the coin value from the response
    const balance = data?.data?.coin?.value || 0;
    
    // Convert from smallest units (e.g., octas for APT)
    return parseInt(balance) / 100000000; // 8 decimal places
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return 0;
  }
};

// Get current USD value of APT
const getAptosPrice = async (): Promise<number> => {
  try {
    // Use CoinGecko API to get current APT price
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd");
    const data = await response.json();
    return data?.aptos?.usd || 40; // Default to $40 if API fails
  } catch (error) {
    console.error("Error fetching APT price:", error);
    return 40; // Default fallback price
  }
};

const WalletBalance: React.FC = () => {
  const [balances, setBalances] = useState<WalletBalanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useWallet();
  
  // Escrow wallet address - should be fetched from the database in production
  const escrowWalletAddress = "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234";
  
  useEffect(() => {
    const fetchBalances = async () => {
      if (!escrowWalletAddress) {
        toast.error("Escrow wallet address not configured");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get APT price in USD
        const aptPrice = await getAptosPrice();
        console.log(`Current APT price: $${aptPrice}`);
        
        // Fetch APT balance
        const aptBalance = await fetchTokenBalance(escrowWalletAddress);
        console.log(`APT balance: ${aptBalance}`);
        
        // Try to fetch USDC balance too
        const usdcTokenType = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
        const usdcBalance = await fetchTokenBalance(escrowWalletAddress, usdcTokenType);
        console.log(`USDC balance: ${usdcBalance}`);
        
        // Calculate USD values
        const aptValue = aptBalance * aptPrice;
        const usdcValue = usdcBalance; // USDC is pegged to USD
        
        // Prepare balances data
        const balancesData: WalletBalanceType[] = [
          {
            token: 'Aptos',
            symbol: 'APT',
            amount: aptBalance,
            value: aptValue,
          }
        ];
        
        // Add USDC if available
        if (usdcBalance > 0) {
          balancesData.push({
            token: 'USD Coin',
            symbol: 'USDC',
            amount: usdcBalance,
            value: usdcValue,
          });
        }
        
        setBalances(balancesData);
      } catch (error) {
        console.error("Error fetching balances:", error);
        toast.error("Failed to fetch wallet balances");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBalances();
  }, [escrowWalletAddress]);
  
  const totalValue = balances.reduce((acc, item) => acc + item.value, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrow Wallet Balance</CardTitle>
        <CardDescription>Current token balances available for payouts</CardDescription>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
