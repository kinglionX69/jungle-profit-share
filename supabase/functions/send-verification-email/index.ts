
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, walletAddress } = await req.json();

    if (!email || !walletAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the OTP in the database (in a real implementation)
    // For demo purposes, we're just simulating email sending
    console.log(`Would send OTP ${otp} to ${email} for wallet ${walletAddress}`);

    // In a real implementation, you would send the actual email with the OTP
    // using a service like SendGrid, Resend, or AWS SES
    
    // Update the user with the new email (but not verified yet)
    const { error } = await supabase
      .from("users")
      .update({ 
        email: email,
        email_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq("wallet_address", walletAddress);

    if (error) {
      console.error("Error updating user email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // For demo purposes, always return the OTP in the response
    // In production, the OTP would only be sent via email
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent", 
        otp: otp // Only for demo - remove in production!
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
