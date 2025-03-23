
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Mail, Check, Loader } from 'lucide-react';

const EmailVerification: React.FC = () => {
  const { email, setEmail, isVerified, verifyEmail } = useUser();
  const { address } = useWallet();
  const [inputEmail, setInputEmail] = useState(email || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const handleSendOtp = async () => {
    if (!inputEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    setSendingOtp(true);
    
    try {
      // Save email to Supabase
      const { error } = await supabase
        .from('users')
        .upsert({ 
          wallet_address: address,
          email: inputEmail,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error saving email:", error);
        toast.error("Failed to save email. Please try again.");
        setSendingOtp(false);
        return;
      }
      
      // In a real application, this would send an OTP to the user's email
      // For this demo, we'll simulate an API call
      setTimeout(() => {
        setEmail(inputEmail);
        setOtpSent(true);
        setSendingOtp(false);
        toast.success("OTP sent to your email");
      }, 1500);
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("Failed to save email. Please try again.");
      setSendingOtp(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP from your email");
      return;
    }
    
    setVerifyingOtp(true);
    
    const result = await verifyEmail(otp);
    setVerifyingOtp(false);
    
    if (result) {
      // OTP verification was successful, no need to do anything else
      // The toast and state updates are handled in verifyEmail
    }
  };
  
  if (isVerified) {
    return (
      <div className="flex flex-col items-center text-center gap-2 p-4">
        <div className="bg-success/20 p-3 rounded-full mb-2">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h3 className="font-medium text-lg">Email Verified</h3>
        <p className="text-muted-foreground">{email}</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4 p-4 rounded-md border bg-card">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="bg-muted p-3 rounded-full mb-2">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-medium text-lg">Verify Your Email</h3>
        <p className="text-muted-foreground text-sm">
          We need to verify your email to process claims and send you important updates
        </p>
      </div>
      
      {!otpSent ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="email" 
              placeholder="your@email.com" 
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSendOtp} 
            className="w-full"
            disabled={sendingOtp}
          >
            {sendingOtp ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground text-center">
              A 6-digit code has been sent to {email}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleVerifyOtp} 
              className="w-full"
              disabled={verifyingOtp}
            >
              {verifyingOtp ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            <Button
              variant="ghost"
              className="text-xs"
              disabled={sendingOtp}
              onClick={() => {
                setOtpSent(false);
                setOtp('');
              }}
            >
              Change Email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
