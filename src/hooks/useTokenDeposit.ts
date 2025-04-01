
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@/context/WalletContext';
import { depositTokensTransaction } from '@/utils/aptos/transactionUtils';
import { IS_TESTNET, SUPPORTED_TOKENS, TESTNET_ESCROW_WALLET, MAINNET_ESCROW_WALLET } from '@/utils/aptos/constants';

// Fixed payout amount per NFT
const FIXED_PAYOUT_PER_NFT = 0.1;

export const useTokenDeposit = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('apt');
  const [processing, setProcessing] = useState(false);
  const { address, signTransaction, isAdmin } = useWallet();
  
  // Testnet only supports APT
  const handleTokenChange = (value: string) => {
    if (IS_TESTNET && value !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    setSelectedToken(value);
  };
  
  const updateTokenPayout = async (walletAddress: string, tokenName: string): Promise<boolean> => {
    console.log("Attempting to update token payout:", { walletAddress, tokenName, payoutPerNft: FIXED_PAYOUT_PER_NFT });
    
    try {
      // First try using the edge function
      console.log("Calling update-token-payouts edge function");
      const response = await supabase.functions.invoke('update-token-payouts', {
        body: { 
          walletAddress, 
          tokenName, 
          payoutPerNft: FIXED_PAYOUT_PER_NFT 
        }
      });
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        console.log("Edge function full response:", response);
        
        // If the edge function fails, try direct insertion with admin check as fallback
        console.log("Attempting fallback: direct database insertion with admin check");
        
        // First verify the wallet is admin
        const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
          'is_admin',
          { wallet_address: walletAddress }
        );
        
        if (adminCheckError || !isAdmin) {
          console.error("Admin check error or not admin:", { adminCheckError, isAdmin });
          throw new Error("Only admins can update token payouts");
        }
        
        // Then try direct insertion
        const { error: insertError } = await supabase
          .from('token_payouts')
          .insert({
            token_name: tokenName.toUpperCase(),
            payout_per_nft: FIXED_PAYOUT_PER_NFT,
            created_by: walletAddress
          });
          
        if (insertError) {
          console.error("Error inserting token payout:", insertError);
          throw new Error(`Database error: ${insertError.message}`);
        }
      } else {
        console.log("Edge function successful response:", response);
      }
      
      toast.success(`Payout configuration updated to ${FIXED_PAYOUT_PER_NFT} ${tokenName.toUpperCase()} per NFT`);
      return true;
    } catch (error) {
      console.error("Error updating token payout:", error);
      toast.error(`Failed to update payout configuration: ${error.message || "Unknown error"}`);
      return false;
    }
  };
  
  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only admins can deposit tokens");
      return;
    }
    
    // Testnet validation
    if (IS_TESTNET && selectedToken !== 'apt') {
      toast.error("Only APT tokens are supported on testnet");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Get the correct token type
      const tokenType = selectedToken === 'apt' ? SUPPORTED_TOKENS.APT : SUPPORTED_TOKENS.EMOJICOIN;
      const amountValue = Number(amount);
      
      console.log(`Depositing ${amountValue} ${selectedToken.toUpperCase()} with fixed payout ${FIXED_PAYOUT_PER_NFT} per NFT`);
      
      // Display the escrow wallet address being used
      const escrowWallet = IS_TESTNET ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
      console.log(`Using escrow wallet: ${escrowWallet}`);
      
      // Execute the blockchain transaction
      if (!signTransaction) {
        throw new Error("Wallet signing function not available");
      }
      
      toast.loading("Processing blockchain transaction...");
      
      const txResult = await depositTokensTransaction(
        address,
        tokenType,
        amountValue,
        FIXED_PAYOUT_PER_NFT,
        signTransaction
      );
      
      toast.dismiss();
      
      if (txResult.success) {
        console.log("Transaction succeeded, updating database");
        toast.success(`Tokens deposited successfully!${txResult.transactionHash ? ` Transaction: ${txResult.transactionHash}` : ''}`);
        
        // After successful blockchain transaction, update the payout in the database
        toast.loading("Updating token payout in database...");
        
        console.log("Calling updateTokenPayout with:", { 
          address, 
          selectedToken: selectedToken.toUpperCase()
        });
        
        const dbResult = await updateTokenPayout(
          address,
          selectedToken.toUpperCase()
        );
        
        toast.dismiss();
        
        if (dbResult) {
          console.log("Database update successful");
          setAmount('');
          toast.success("Deposit process completed successfully!");
        } else {
          console.error("Database update failed");
          toast.error("Token deposit successful, but failed to update payout configuration");
        }
      } else {
        console.error("Transaction failed:", txResult.error);
        toast.error(txResult.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error depositing tokens:", error);
      let errorMessage = "Failed to deposit tokens";
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Account hasn't registered")) {
          errorMessage = "Token registration required. Please try again.";
        } else if (error.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to complete the transaction";
        } else if (error.message.includes("rejected")) {
          errorMessage = "Transaction rejected by wallet";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  return {
    amount,
    setAmount,
    selectedToken,
    handleTokenChange,
    processing,
    handleDeposit,
    FIXED_PAYOUT_PER_NFT
  };
};
