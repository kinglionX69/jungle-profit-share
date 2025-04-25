import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Divider, 
  Card, 
  CardContent,
  CircularProgress
} from '@mui/material';
import { Coins, History, ChevronRight, Loader, Clock } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FIXED_PAYOUT_PER_NFT = 0.1;

const ClaimCard: React.FC = () => {
  const { claimableAmount, nfts, claim, isVerified } = useUser();
  const [claiming, setClaiming] = useState(false);
  const [payoutToken, setPayoutToken] = useState("APT");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const eligibleCount = nfts.filter(nft => nft.isEligible).length;
  const lockedCount = nfts.filter(nft => nft.isLocked).length;
  
  useEffect(() => {
    const fetchPayoutConfig = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('token_payouts')
          .select('token_name')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching token type:", error);
          setPayoutToken("APT");
        } else if (data) {
          setPayoutToken(data.token_name || "APT");
        } else {
          setPayoutToken("APT");
        }
      } catch (error) {
        console.error("Error fetching payout configuration:", error);
        setPayoutToken("APT");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayoutConfig();
  }, []);
  
  const handleClaim = async () => {
    if (claimableAmount <= 0 || !isVerified) return;
    
    setClaiming(true);
    toast.loading("Processing your claim. This may take a few moments...");
    
    try {
      await claim();
      // After successful claim, show a more detailed success message
      toast.success(`Successfully claimed ${claimableAmount.toFixed(2)} ${payoutToken} to your wallet!`, {
        description: "Check your wallet for the transferred tokens."
      });
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error("Failed to process your claim", {
        description: "Please try again or contact support if the issue persists."
      });
    } finally {
      setClaiming(false);
      toast.dismiss();
    }
  };
  
  const getNextUnlockDate = () => {
    const lockedNfts = nfts.filter(nft => nft.isLocked && nft.unlockDate);
    if (lockedNfts.length === 0) return null;
    
    return lockedNfts
      .map(nft => nft.unlockDate)
      .filter(date => date !== undefined)
      .sort((a, b) => (a && b) ? a.getTime() - b.getTime() : 0)[0];
  };
  
  const nextUnlock = getNextUnlockDate();
  
  // Format the claimable amount to always show 2 decimal places
  const formattedClaimableAmount = claimableAmount.toFixed(2);
  
  return (
    <Card sx={{ 
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        bgcolor: 'background.default',
        p: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Claimable Rewards
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/dashboard/history')}
            startIcon={<History style={{ width: 16, height: 16 }} />}
            sx={{ 
              color: 'text.secondary',
              fontFamily: "'Nunito', sans-serif"
            }}
          >
            History
          </Button>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 2
        }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontFamily: "'Bungee', cursive",
                fontWeight: 700
              }}
            >
              {formattedClaimableAmount} {payoutToken}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mt: 1,
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              From {eligibleCount} eligible NFT{eligibleCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'primary.light', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <Coins style={{ width: 32, height: 32, color: 'primary.main' }} />
          </Box>
        </Box>
      </Box>
      
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Reward rate:
            </Typography>
            {isLoading ? (
              <Box sx={{ width: 64, height: 16, bgcolor: 'background.default', borderRadius: 1 }} />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {FIXED_PAYOUT_PER_NFT.toFixed(2)} {payoutToken} per NFT
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Collection:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {NFT_COLLECTION_NAME}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Eligible NFTs:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {eligibleCount} NFT{eligibleCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          {lockedCount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Locked NFTs:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {lockedCount} NFT{lockedCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          
          {nextUnlock && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Next unlock:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock style={{ width: 12, height: 12, color: 'warning.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {nextUnlock.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Claim period:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              30 days lock after claim
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Total claimable:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formattedClaimableAmount} {payoutToken}
            </Typography>
          </Box>
          
          <Button 
            variant="contained"
            onClick={handleClaim}
            disabled={claimableAmount <= 0 || claiming || !isVerified}
            fullWidth
            size="large"
            sx={{ 
              mt: 2,
              py: 1.5,
              fontFamily: "'Bungee', cursive"
            }}
          >
            {claiming ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              <>
                Claim Now
                <ChevronRight style={{ marginLeft: 4, width: 16, height: 16 }} />
              </>
            )}
          </Button>
          
          {claimableAmount <= 0 ? (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center"
              sx={{ fontFamily: "'Nunito', sans-serif" }}
            >
              You don't have any rewards to claim at this time
            </Typography>
          ) : !isVerified ? (
            <Typography 
              variant="body2" 
              color="error.main" 
              align="center"
              sx={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Please verify your email before claiming rewards
            </Typography>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClaimCard;
