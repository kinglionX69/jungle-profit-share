
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getEscrowWalletBalances, WalletBalance as WalletBalanceType } from '@/api/adminApi';

const WalletBalance: React.FC = () => {
  const [balances, setBalances] = useState<WalletBalanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const data = await getEscrowWalletBalances();
        setBalances(data);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBalances();
  }, []);
  
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
            {balances.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-primary">{item.symbol}</span>
                  </div>
                  <div>
                    <div className="font-medium">{item.token}</div>
                    <div className="text-sm text-muted-foreground">{item.amount} {item.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item.value.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {((item.value / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Value</span>
            <span className="text-xl font-bold">${totalValue.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
