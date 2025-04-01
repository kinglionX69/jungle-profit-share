
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AptosClient, AptosAccount, Types } from "npm:aptos@1.20.0";

// CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const TESTNET_NODE_URL = "https://testnet.aptoslabs.com";
const MAINNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com";
const TESTNET_ESCROW_WALLET = "0x5af503b5c379bd69f32dac9bcbae33f5a8941a4bb98d6f7341bb6fbdcb496d69";
const MAINNET_ESCROW_WALLET = "0x9a5d795152a50243398329387026ef55886ee6c10f3bfa7c454e8487fe62c5e2";

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }
  
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  
  const bytes = new Uint8Array(hexString.length / 2);
  
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i/2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  
  return bytes;
}

interface WithdrawalRequest {
  tokenType: string;
  amount: number;
  recipientAddress: string;
  network: 'testnet' | 'mainnet';
  adminWalletAddress: string; // For verification only
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is an admin request
    const { tokenType, amount, recipientAddress, network, adminWalletAddress } = await req.json() as WithdrawalRequest;
    
    console.log(`Processing withdrawal request from admin ${adminWalletAddress}`);
    console.log(`Withdrawing ${amount} of ${tokenType} to ${recipientAddress} on ${network}`);
    
    // Select the right node URL based on network
    const nodeUrl = network === 'testnet' ? TESTNET_NODE_URL : MAINNET_NODE_URL;
    const client = new AptosClient(nodeUrl);
    
    // Get the escrow wallet address based on network
    const escrowWalletAddress = network === 'testnet' ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    
    // Get private key from environment
    const privateKeyHex = Deno.env.get("ESCROW_PRIVATE_KEY");
    if (!privateKeyHex) {
      throw new Error("Escrow private key not found in environment");
    }
    
    // Create escrow account from private key
    const privateKeyBytes = hexToUint8Array(privateKeyHex);
    const escrowAccount = new AptosAccount(privateKeyBytes);
    
    // Verify the account address matches the expected escrow wallet
    const escrowAddress = escrowAccount.address().toString();
    if (escrowAddress !== escrowWalletAddress) {
      console.error(`Escrow address mismatch: ${escrowAddress} vs ${escrowWalletAddress}`);
      throw new Error("Escrow private key does not match configured escrow wallet address");
    }
    
    // Calculate the amount in smallest units (8 decimal places for APT)
    const amountInSmallestUnits = Math.floor(amount * 100000000);
    
    // Create the transaction payload
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: [tokenType],
      arguments: [
        recipientAddress,
        amountInSmallestUnits.toString()
      ]
    };
    
    console.log("Creating withdrawal transaction");
    
    // Generate, sign, and submit the transaction
    const rawTxn = await client.generateTransaction(escrowAccount.address(), payload);
    const signedTxn = await client.signTransaction(escrowAccount, rawTxn);
    const pendingTxn = await client.submitTransaction(signedTxn);
    
    console.log("Waiting for transaction confirmation");
    // Wait for transaction to complete
    const txnResult = await client.waitForTransaction(pendingTxn.hash);
    
    console.log("Withdrawal transaction completed:", txnResult.hash);
    
    return new Response(
      JSON.stringify({
        success: true, 
        transactionHash: txnResult.hash,
        message: "Withdrawal successful"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in withdraw-from-escrow function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
