
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import WalletConnect from '@/components/Auth/WalletConnect';
import EmailVerification from '@/components/Auth/EmailVerification';
import NFTGrid from '@/components/NFT/NFTGrid';
import ClaimCard from '@/components/Claim/ClaimCard';
import ClaimHistory from '@/components/Claim/ClaimHistory';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IS_TESTNET } from '@/utils/aptos/constants';

const Dashboard = () => {
  const { connected, address } = useWallet();
  const { isVerified, nfts, fetchUserData, loadingNfts } = useUser();
  const navigate = useNavigate();
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  const handleRefreshNFTs = () => {
    if (fetchUserData) {
      toast.info("Refreshing NFT data...");
      fetchUserData();
    }
  };
  
  if (!connected) {
    return (
      <>
        <Header />
        <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <WalletConnect />
        </PageContainer>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              View your eligible NFTs and claim your rewards
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshNFTs} disabled={loadingNfts}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingNfts ? 'animate-spin' : ''}`} />
            {loadingNfts ? 'Refreshing...' : 'Refresh NFTs'}
          </Button>
        </div>
        
        {IS_TESTNET && (
          <Alert className="mb-4 bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Testnet Mode</AlertTitle>
            <AlertDescription className="text-amber-400/80">
              Application is running in testnet mode. NFTs and transactions will be on the Aptos testnet.
            </AlertDescription>
          </Alert>
        )}
        
        {!isVerified && (
          <div className="mb-8 max-w-md">
            <EmailVerification />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-medium mb-4">Eligible NFTs for Claim</h2>
            <NFTGrid filterEligible={true} />
          </div>
          
          <div>
            <ClaimCard />
          </div>
        </div>
        
        <div className="mt-10">
          <ClaimHistory />
        </div>
      </PageContainer>
    </>
  );
};

export default Dashboard;
