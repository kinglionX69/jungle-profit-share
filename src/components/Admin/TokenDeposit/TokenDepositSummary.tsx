import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';

interface TokenDepositSummaryProps {
  amount: string;
  tokenName: string;
  payoutPerNft: number;
  isTestnet: boolean;
}

const TokenDepositSummary: React.FC<TokenDepositSummaryProps> = ({
  amount,
  tokenName,
  payoutPerNft,
  isTestnet
}) => {
  return (
    <Paper sx={{ 
      p: 2,
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
            Deposit amount:
          </Typography>
          <Typography sx={{ fontFamily: "'Nunito', sans-serif", fontWeight: 500 }}>
            {amount || '0'} {isTestnet ? 'APT' : tokenName.toUpperCase()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
            Payout per NFT:
          </Typography>
          <Typography sx={{ fontFamily: "'Nunito', sans-serif", fontWeight: 500 }}>
            {payoutPerNft.toFixed(2)} {isTestnet ? 'APT' : tokenName.toUpperCase()}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
            Expected claims:
          </Typography>
          <Typography sx={{ fontFamily: "'Nunito', sans-serif", fontWeight: 500 }}>
            {amount && Number(amount) > 0
              ? Math.floor(Number(amount) / payoutPerNft)
              : '0'} NFTs
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default TokenDepositSummary;
