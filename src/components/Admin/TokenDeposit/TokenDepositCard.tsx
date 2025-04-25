import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Coins, Loader, Upload } from 'lucide-react';
import { IS_TESTNET } from '@/utils/aptos/constants';
import TokenDepositForm from './TokenDepositForm';
import TokenDepositSummary from './TokenDepositSummary';
import { useTokenDeposit } from '@/hooks/useTokenDeposit';
import { useWallet } from '@/context/WalletContext';

const TokenDepositCard: React.FC = () => {
  const { 
    amount, 
    setAmount, 
    selectedToken, 
    handleTokenChange, 
    processing, 
    handleDeposit,
    FIXED_PAYOUT_PER_NFT
  } = useTokenDeposit();
  const { address, isAdmin } = useWallet();
  
  return (
    <Card sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Upload style={{ width: 20, height: 20 }} />
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Deposit Tokens
          </Typography>
        </Box>
        
        <Typography color="text.secondary" sx={{ mb: 3, fontFamily: "'Nunito', sans-serif" }}>
          Add tokens to the escrow wallet for NFT holder rewards
          {IS_TESTNET && (
            <Typography component="span" sx={{ color: 'warning.main', ml: 0.5, fontFamily: "'Nunito', sans-serif" }}>
              (Testnet mode: only APT supported)
            </Typography>
          )}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TokenDepositForm
            amount={amount}
            setAmount={setAmount}
            selectedToken={selectedToken}
            handleTokenChange={handleTokenChange}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TokenDepositSummary
            amount={amount}
            tokenName={selectedToken}
            payoutPerNft={FIXED_PAYOUT_PER_NFT}
            isTestnet={IS_TESTNET}
          />
        </Box>
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleDeposit}
          disabled={!amount || processing || !address || !isAdmin}
          startIcon={processing ? <Loader style={{ width: 16, height: 16 }} /> : <Coins style={{ width: 16, height: 16 }} />}
          sx={{ 
            py: 1.5,
            fontFamily: "'Bungee', cursive"
          }}
        >
          {processing ? 'Processing Deposit...' : 'Deposit to Escrow Wallet'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TokenDepositCard;
