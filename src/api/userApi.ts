
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
    const { error } = await supabase
      .from('users')
      .upsert({
        wallet_address: walletAddress,
        email: email || null,
        email_verified: emailVerified || false,
        updated_at: new Date().toISOString()
      });

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
 * Sends a verification email with an OTP code
 * @param walletAddress The wallet address of the user
 * @param email The email to verify
 */
export const sendVerificationEmail = async (
  walletAddress: string,
  email: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-verification-email', {
      body: { walletAddress, email }
    });
    
    if (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email");
      return null;
    }
    
    if (data.success) {
      toast.success("Verification code sent to your email");
      // If we're in development, the OTP will be returned for easier testing
      return data.otp || null;
    } else {
      toast.error(data.message || "Failed to send verification email");
      return null;
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    toast.error("Failed to send verification email");
    return null;
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
    const { data, error } = await supabase.functions.invoke('verify-email', {
      body: { walletAddress, email, otp }
    });
    
    if (error) {
      console.error("Error verifying email:", error);
      toast.error("Failed to verify email");
      return false;
    }
    
    if (data.success) {
      toast.success("Email verified successfully!");
      return true;
    } else {
      toast.error(data.message || "Failed to verify email");
      return false;
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    toast.error("Failed to verify email");
    return false;
  }
};
