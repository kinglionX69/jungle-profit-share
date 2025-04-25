import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Paper
} from '@mui/material';
import { toast } from 'sonner';
import { Download, Loader } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { IS_TESTNET, SUPPORTED_TOKENS } from '@/utils/aptos/constants';
import { supabase } from '@/integrations/supabase/client';
import { getCoinBalance } from '@/utils/aptos/client';

const TokenWithdrawal: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payoutPerNft, setPayoutPerNft] = useState<number | null>(null);
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { address, isAdmin } = useWallet();
  
  // Fetch current payout configuration and escrow balance
  useEffect(() => {
    const fetchPayoutAndBalance = async () => {
      setIsLoadingData(true);
      try {
        // Fetch latest token payout configuration
        const { data: payoutData, error: payoutError } = await supabase
          .from('token_payouts')
          .select('*')
          .eq('token_name', selectedToken.toUpperCase())
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (payoutError) {
          console.error("Error fetching token payout:", payoutError);
        } else if (payoutData && payoutData.length > 0) {
          const payout = Number(payoutData[0].payout_per_nft);
          setPayoutPerNft(payout);
          console.log(`Current payout for ${selectedToken.toUpperCase()}: ${payout} per NFT`);
        } else {
          setPayoutPerNft(null);
          console.log(`No payout configuration found for ${selectedToken.toUpperCase()}`);
        }
        
        // Fetch current balance
        const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
        const network = IS_TESTNET ? 'testnet' : 'mainnet';
        
        // Get the escrow address from Supabase
        const { data: adminConfig, error: adminError } = await supabase
          .from('admin_config')
          .select('escrow_wallet_address')
          .single();
          
        if (adminError) {
          console.error("Error fetching escrow wallet address:", adminError);
          return;
        }
        
        if (adminConfig && adminConfig.escrow_wallet_address) {
          const balance = await getCoinBalance(
            adminConfig.escrow_wallet_address,
            tokenType,
            network
          );
          
          setEscrowBalance(balance);
          console.log(`Current escrow balance for ${selectedToken.toUpperCase()}: ${balance}`);
        }
      } catch (error) {
        console.error("Error fetching payout and balance:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchPayoutAndBalance();
  }, [selectedToken]);
  
  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (IS_TESTNET && value !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    setSelectedToken(value);
  };
  
  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!recipientAddress) {
      toast.error("Please enter a recipient address");
      return;
    }
    
    if (!escrowBalance || Number(amount) > escrowBalance) {
      toast.error("Insufficient balance in escrow wallet");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Here you would implement the actual withdrawal logic
      // This is just a placeholder for the actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully withdrew ${amount} ${selectedToken.toUpperCase()}`);
      setAmount('');
      setRecipientAddress('');
      
      // Refresh the balance
      const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
      const network = IS_TESTNET ? 'testnet' : 'mainnet';
      const { data: adminConfig } = await supabase
        .from('admin_config')
        .select('escrow_wallet_address')
        .single();
        
      if (adminConfig && adminConfig.escrow_wallet_address) {
        const newBalance = await getCoinBalance(
          adminConfig.escrow_wallet_address,
          tokenType,
          network
        );
        setEscrowBalance(newBalance);
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setProcessing(false);
    }
  };
  
  if (isLoadingData) {
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
        <Typography variant="h6" gutterBottom sx={{ fontFamily: "'Poppins', sans-serif" }}>
          Token Withdrawal
        </Typography>
        
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontFamily: "'Nunito', sans-serif" }}>
            Select Token
          </FormLabel>
          <RadioGroup
            row
            value={selectedToken}
            onChange={handleTokenChange}
          >
            <FormControlLabel
              value="apt"
              control={<Radio />}
              label="APT"
              sx={{ fontFamily: "'Nunito', sans-serif" }}
            />
            {!IS_TESTNET && (
              <FormControlLabel
                value="emoji"
                control={<Radio />}
                label="EMOJI"
                sx={{ fontFamily: "'Nunito', sans-serif" }}
              />
            )}
          </RadioGroup>
        </FormControl>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            InputProps={{
              endAdornment: (
                <Typography sx={{ fontFamily: "'Nunito', sans-serif" }}>
                  {selectedToken.toUpperCase()}
                </Typography>
              )
            }}
            sx={{ 
              '& .MuiInputLabel-root': {
                fontFamily: "'Nunito', sans-serif"
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Nunito', sans-serif"
              }
            }}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            sx={{ 
              '& .MuiInputLabel-root': {
                fontFamily: "'Nunito', sans-serif"
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Nunito', sans-serif"
              }
            }}
          />
        </Box>
        
        {escrowBalance !== null && (
          <Paper sx={{ 
            p: 2,
            mb: 3,
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}>
            <Typography color="text.secondary" sx={{ fontFamily: "'Nunito', sans-serif" }}>
              Current Escrow Balance
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: "'Bungee', cursive" }}>
              {escrowBalance.toFixed(2)} {selectedToken.toUpperCase()}
            </Typography>
          </Paper>
        )}
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleWithdraw}
          disabled={processing || !amount || !recipientAddress}
          startIcon={processing ? <Loader style={{ width: 16, height: 16 }} /> : <Download style={{ width: 16, height: 16 }} />}
          sx={{ 
            py: 1.5,
            fontFamily: "'Bungee', cursive"
          }}
        >
          {processing ? 'Processing...' : 'Withdraw'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TokenWithdrawal;
