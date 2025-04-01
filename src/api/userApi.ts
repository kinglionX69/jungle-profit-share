
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
    
    // Use service role client for operations requiring elevated permissions
    // If the user doesn't exist, insert with elevated permissions
    if (!existingUser) {
      const { error } = await supabase
        .from('users')
        .insert([userData]);
      
      if (error) {
        console.error("Error inserting user:", error);
        throw error;
      }
    } else {
      // If the user exists, update their record
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('wallet_address', walletAddress);
        
      if (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    }
    
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
    
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
    
    return true;
  } catch (error: any) {
    console.error("Error updating email:", error);
    return false;
  }
};
