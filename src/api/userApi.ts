
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
    
    // If user exists, update it; otherwise insert new record
    const operation = existingUser ? 
      supabase.from('users').update(userData).eq('wallet_address', walletAddress) :
      supabase.from('users').insert([userData]);
      
    const { error } = await operation;

    if (error) {
      console.error("Error upserting user:", error);
      throw error;
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
 * Response from the verification email function
 */
interface VerificationEmailResponse {
  success?: boolean;
  message?: string;
  otp?: string;
  testMode?: boolean;
  error?: string;
}

/**
 * Sends a verification email with an OTP code
 * @param walletAddress The wallet address of the user
 * @param email The email to verify
 */
export const sendVerificationEmail = async (
  walletAddress: string,
  email: string
): Promise<VerificationEmailResponse | null> => {
  try {
    console.log(`Calling send-verification-email for ${email}, wallet: ${walletAddress}`);
    
    const { data, error } = await supabase.functions.invoke('send-verification-email', {
      body: { email, walletAddress }
    });
    
    if (error) {
      console.error("Error invoking send-verification-email function:", error);
      toast.error("Failed to send verification email");
      return { success: false, error: error.message };
    }
    
    console.log("Response from send-verification-email:", data);
    
    // The function will always return the OTP for test mode
    return data as VerificationEmailResponse;
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    toast.error("Failed to send verification email");
    return { success: false, error: error.message };
  }
};

/**
 * Verifies a user's email with an OTP code
 * @param walletAddress The wallet address of the user
 * @param email The email to verify
 * @param otp The OTP code
 */
export const verifyEmail = async (
  walletAddress: string,
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    console.log(`Calling verify-email for ${email}, wallet: ${walletAddress}, OTP: ${otp}`);
    
    const { data, error } = await supabase.functions.invoke('verify-email', {
      body: { walletAddress, email, otp }
    });
    
    if (error) {
      console.error("Error invoking verify-email function:", error);
      toast.error("Failed to verify email");
      return false;
    }
    
    console.log("Response from verify-email:", data);
    
    if (data && data.success) {
      toast.success("Email verified successfully!");
      return true;
    } else {
      console.error("Email verification failed:", data?.error || "Unknown error");
      toast.error(data?.message || "Failed to verify email");
      return false;
    }
  } catch (error: any) {
    console.error("Error verifying email:", error);
    toast.error("Failed to verify email: " + (error.message || "Unknown error"));
    return false;
  }
};
