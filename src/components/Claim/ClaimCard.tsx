
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { Coins, History, ChevronRight, Loader } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

const ClaimCard: React.FC = () => {
  const { claimableAmount, nfts, claim } = useUser();
  const [claiming, setClaiming] = React.useState(false);
  const navigate = useNavigate();
  
  const eligibleCount = nfts.filter(nft => nft.isEligible).length;
  
  const handleClaim = async () => {
    if (claimableAmount <= 0) return;
    
    setClaiming(true);
    try {
      await claim();
    } finally {
      setClaiming(false);
    }
  };
  
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
            <div className="text-4xl font-bold">{claimableAmount} APT</div>
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
            <span className="font-medium">2 APT per NFT</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Eligible NFTs:</span>
            <span className="font-medium">{eligibleCount} NFT{eligibleCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Claim period:</span>
            <span className="font-medium">30 days lock after claim</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total claimable:</span>
            <span className="font-bold">{claimableAmount} APT</span>
          </div>
          
          <Button 
            onClick={handleClaim}
            disabled={claimableAmount <= 0 || claiming}
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
          
          {claimableAmount <= 0 && (
            <p className="text-xs text-muted-foreground text-center">
              You don't have any rewards to claim at this time
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;
