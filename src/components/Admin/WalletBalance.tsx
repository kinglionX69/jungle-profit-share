
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Skeleton
} from '@mui/material';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/context/wallet';

interface Balance {
  symbol: string;
  amount: number | null;
  loading: boolean;
}

const WalletBalance: React.FC = () => {
  const { address } = useWallet();
  const [balances, setBalances] = useState<Balance[]>([
    { symbol: 'APT', amount: null, loading: true },
  ]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;

      try {
        // Mock balance for now, implement real balance fetching later
        const mockBalance = 100.00;
        setBalances([{ symbol: 'APT', amount: mockBalance, loading: false }]);
      } catch (error) {
        console.error("Error fetching APT balance:", error);
        toast.error("Failed to fetch APT balance");
        setBalances([{ symbol: 'APT', amount: null, loading: false }]);
      }
    };

    fetchBalances();
  }, [address]);
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 'bold', 
          mb: 2, 
          fontFamily: "'Poppins', sans-serif" 
        }}>
          Escrow Wallet Balance
        </Typography>
        
        <Grid container spacing={2} component="div">
          {balances.map((balance) => (
            <Grid key={balance.symbol} item xs={12} sm={6} component="div">
              <Paper 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundImage: 'none',
                  backgroundColor: 'transparent',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Wallet size={20} />
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'medium', 
                  fontFamily: "'Nunito', sans-serif" 
                }}>
                  {balance.symbol}:
                </Typography>
                {balance.loading ? (
                  <Skeleton variant="text" width={80} />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontFamily: "'Nunito', sans-serif" 
                  }}>
                    {balance.amount !== null ? balance.amount.toFixed(2) : 'N/A'}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
