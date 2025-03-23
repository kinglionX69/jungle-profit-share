
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/context/UserContext';

const Dashboard = () => {
  const { connected } = useWallet();
  const { isVerified, nfts, email } = useUser();
  const navigate = useNavigate();
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);
  
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View your NFTs and claim your rewards
          </p>
        </div>
        
        {!isVerified && (
          <div className="mb-8 max-w-md">
            <EmailVerification />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <Tabs defaultValue="eligible" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="eligible">Eligible NFTs</TabsTrigger>
                <TabsTrigger value="all">All NFTs</TabsTrigger>
              </TabsList>
              <TabsContent value="eligible" className="space-y-6">
                <h2 className="text-xl font-medium">Eligible for Claim</h2>
                <NFTGrid />
              </TabsContent>
              <TabsContent value="all" className="space-y-6">
                <h2 className="text-xl font-medium">All Your NFTs</h2>
                <NFTGrid />
              </TabsContent>
            </Tabs>
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
