
import React, { useState } from 'react';
import { AlertCircle, Copy, ExternalLink, Sparkles, RefreshCw, HeartHandshake } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NFT_COLLECTION_NAME, APTOS_API, IS_TESTNET } from '@/utils/aptos/constants';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface NFTEmptyStateProps {
  filterEligible: boolean;
}

const NFTEmptyState: React.FC<NFTEmptyStateProps> = ({ filterEligible }) => {
  const { fetchUserData } = useUser();
  const { address } = useWallet();
  const [attemptingFix, setAttemptingFix] = useState(false);
  
  // Function to copy debug info to clipboard
  const copyDebugInfo = () => {
    const debugInfo = {
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      collection: NFT_COLLECTION_NAME,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      error: "No NFTs found",
      network: IS_TESTNET ? "testnet" : "mainnet",
      apiEndpoint: APTOS_API,
      walletAddress: address
    };
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => toast.success("Debug info copied to clipboard"))
      .catch(err => {
        console.error("Failed to copy debug info", err);
        toast.error("Failed to copy debug info");
      });
  };
  
  // Function to attempt automatic fixes
  const attemptFix = async () => {
    setAttemptingFix(true);
    toast.info("Attempting to fix NFT display issues...");
    
    try {
      // Refresh NFT data with force flag
      if (fetchUserData) {
        await fetchUserData();
      }
      
      toast.success("Refresh complete. Please check if your NFTs appear now.");
    } catch (error) {
      console.error("Error attempting fix:", error);
      toast.error("Failed to fix issues automatically");
    } finally {
      setAttemptingFix(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Alert variant="default">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>No NFTs Found</AlertTitle>
        <AlertDescription>
          {filterEligible ? 
            `We couldn't find any eligible NFTs for claiming. This could be because all your NFTs are currently locked or you don't own any NFTs from the ${NFT_COLLECTION_NAME} collection.` :
            `We couldn't find any ${NFT_COLLECTION_NAME} NFTs in your wallet. This could be due to:`}
          {!filterEligible && (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You don't own any NFTs from the {NFT_COLLECTION_NAME} collection</li>
              <li>There might be connection issues with the Aptos blockchain</li>
              <li>The wallet might not be properly connected</li>
              <li>The NFTs might be stored in a different format or standard</li>
            </ul>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="text-center py-8 border rounded-lg bg-card">
        <div className="flex justify-center mb-4">
          <HeartHandshake className="h-12 w-12 text-primary opacity-75" />
        </div>
        <h3 className="text-xl font-medium">We're Here to Help</h3>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Let's try to solve this together. Here are some steps you can take:
        </p>
        
        <Accordion type="single" collapsible className="max-w-lg mx-auto mt-6">
          <AccordionItem value="troubleshooting">
            <AccordionTrigger className="text-left px-4">Troubleshooting Steps</AccordionTrigger>
            <AccordionContent className="text-left px-6 pb-4">
              <ul className="text-sm space-y-3">
                <li className="flex items-start gap-2">
                  <div className="bg-muted rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium">Refresh the browser</p>
                    <p className="text-muted-foreground">Sometimes a simple refresh can fix connection issues.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-muted rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium">Check your wallet connection</p>
                    <p className="text-muted-foreground">Disconnect and reconnect your wallet.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-muted rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium">Verify network settings</p>
                    <p className="text-muted-foreground">Make sure your wallet is connected to the {IS_TESTNET ? "Aptos Testnet" : "Aptos Mainnet"}.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-muted rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium">Check NFT ownership</p>
                    <p className="text-muted-foreground">Verify on Aptos Explorer that you own NFTs in the {NFT_COLLECTION_NAME} collection.</p>
                  </div>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="technical-details">
            <AccordionTrigger className="text-left px-4">Technical Details</AccordionTrigger>
            <AccordionContent className="text-left px-6 pb-4 space-y-2 text-sm">
              <p><strong>Wallet Address:</strong> {address || 'Not connected'}</p>
              <p><strong>Network:</strong> {IS_TESTNET ? "Testnet" : "Mainnet"}</p>
              <p><strong>Collection:</strong> {NFT_COLLECTION_NAME}</p>
              <p><strong>API Endpoint:</strong> {APTOS_API.substring(0, 30)}...</p>
              <p><strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button 
            variant="default" 
            className="flex items-center"
            onClick={attemptFix}
            disabled={attemptingFix}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {attemptingFix ? "Attempting Fix..." : "Attempt Automatic Fix"}
          </Button>
          
          <Button 
            variant="outline"
            className="flex items-center"
            onClick={() => {
              if (fetchUserData) {
                toast.info("Refreshing NFT data...");
                fetchUserData();
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh NFTs
          </Button>
          
          <Button variant="outline" onClick={copyDebugInfo} className="flex items-center">
            <Copy className="h-4 w-4 mr-2" />
            Copy Debug Info
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('https://explorer.aptoslabs.com/', '_blank')}
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Aptos Explorer
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          If none of these solutions work, try using a different wallet provider or browser.
        </p>
      </div>
    </div>
  );
};

export default NFTEmptyState;
