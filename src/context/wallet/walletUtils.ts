
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/api/adminApi";
import { upsertUser } from "@/api/userApi";

// Check if a specific wallet is installed
export const checkWalletInstalled = (walletName: string): boolean => {
  const walletNameLower = walletName.toLowerCase();
  
  // Use window.aptos as a fallback for older implementations
  if (walletNameLower === 'petra') {
    return !!window.aptos || !!window.petra;
  } else if (walletNameLower === 'martian') {
    return !!window.martian;
  } else if (walletNameLower === 'pontem') {
    return !!window.pontem;
  } else if (walletNameLower === 'rise') {
    return !!window.rise;
  }
  
  return false;
};

// Handler for successful wallet connections
export const handleSuccessfulConnection = async (walletAddress: string, walletName: string) => {
  // Update Supabase headers before inserting user
  updateSupabaseHeaders(walletAddress);
  
  try {
    // Insert user in database
    const userCreated = await upsertUser(walletAddress);
    if (!userCreated) {
      console.warn("Failed to create/update user record in database");
    }
    
    // Check if the wallet is an admin
    const adminStatus = await checkIsAdmin(walletAddress);
    
    toast.success(`${walletName} wallet connected!`);
    
    return { adminStatus };
  } catch (error) {
    console.error("Error during wallet connection:", error);
    // Don't throw here, as we want to continue even if there's an error with user creation
    return { adminStatus: false };
  }
};

// Sign a transaction
export const signTransaction = async (transaction: any, address: string | null, connected: boolean): Promise<any> => {
  if (!connected || !address) {
    toast.error("Wallet not connected");
    throw new Error("Wallet not connected");
  }
  
  try {
    // Petra wallet - Support both legacy and new API
    if (window.petra) {
      console.log("Signing transaction with Petra wallet (new API)");
      return await window.petra.signAndSubmitTransaction(transaction);
    }
    else if (window.aptos) {
      console.log("Signing transaction with Petra wallet (legacy API)");
      return await window.aptos.signAndSubmitTransaction(transaction);
    } 
    // Martian wallet
    else if (window.martian) {
      console.log("Signing transaction with Martian wallet");
      return await window.martian.signAndSubmitTransaction(transaction);
    }
    // Pontem wallet
    else if (window.pontem) {
      console.log("Signing transaction with Pontem wallet");
      return await window.pontem.signAndSubmitTransaction(transaction);
    }
    // Rise wallet
    else if (window.rise) {
      console.log("Signing transaction with Rise wallet");
      return await window.rise.signAndSubmitTransaction(transaction);
    }
    else {
      throw new Error("No wallet provider available");
    }
  } catch (error: any) {
    console.error("Transaction signing error:", error);
    toast.error(error.message || "Failed to sign transaction");
    throw error;
  }
};

// Update Supabase headers with wallet address
export const updateSupabaseHeaders = (address: string | null) => {
  if (address) {
    // Set global auth for future requests
    supabase.auth.setSession({
      access_token: address,
      refresh_token: '',
    });
    
    console.log("Updated Supabase headers with wallet address:", address);
  } else {
    // Clear authorization if address is null
    supabase.auth.setSession({
      access_token: null,
      refresh_token: null,
    });
    
    console.log("Cleared Supabase authorization headers");
  }
};
