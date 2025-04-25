import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/api/adminApi";
import { upsertUser } from "@/api/userApi";

/**
 * Checks if a specific wallet is installed in the browser.
 * Currently only checks for Petra wallet.
 * 
 * @param walletName - The name of the wallet to check
 * @returns boolean indicating if the wallet is installed
 */
export const checkWalletInstalled = (walletName: string): boolean => {
  const walletNameLower = walletName.toLowerCase();
  
  if (typeof window === 'undefined') return false;
  
  if (walletNameLower === 'petra') {
    return !!window.petra;
  }
  
  return false;
};

/**
 * Handles the successful connection of a wallet.
 * Updates Supabase headers, creates/updates user record, and checks admin status.
 * 
 * @param walletAddress - The connected wallet's address
 * @param walletName - The name of the connected wallet
 * @returns Object containing admin status
 */
export const handleSuccessfulConnection = async (
  walletAddress: string, 
  walletName: string
): Promise<{ adminStatus: boolean }> => {
  try {
    // Update Supabase headers before inserting user
    updateSupabaseHeaders(walletAddress);
    
    // Insert user in database
    const userCreated = await upsertUser(walletAddress);
    if (!userCreated) {
      console.warn("Failed to create/update user record in database");
    }
    
    // Check if the wallet is an admin
    const adminStatus = await checkIsAdmin(walletAddress);
    
    return { adminStatus };
  } catch (error) {
    console.error("Error during wallet connection:", error);
    return { adminStatus: false };
  }
};

/**
 * Signs and submits a transaction using the connected wallet.
 * 
 * @param transaction - The transaction payload to sign
 * @param address - The wallet address
 * @param connected - Whether the wallet is connected
 * @returns The signed transaction response
 * @throws Error if wallet is not connected or transaction signing fails
 */
export const signTransaction = async (
  transaction: any, 
  address: string | null, 
  connected: boolean
): Promise<any> => {
  if (!connected || !address) {
    toast.error("Wallet not connected");
    throw new Error("Wallet not connected");
  }
  
  try {
    if (!window.petra) {
      throw new Error("Petra wallet not installed");
    }
    
    return await window.petra.signAndSubmitTransaction(transaction);
  } catch (error: any) {
    console.error("Transaction signing error:", error);
    toast.error(error.message || "Failed to sign transaction");
    throw error;
  }
};

/**
 * Updates Supabase headers with the wallet address for authentication.
 * 
 * @param address - The wallet address to use for authentication
 */
export const updateSupabaseHeaders = (address: string | null): void => {
  if (address) {
    supabase.auth.setSession({
      access_token: address,
      refresh_token: address
    });
  }
};
