
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { Coins, History, ChevronRight, Loader, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';
import { supabase } from '@/integrations/supabase/client';

// Fixed payout amount per NFT
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
    try {
      await claim();
    } finally {
      setClaiming(false);
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
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="bg-muted p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Claimable Rewards</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-sm"
            onClick={() => navigate('/dashboard/history')}
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">{formattedClaimableAmount} {payoutToken}</div>
            <div className="text-sm text-muted-foreground mt-1">
              From {eligibleCount} eligible NFT{eligibleCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Reward rate:</span>
            {isLoading ? (
              <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <span className="font-medium">{FIXED_PAYOUT_PER_NFT.toFixed(2)} {payoutToken} per NFT</span>
            )}
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Collection:</span>
            <span className="font-medium">{NFT_COLLECTION_NAME}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Eligible NFTs:</span>
            <span className="font-medium">{eligibleCount} NFT{eligibleCount !== 1 ? 's' : ''}</span>
          </div>
          
          {lockedCount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Locked NFTs:</span>
              <span className="font-medium">{lockedCount} NFT{lockedCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {nextUnlock && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Next unlock:</span>
              <span className="font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1 text-amber-400" />
                {nextUnlock.toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Claim period:</span>
            <span className="font-medium">30 days lock after claim</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total claimable:</span>
            <span className="font-bold">{formattedClaimableAmount} {payoutToken}</span>
          </div>
          
          <Button 
            onClick={handleClaim}
            disabled={claimableAmount <= 0 || claiming || !isVerified}
            className="w-full"
            size="lg"
          >
            {claiming ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Claim Now
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
          
          {claimableAmount <= 0 ? (
            <p className="text-xs text-muted-foreground text-center">
              You don't have any rewards to claim at this time
            </p>
          ) : !isVerified ? (
            <p className="text-xs text-destructive text-center">
              Please verify your email before claiming rewards
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;
