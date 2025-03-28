
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    
    console.log("Starting send-verification-email function");
    
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const requestData = await req.json();
    const { email, walletAddress } = requestData;

    console.log(`Processing request for email: ${email}, wallet: ${walletAddress}`);

    if (!email || !walletAddress) {
      console.error("Missing required fields", { email, walletAddress });
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
    console.log(`Generated OTP: ${otp} for ${email}`);
    
    // For development/test tracking, we'll always return the OTP in the response
    let emailSent = false;
    let emailResult = null;
    
    try {
      // Send actual email with the OTP using Resend
      console.log("Attempting to send email via Resend");
      
      emailResult = await resend.emails.send({
        from: "PLS Pride Share <onboarding@resend.dev>",
        to: email,
        subject: "Verify your email for Proud Lion Studios Pride Share",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email</h2>
            <p>Hello,</p>
            <p>Thank you for using Proud Lion Studios Pride Share. Please use the verification code below to verify your email address:</p>
            <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 20px 0;">
              <strong>${otp}</strong>
            </div>
            <p>This code will expire in 30 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <p>Best regards,<br>The Proud Lion Studios Team</p>
          </div>
        `,
      });
      
      console.log("Email send attempt response:", emailResult);
      emailSent = true;
    } catch (emailError) {
      // Log the error but don't fail the function - we'll still return the OTP for testing
      console.error("Error sending email via Resend:", emailError);
      
      // In the case of Resend test mode limitations, we continue with the OTP for testing
      console.log("Resend error detected. Proceeding without actual email delivery for testing purposes.");
    }

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: emailSent ? "Verification code sent" : "Verification code generated (email not sent in test mode)",
        otp: otp, // Always include the OTP to support test mode
        testMode: !emailSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
