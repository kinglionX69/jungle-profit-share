import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, Box } from '@mui/material';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

const MockDataAlert: React.FC = () => {
  return (
    <Alert 
      severity="warning" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-icon': {
          color: 'warning.main'
        }
      }}
    >
      <AlertTitle sx={{ fontFamily: "'Poppins', sans-serif" }}>
        Using Sample Data
      </AlertTitle>
      <Box sx={{ fontFamily: "'Nunito', sans-serif" }}>
        <p>We couldn't find any real NFTs in your wallet from the {NFT_COLLECTION_NAME} collection.</p>
        <p style={{ marginTop: 4, fontSize: '0.875rem' }}>
          If you believe this is an error, please check your wallet connection and make sure you own NFTs from this collection.
        </p>
      </Box>
    </Alert>
  );
};

export default MockDataAlert;
