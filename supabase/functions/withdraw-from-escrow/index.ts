
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  AptosAccount, 
  Aptos, 
  AptosConfig, 
  Network, 
  AccountAddress, 
  Ed25519PrivateKey 
} from "npm:@aptos-labs/ts-sdk@1.3.0";

// CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const TESTNET_ESCROW_WALLET = "0x5af503b5c379bd69f32dac9bcbae33f5a8941a4bb98d6f7341bb6fbdcb496d69";
const MAINNET_ESCROW_WALLET = "0x9a5d795152a50243398329387026ef55886ee6c10f3bfa7c454e8487fe62c5e2";

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
    // Parse the request body
    const { tokenType, amount, recipientAddress, network, adminWalletAddress } = await req.json() as WithdrawalRequest;
    
    console.log(`Processing withdrawal request from admin ${adminWalletAddress}`);
    console.log(`Withdrawing ${amount} of ${tokenType} to ${recipientAddress} on ${network}`);
    
    // Select the right network based on the request
    const aptosConfig = new AptosConfig({ 
      network: network === 'testnet' ? Network.TESTNET : Network.MAINNET 
    });
    const aptos = new Aptos(aptosConfig);
    
    // Get the escrow wallet address based on network
    const escrowWalletAddress = network === 'testnet' ? TESTNET_ESCROW_WALLET : MAINNET_ESCROW_WALLET;
    
    // Get private key from environment
    const privateKeyHex = Deno.env.get("ESCROW_PRIVATE_KEY");
    if (!privateKeyHex) {
      throw new Error("Escrow private key not found in environment");
    }
    
    // Create escrow account from private key
    // Remove 0x prefix if present
    const cleanPrivateKeyHex = privateKeyHex.startsWith("0x") ? privateKeyHex.slice(2) : privateKeyHex;
    
    // Convert to bytes and create private key
    const privateKeyBytes = new Uint8Array(cleanPrivateKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const privateKey = new Ed25519PrivateKey(privateKeyBytes);
    const escrowAccount = new AptosAccount(privateKey);
    
    // Verify the account address matches the expected escrow wallet
    const escrowAddress = escrowAccount.accountAddress.toString();
    if (escrowAddress !== escrowWalletAddress) {
      console.error(`Escrow address mismatch: ${escrowAddress} vs ${escrowWalletAddress}`);
      throw new Error("Escrow private key does not match configured escrow wallet address");
    }
    
    // Calculate the amount in smallest units (8 decimal places for APT)
    const amountInSmallestUnits = Math.floor(amount * 100000000);
    
    console.log(`Converting ${amount} APT to ${amountInSmallestUnits} octas (smallest units)`);
    
    // Create the transaction payload using the SDK
    const recipientAccountAddress = AccountAddress.fromString(recipientAddress);
    
    console.log("Creating withdrawal transaction");
    
    // Build the transaction
    const transaction = await aptos.transaction.build.simple({
      sender: escrowAccount.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [tokenType],
        functionArguments: [
          recipientAccountAddress,
          amountInSmallestUnits.toString()
        ]
      }
    });
    
    console.log("Signing transaction");
    const signedTransaction = await aptos.transaction.sign({
      signer: escrowAccount,
      transaction
    });
    
    console.log("Submitting transaction");
    const submittedTxn = await aptos.transaction.submit.signedTransaction({
      signedTransaction
    });
    
    console.log("Transaction submitted with hash:", submittedTxn);
    
    // Wait for transaction to complete
    console.log("Waiting for transaction confirmation...");
    const txnResult = await aptos.transaction.waitForTransaction({
      transactionHash: submittedTxn
    });
    
    console.log("Withdrawal transaction completed:", txnResult.hash);
    console.log("Transaction success:", txnResult.success);
    
    if (!txnResult.success) {
      console.error("Transaction failed:", txnResult);
      throw new Error("Transaction execution failed");
    }
    
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
