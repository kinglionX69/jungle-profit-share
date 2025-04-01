
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { walletAddress, tokenName, payoutPerNft } = await req.json();
    
    if (!walletAddress || !tokenName || payoutPerNft === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a Supabase client with the Supabase service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Check if wallet is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc(
      'is_admin',
      { wallet_address: walletAddress }
    );
    
    if (adminCheckError || !isAdmin) {
      console.error("Admin check error:", adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Only admins can update token payouts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    // Insert the token payout record using the service role (bypasses RLS)
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
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
