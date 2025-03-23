
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
import { sendVerificationEmail } from '@/api/userApi';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits' }).max(6),
});

const EmailVerification = () => {
  const { email, isVerified, setEmail, verifyEmail } = useUser();
  const { address } = useWallet();
  const [showOTP, setShowOTP] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
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
    
    setSendingEmail(true);
    try {
      setEmail(values.email);
      
      // Call API to send verification email
      const result = await sendVerificationEmail(address, values.email);
      
      if (result) {
        setShowOTP(true);
        toast.success('Verification code sent to your email');
        
        // In development mode, the API might return the OTP for easier testing
        if (result) {
          otpForm.setValue('otp', result);
        }
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
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
      const success = await verifyEmail(values.otp);
      
      if (success) {
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
            Enter the 6-digit verification code sent to {email}
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
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default EmailVerification;
