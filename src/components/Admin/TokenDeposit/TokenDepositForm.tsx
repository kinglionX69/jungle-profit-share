import React from 'react';
import {
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box
} from '@mui/material';
import { IS_TESTNET } from '@/utils/aptos/constants';

interface TokenDepositFormProps {
  amount: string;
  setAmount: (value: string) => void;
  selectedToken: string;
  handleTokenChange: (value: string) => void;
}

const TokenDepositForm: React.FC<TokenDepositFormProps> = ({
  amount,
  setAmount,
  selectedToken,
  handleTokenChange
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend" sx={{ mb: 1, fontFamily: "'Nunito', sans-serif" }}>
          Amount
        </FormLabel>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ 
              '& .MuiInputLabel-root': {
                fontFamily: "'Nunito', sans-serif"
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Nunito', sans-serif"
              }
            }}
          />
          
          {IS_TESTNET ? (
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: 'background.default',
                borderRadius: 1,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 500
              }}
            >
              APT
            </Box>
          ) : (
            <RadioGroup
              row
              value={selectedToken}
              onChange={(e) => handleTokenChange(e.target.value)}
              sx={{ ml: 1 }}
            >
              <FormControlLabel
                value="apt"
                control={<Radio />}
                label="APT"
                sx={{ fontFamily: "'Nunito', sans-serif" }}
              />
              <FormControlLabel
                value="emojicoin"
                control={<Radio />}
                label="EMOJICOIN"
                sx={{ fontFamily: "'Nunito', sans-serif" }}
              />
            </RadioGroup>
          )}
        </Box>
      </FormControl>
    </Box>
  );
};

export default TokenDepositForm;
