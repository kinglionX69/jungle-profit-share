
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { WalletBalance as WalletBalanceType } from '@/api/adminApi';
import { toast } from 'sonner';
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from '@/utils/aptos/constants';
import { useWallet } from '@/context/WalletContext';
import { getCoinBalance, getAptosClient } from '@/utils/aptos/client';
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
      
      const aptosPrice = await getAptosPrice();
      const newBalances: WalletBalanceType[] = [];
      
      // Fetch APT balance
      const aptBalance = await getCoinBalance(escrowWalletAddress, SUPPORTED_TOKENS.APT);
      newBalances.push({
        symbol: 'APT',
        balance: aptBalance,
        usdValue: aptBalance * aptosPrice,
        payoutPerNft: payoutsInfo['apt'] || 0.1
      });
      
      setBalances(newBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch wallet balances");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchPayoutConfiguration();
  }, []);
  
  useEffect(() => {
    if (payoutsInfo['apt']) {
      fetchBalances();
    }
  }, [payoutsInfo]);
  
  const getMaxClaimableNfts = (symbol: string, amount: number) => {
    const payoutPerNft = payoutsInfo[symbol.toLowerCase()] || 0.1;
    return Math.floor(amount / payoutPerNft);
  };
  
  if (isLoading) {
    return (
      <Card sx={{ 
        backgroundImage: 'none',
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Escrow Wallet Balance
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchBalances}
            disabled={isRefreshing}
            startIcon={<RefreshCw style={{ width: 16, height: 16 }} />}
            sx={{ 
              fontFamily: "'Nunito', sans-serif",
              '&.Mui-disabled': {
                color: 'text.secondary'
              }
            }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
        
        <Grid container component="div" spacing={2}>
          {balances.map((balance) => (
            <Grid component="div" item xs={12} sm={6} key={balance.symbol}>
              <Paper sx={{ 
                p: 2,
                backgroundImage: 'none',
                backgroundColor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}>
                <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
                  {balance.symbol} Balance
                </Typography>
                <Typography variant="h4" sx={{ fontFamily: "'Bungee', cursive", my: 1 }}>
                  {balance.balance.toFixed(2)}
                </Typography>
                <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
                  ${balance.usdValue.toFixed(2)} USD
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontFamily: "'Nunito', sans-serif" }}>
                  Max Claimable NFTs: {getMaxClaimableNfts(balance.symbol, balance.balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
                  Payout per NFT: {balance.payoutPerNft} {balance.symbol}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
