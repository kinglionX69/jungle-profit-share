
import React, { useEffect, useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { connected, address } = useWallet();
  const { isVerified, nfts, email } = useUser();
  const navigate = useNavigate();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);
  
  useEffect(() => {
    // Check for query parameter to show debug info
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      setShowDebugInfo(true);
    }
    
    // Log debug info
    if (connected) {
      console.log("Dashboard debug info:");
      console.log("- Wallet connected:", connected);
      console.log("- Wallet address:", address);
      console.log("- Email verified:", isVerified);
      console.log("- NFTs loaded:", nfts.length);
      console.log("- NFTs:", nfts);
    }
  }, [connected, address, isVerified, nfts]);
  
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
        
        {showDebugInfo && (
          <Alert className="mb-8" variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Debug Information</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p><strong>Wallet Address:</strong> {address}</p>
                <p><strong>Email:</strong> {email || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {isVerified ? 'Yes' : 'No'}</p>
                <p><strong>NFTs Loaded:</strong> {nfts.length}</p>
              </div>
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
