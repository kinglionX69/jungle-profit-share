
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import TokenDeposit from '@/components/Admin/TokenDeposit';
import ClaimStatistics from '@/components/Admin/ClaimStatistics';
import WalletBalance from '@/components/Admin/WalletBalance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const Admin = () => {
  const { connected, isAdmin } = useWallet();
  const navigate = useNavigate();
  
  // Redirect if not connected or not admin
  useEffect(() => {
    if (!connected) {
      navigate('/');
    } else if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [connected, isAdmin, navigate]);
  
  if (!connected || !isAdmin) {
    return (
      <>
        <Header />
        <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              This page is only accessible to the admin wallet.
            </AlertDescription>
          </Alert>
        </PageContainer>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage token deposits and monitor claim activity
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <TokenDeposit />
          <WalletBalance />
        </div>
        
        <div className="mt-8">
          <ClaimStatistics />
        </div>
      </PageContainer>
    </>
  );
};

export default Admin;
