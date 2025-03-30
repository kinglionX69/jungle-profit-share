
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

const MockDataAlert: React.FC = () => {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4 mr-2" />
      <AlertTitle>Using Sample Data</AlertTitle>
      <AlertDescription>
        <p>We couldn't find any real NFTs in your wallet from the {NFT_COLLECTION_NAME} collection.</p>
        <p className="mt-1 text-sm">If you believe this is an error, please check your wallet connection and make sure you own NFTs from this collection.</p>
      </AlertDescription>
    </Alert>
  );
};

export default MockDataAlert;
