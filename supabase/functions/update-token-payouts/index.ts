
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("update-token-payouts function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { walletAddress, tokenName, payoutPerNft } = await req.json();
    
    console.log("Request parameters:", { walletAddress, tokenName, payoutPerNft });
    
    if (!walletAddress || !tokenName || payoutPerNft === undefined) {
      console.error("Missing required parameters:", { walletAddress, tokenName, payoutPerNft });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a Supabase client with the Supabase service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log("Supabase URL available:", !!supabaseUrl);
    console.log("Supabase Service Role Key available:", !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if wallet is admin
    console.log("Checking if wallet is admin:", walletAddress);
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc(
      'is_admin',
      { wallet_address: walletAddress }
    );
    
    console.log("Admin check result:", { isAdmin, error: adminCheckError });
    
    if (adminCheckError) {
      console.error("Admin check error:", adminCheckError);
      return new Response(
        JSON.stringify({ error: `Admin check failed: ${adminCheckError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!isAdmin) {
      console.error("Non-admin wallet attempted operation:", walletAddress);
      return new Response(
        JSON.stringify({ error: 'Only admins can update token payouts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // Insert the token payout record using the service role (bypasses RLS)
    console.log("Inserting token payout record:", { 
      token_name: tokenName.toUpperCase(), 
      payout_per_nft: payoutPerNft,
      created_by: walletAddress 
    });
    
    const { error: insertError } = await supabaseAdmin
      .from('token_payouts')
      .insert({
        token_name: tokenName.toUpperCase(),
        payout_per_nft: payoutPerNft,
        created_by: walletAddress
      });
    
    if (insertError) {
      console.error("Error inserting token payout:", insertError);
      return new Response(
        JSON.stringify({ error: `Failed to update token payout: ${insertError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log("Token payout inserted successfully");
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
