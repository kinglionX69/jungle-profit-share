
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

    console.log("Starting verify-email function");
    
    const requestData = await req.json();
    const { email, otp, walletAddress } = requestData;

    console.log(`Processing verification: Email: ${email}, OTP: ${otp}, Wallet: ${walletAddress}`);

    // Validate required fields
    if (!otp || !email || !walletAddress) {
      console.error("Missing required fields", { email, otp, walletAddress });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check that OTP is a 6-digit number
    if (!/^\d{6}$/.test(otp)) {
      console.error("Invalid OTP format", { otp });
      return new Response(
        JSON.stringify({ error: "Invalid OTP format. Must be 6 digits" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // In a real implementation, we would validate the OTP against a stored value
    // For now, we'll simulate validation by accepting any 6-digit code
    // In production, you would store the OTP in a table with an expiration time

    // Update user in the database as verified
    console.log(`Updating user ${walletAddress} as verified`);
    const { data, error } = await supabase
      .from("users")
      .update({ 
        email: email,
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("wallet_address", walletAddress)
      .select();

    if (error) {
      console.error("Error updating user:", error);
      return new Response(
        JSON.stringify({ error: "Failed to verify email", details: error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Email verification successful");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully", 
        data 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
