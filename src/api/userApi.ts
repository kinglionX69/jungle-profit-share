
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Updates or creates a user record in the database
 * @param walletAddress The wallet address of the user
 * @param email Optional email address
 * @param emailVerified Optional email verification status
 */
export const upsertUser = async (
  walletAddress: string,
  email?: string | null,
  emailVerified?: boolean
) => {
  try {
    console.log(`Upserting user: ${walletAddress}, email: ${email}, verified: ${emailVerified}`);
    
    // First check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking for existing user:", fetchError);
    }
    
    const userData = {
      wallet_address: walletAddress,
      email: email || (existingUser?.email || null),
      email_verified: emailVerified !== undefined ? emailVerified : (existingUser?.email_verified || false),
      updated_at: new Date().toISOString()
    };
    
    console.log("Upserting user data:", userData);
    
    // Use upsert operation which is more reliable
    const { error } = await supabase
      .from('users')
      .upsert(
        { ...userData },
        { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false
        }
      );
    
    if (error) {
      console.error("Error upserting user:", error);
      return false;
    }
    
    console.log("User upserted successfully");
    return true;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    return false;
  }
};

/**
 * Gets user data from the database
 * @param walletAddress The wallet address of the user
 */
export const getUserData = async (walletAddress: string) => {
  try {
    console.log(`Getting user data for wallet: ${walletAddress}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
    
    console.log("User data retrieved:", data);
    return data;
  } catch (error) {
    console.error("Failed to get user data:", error);
    return null;
  }
};

/**
 * Updates a user's email address
 * @param walletAddress The wallet address of the user
 * @param email The email address to save
 */
export const updateUserEmail = async (
  walletAddress: string,
  email: string
): Promise<boolean> => {
  try {
    console.log(`Updating email for ${walletAddress} to ${email}`);
    
    const { error } = await supabase
      .from("users")
      .update({ 
        email: email,
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("wallet_address", walletAddress);

    if (error) {
      console.error("Error updating user email:", error);
      return false;
    }
    
    console.log("Email updated successfully");
    return true;
  } catch (error: any) {
    console.error("Error updating email:", error);
    return false;
  }
};
