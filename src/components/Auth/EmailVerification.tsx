
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext';
import { sendVerificationEmail, verifyEmail } from '@/api/userApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits' }).max(6),
});

const EmailVerification = () => {
  const { email, isVerified, setEmail, verifyEmail: contextVerifyEmail } = useUser();
  const { address } = useWallet();
  const [showOTP, setShowOTP] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [testModeActive, setTestModeActive] = useState(false);
  const [autoFilledOTP, setAutoFilledOTP] = useState<string | null>(null);
  
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || '',
    },
  });
  
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });
  
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    setEmailError(null);
    setSendingEmail(true);
    
    try {
      setEmail(values.email);
      
      console.log(`Sending verification email to ${values.email} for wallet ${address}`);
      
      // Call API to send verification email
      const response = await sendVerificationEmail(address, values.email);
      
      if (response && response.success) {
        setShowOTP(true);
        
        // Check if we have an OTP returned (test mode)
        if (response.otp) {
          setTestModeActive(true);
          setAutoFilledOTP(response.otp);
          
          // Auto-fill the OTP for easier testing
          otpForm.setValue('otp', response.otp);
          toast.info('TEST MODE: Verification code auto-filled');
        } else {
          toast.success('Verification code sent to your email');
        }
      } else {
        setEmailError(response?.error || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      setEmailError('An unexpected error occurred. Please try again.');
      toast.error('Failed to send verification email');
    } finally {
      setSendingEmail(false);
    }
  };
  
  const onOTPSubmit = async (values: z.infer<typeof otpSchema>) => {
    if (!address || !email) {
      toast.error('Missing required information');
      return;
    }
    
    setVerifyingOTP(true);
    try {
      console.log(`Verifying OTP ${values.otp} for email ${email} and wallet ${address}`);
      
      const success = await verifyEmail(address, email, values.otp);
      
      if (success) {
        await contextVerifyEmail(values.otp);
        toast.success('Email verified successfully!');
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      toast.error('Failed to verify email');
    } finally {
      setVerifyingOTP(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!email || !address) return;
    
    setSendingEmail(true);
    try {
      const response = await sendVerificationEmail(address, email);
      
      if (response && response.success) {
        if (response.otp) {
          setTestModeActive(true);
          setAutoFilledOTP(response.otp);
          otpForm.setValue('otp', response.otp);
          toast.info('TEST MODE: New verification code auto-filled');
        } else {
          toast.success('Verification code resent');
        }
      } else {
        toast.error(response?.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      toast.error('Failed to resend verification code');
    } finally {
      setSendingEmail(false);
    }
  };
  
  if (isVerified) {
    return (
      <div className="flex items-center p-4 text-sm rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
        <span>Email verified: <span className="font-medium">{email}</span></span>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border p-4 bg-card">
      <h3 className="text-lg font-medium mb-4">Verify Your Email</h3>
      
      {emailError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{emailError}</AlertDescription>
        </Alert>
      )}
      
      {testModeActive && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode Active:</strong> Email verification code is automatically filled in for testing. In production, an actual email would be sent.
            {autoFilledOTP && (
              <div className="mt-1 font-mono bg-muted p-1 rounded text-center">
                {autoFilledOTP}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {!showOTP ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Verify your email to claim rewards and receive important updates
          </p>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={sendingEmail}>
                {sendingEmail ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {testModeActive
              ? 'Test mode active. The verification code has been auto-filled.'
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={handleResendCode}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? 'Sending...' : 'Resend code'}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowOTP(false)}
                    disabled={verifyingOTP}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={verifyingOTP}>
                    {verifyingOTP ? 'Verifying...' : 'Verify Email'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default EmailVerification;
