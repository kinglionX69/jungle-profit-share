
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/api/adminApi";
import { upsertUser } from "@/api/userApi";

// Check if a specific wallet is installed
export const checkWalletInstalled = (walletName: string): boolean => {
  const walletNameLower = walletName.toLowerCase();
  
  if (walletNameLower === 'petra') {
    return !!window.aptos;
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
  
  // Insert user in database
  await upsertUser(walletAddress);
  
  // Check if the wallet is an admin
  const adminStatus = await checkIsAdmin(walletAddress);
  
  toast.success(`${walletName} wallet connected!`);
  
  return { adminStatus };
};

// Sign a transaction
export const signTransaction = async (transaction: any, address: string | null, connected: boolean): Promise<any> => {
  if (!connected || !address) {
    toast.error("Wallet not connected");
    throw new Error("Wallet not connected");
  }
  
  try {
    if (window.aptos) {
      return await window.aptos.signAndSubmitTransaction(transaction);
    } else if (window.martian) {
      return await window.martian.signAndSubmitTransaction(transaction);
    } else {
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
    // Set the Authorization header for all future requests
    supabase.rest.headers = {
      ...supabase.rest.headers,
      "Authorization": `Bearer ${address}`
    };
    
    // For realtime subscriptions
    supabase.realtime.setAuth(address);
    
    console.log("Updated Supabase headers with wallet address:", address);
  } else {
    // Clear authorization if address is null
    if (supabase.rest.headers && "Authorization" in supabase.rest.headers) {
      delete supabase.rest.headers["Authorization"];
    }
    
    // Clear realtime auth
    supabase.realtime.setAuth(null);
    
    console.log("Cleared Supabase authorization headers");
  }
};
